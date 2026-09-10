"use client";

import { at, set } from "@sanity/mutate";
import {
  type OverlayComponent,
  useDocuments,
} from "@sanity/visual-editing/react";
import { Logger } from "@workspace/logger";
import { stegaClean } from "next-sanity";
import { useEffect } from "react";

const logger = new Logger("inline-text");

const EDIT_ATTR = "data-inline-edit";

/** How long the Studio can take to open the field and focus its input. */
const RECLAIM_MS = 5000;

/** A Portable Text span's text: its own plain string, so its words are typeable. */
const SPAN_TEXT = /\.children\[_key=="[^"]+"\]\.text$/;

/**
 * Opt-in: a flagged `string` element (not `text`, which can hold several
 * lines), or a Portable Text span whose element holds only its text. Never
 * inside a link or button, where a caret click could follow the link.
 */
export function isInlineEditable(
  element: Element,
  path: string,
  type?: string
) {
  const onlyText =
    element.childNodes.length === 1 && element.firstChild instanceof Text;
  if (!onlyText || element.closest("a, button")) {
    return false;
  }
  return element.hasAttribute(EDIT_ATTR)
    ? type === "string"
    : SPAN_TEXT.test(path);
}

function caretOffset(element: HTMLElement): number | null {
  const selection = element.ownerDocument.getSelection();
  if (!selection?.rangeCount || !element.contains(selection.anchorNode)) {
    return null;
  }
  const range = selection.getRangeAt(0);
  const upToCaret = range.cloneRange();
  upToCaret.selectNodeContents(element);
  upToCaret.setEnd(range.endContainer, range.endOffset);
  return upToCaret.toString().length;
}

function placeCaret(element: HTMLElement, offset: number) {
  const range = element.ownerDocument.createRange();
  const text = element.firstChild;
  if (text instanceof Text) {
    range.setStart(text, Math.min(offset, text.length));
    range.collapse(true);
  } else {
    range.selectNodeContents(element);
    range.collapse(false);
  }
  const selection = element.ownerDocument.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * Makes `element` editable until blur, then saves once. Saving mid-edit would
 * re-render the text under the caret. Imperative, because the overlay
 * component unmounts as soon as the pointer leaves.
 */
function startEditing(
  element: HTMLElement,
  save: (text: string) => Promise<unknown>
) {
  const own = element.firstChild;
  if (!(own instanceof Text)) {
    return;
  }
  const ownIsOnlyChild = () =>
    element.firstChild === own && element.childNodes.length === 1;
  // Rewrite React's node in place: Portable Text spans are nodes React keeps
  // and later updates or removes.
  const show = (text: string) => {
    own.data = text;
    if (!ownIsOnlyChild()) {
      element.replaceChildren(own);
    }
  };

  // Last text React rendered, stega included.
  let rendered = own.data;
  // Stega trails the text invisibly; left in, Backspace deletes nothing visible.
  let typed = stegaClean(rendered);
  let caret = typed.length;
  let edited = false;
  let typing = false;
  let composing = false;
  let missedRender = false;
  // Set once a paste or re-home replaces nodes the undo history points at.
  let staleUndo = false;
  let cancelled = false;
  let aborted = false;
  let reclaimed = false;
  const startedAt = Date.now();
  const listeners = new AbortController();

  // The Studio focuses its input once the field's pane opens, even mid-typing;
  // take focus back once.
  const reclaimFocus = () => {
    if (
      reclaimed ||
      Date.now() - startedAt > RECLAIM_MS ||
      element.ownerDocument.hasFocus()
    ) {
      return false;
    }
    reclaimed = true;
    element.focus();
    placeCaret(element, caret);
    return element.ownerDocument.hasFocus();
  };

  // The browser can swap React's node, as a paste over a selection does.
  const keepOwnNode = () => {
    if (ownIsOnlyChild()) {
      return;
    }
    staleUndo = true;
    const offset = caretOffset(element) ?? caret;
    typed = element.textContent ?? "";
    show(typed);
    placeCaret(element, offset);
  };

  const restoreTyped = () => {
    show(typed);
    placeCaret(element, caret);
  };

  const onRender = () => {
    // React removed its node: the DOM is React's again and the path may be gone.
    if (!element.contains(own)) {
      aborted = true;
      element.blur();
      return;
    }
    const now = element.textContent ?? "";
    if (now === typed) {
      return;
    }
    rendered = now;
    if (!edited) {
      typed = stegaClean(now);
      show(typed);
      return;
    }
    // Rewriting mid-composition breaks the IME; restore once it ends.
    if (composing) {
      missedRender = true;
      return;
    }
    restoreTyped();
  };

  // `beforeinput` marks a change as typed; any other change is a render.
  const observer = new MutationObserver(() => {
    if (typing) {
      typing = false;
      keepOwnNode();
      return;
    }
    onRender();
  });

  const onBeforeInput = (event: InputEvent) => {
    // Drops skip the paste cleanup, and stale undo would edit a detached node.
    if (
      event.inputType === "insertFromDrop" ||
      (staleUndo && event.inputType.startsWith("history"))
    ) {
      event.preventDefault();
      return;
    }
    typing = true;
    // A keystroke that changes nothing leaves no mutation to clear the flag.
    setTimeout(() => {
      typing = false;
    });
  };

  const onInput = () => {
    typing = false;
    edited = true;
    // Keep the text from before a mid-composition render until it's restored.
    if (missedRender) {
      return;
    }
    typed = element.textContent ?? "";
    caret = caretOffset(element) ?? caret;
    keepOwnNode();
  };

  const onSelectionChange = () => {
    // Firefox fires no blur when a focused element is removed.
    if (!element.isConnected) {
      end();
      return;
    }
    caret = caretOffset(element) ?? caret;
  };

  const onCompositionStart = () => {
    composing = true;
  };
  const onCompositionEnd = () => {
    composing = false;
    if (missedRender) {
      missedRender = false;
      restoreTyped();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    // Enter while composing picks an IME candidate.
    if (event.isComposing) {
      return;
    }
    // The text is one line, so Enter saves.
    if (event.key === "Enter") {
      event.preventDefault();
      element.blur();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelled = true;
      element.blur();
    }
  };

  const onPaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const selection = element.ownerDocument.getSelection();
    if (!selection?.rangeCount) {
      return;
    }
    // Newlines to spaces: `textContent` drops line breaks and glues the words.
    const pasted = element.ownerDocument.createTextNode(
      (event.clipboardData?.getData("text/plain") ?? "").replace(/\s+/g, " ")
    );
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(pasted);
    range.setStartAfter(pasted);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    staleUndo = true;
    // A DOM insert fires no `input` event.
    onInput();
  };

  const end = () => {
    listeners.abort();
    observer.disconnect();
    element.removeAttribute("contenteditable");
    element.removeAttribute("spellcheck");
    element.style.removeProperty("outline");
  };

  const onBlur = () => {
    if (reclaimFocus()) {
      return;
    }
    end();
    // A removed element (block deleted, field cleared elsewhere) never saves.
    if (aborted || !element.isConnected) {
      return;
    }
    const text = stegaClean(typed);
    // Empty counts as cancel: a cleared field unmounts its element and fails
    // validation.
    if (cancelled || !text.trim() || text === stegaClean(rendered)) {
      show(rendered);
      return;
    }
    show(text);
    // A rejected patch puts the rendered text back, unless React re-rendered.
    save(text).catch(() => {
      if (element.contains(own) && own.data === text) {
        own.data = rendered;
      }
    });
  };

  // Plain text only: Cmd+B/I and rich drops would add formatting no save keeps.
  element.contentEditable = "plaintext-only";
  element.spellcheck = false;
  // The site's global `:focus-visible` ring would outline the text mid-edit.
  element.style.outline = "none";
  show(typed);
  const { signal } = listeners;
  element.addEventListener("beforeinput", onBeforeInput, { signal });
  element.addEventListener("input", onInput, { signal });
  element.addEventListener("keydown", onKeyDown, { signal });
  element.addEventListener("paste", onPaste, { signal });
  element.addEventListener("compositionstart", onCompositionStart, { signal });
  element.addEventListener("compositionend", onCompositionEnd, { signal });
  element.addEventListener("blur", onBlur, { signal });
  element.ownerDocument.addEventListener("selectionchange", onSelectionChange, {
    signal,
  });
  observer.observe(element, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  element.focus();
  placeCaret(element, caret);
}

/**
 * Double-click to type into the text; renders nothing. Writes to the overlay
 * node's own `id` and `path`, so text from a referenced document saves there.
 */
export const InlineText: OverlayComponent = ({ element, node }) => {
  const { getDocument } = useDocuments();
  const { id, path } = node;

  useEffect(() => {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    const target = element;

    const onDoubleClick = (event: Event) => {
      // The overlay remounts this on every hover, so a session may be running.
      if (target.isContentEditable) {
        return;
      }
      event.preventDefault();

      startEditing(target, (text) =>
        // In the chain, because `getDocument` can throw for an untracked id.
        Promise.resolve()
          .then(() => getDocument(id).patch([at(path, set(text))]))
          .catch((error: unknown) => {
            logger.error(`patch failed for ${path}`, error);
            throw error;
          })
      );
    };

    // Each click the overlay sees opens this field in the Studio, which takes
    // focus. Hide the double-click's second click and caret clicks mid-edit.
    const onClickCapture = (event: MouseEvent) => {
      if (
        (event.detail > 1 || target.isContentEditable) &&
        event.target instanceof Node &&
        target.contains(event.target)
      ) {
        event.stopPropagation();
      }
    };

    const listeners = new AbortController();
    const { signal } = listeners;
    target.addEventListener("dblclick", onDoubleClick, { signal });
    target.ownerDocument.defaultView?.addEventListener(
      "click",
      onClickCapture,
      { capture: true, signal }
    );
    return () => listeners.abort();
  }, [element, id, path, getDocument]);

  return null;
};
