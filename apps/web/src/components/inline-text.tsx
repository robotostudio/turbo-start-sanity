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

/** The macOS, Windows and Chrome default; a slower system setting replays the
 * first click early, ending the edit unsaved. The next double-click then works. */
const DOUBLE_CLICK_MS = 500;

/** A Portable Text span's text: its own plain string, so its words are typeable. */
const SPAN_TEXT = /\.children\[_key=="[^"]+"\]\.text$/;

/**
 * Opt-in: a flagged element, or a Portable Text span whose element holds only
 * its text. Never inside a click target, whose handler the click capture would
 * swallow. Only flag `string` fields: a multi-line `text` field looks the same.
 */
export function isInlineEditable(element: Element, path: string) {
  const onlyText =
    element.childNodes.length === 1 && element.firstChild instanceof Text;
  if (
    !onlyText ||
    element.closest("a, button, summary, label, [role=button]")
  ) {
    return false;
  }
  return element.hasAttribute(EDIT_ATTR) || SPAN_TEXT.test(path);
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
  save: (text: string) => Promise<unknown>,
  onEnter: () => void
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
    own.textContent = text;
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
  // Text and selection as the IME started, to rebuild from after a missed render.
  let composeFrom = { text: typed, start: caret, end: caret };
  // Set once a paste or re-home replaces nodes the undo history points at.
  let staleUndo = false;
  let cancelled = false;
  let aborted = false;
  const listeners = new AbortController();

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
      // Rewriting the node collapses a live range to offset 0.
      restoreTyped();
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
    // After a mid-composition render the DOM is stale; compositionend rebuilds.
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
    // `caret` is the selection end; a composition replaces the selection.
    const selected = element.ownerDocument.getSelection()?.toString() ?? "";
    composeFrom = {
      text: typed,
      start: Math.max(0, caret - selected.length),
      end: caret,
    };
  };
  const onCompositionEnd = (event: CompositionEvent) => {
    composing = false;
    if (!missedRender) {
      return;
    }
    missedRender = false;
    const { text, start, end } = composeFrom;
    // Empty data is a cancelled composition, which browsers undo in full.
    if (!event.data) {
      typed = text;
      caret = end;
    } else {
      typed = text.slice(0, start) + event.data + text.slice(end);
      caret = start + event.data.length;
    }
    restoreTyped();
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
      onEnter();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelled = true;
      element.blur();
    }
  };

  const onPaste = (event: ClipboardEvent) => {
    const text = event.clipboardData?.getData("text/plain") ?? "";
    // A one-line paste goes through the browser, so undo still covers it.
    if (!/[\r\n\t]/.test(text)) {
      return;
    }
    event.preventDefault();
    const selection = element.ownerDocument.getSelection();
    if (!selection?.rangeCount) {
      return;
    }
    // Newlines to spaces: `textContent` drops line breaks and glues the words.
    const pasted = element.ownerDocument.createTextNode(
      text.replace(/\s+/g, " ")
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
    // Only a local failure rejects; the Studio's own write is fire-and-forget.
    save(text).catch(() => {
      if (element.contains(own) && own.data === text) {
        own.textContent = rendered;
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
    let pendingClick: ReturnType<typeof setTimeout> | undefined;
    const cancelPending = () => {
      clearTimeout(pendingClick);
      pendingClick = undefined;
    };

    // A synthetic click passes the capture below and reaches the overlay,
    // which opens this field in the Studio. The overlay only honours a click
    // on its hovered element, so hover it for the duration of the click.
    const openInStudio = () => {
      cancelPending();
      for (const type of ["mouseenter", "click", "mouseleave"]) {
        target.dispatchEvent(
          new MouseEvent(type, { bubbles: type === "click" })
        );
      }
    };

    // The overlay unmounts this component on leave, taking the timer with it.
    const onLeaveCapture = (event: MouseEvent) => {
      if (
        event.isTrusted &&
        event.target === target &&
        pendingClick !== undefined
      ) {
        openInStudio();
      }
    };

    const onDoubleClick = (event: Event) => {
      cancelPending();
      // The overlay remounts this on every hover, so a session may be running.
      if (target.isContentEditable) {
        return;
      }
      event.preventDefault();

      startEditing(
        target,
        (text) =>
          // In the chain, because `getDocument` can throw for an untracked id.
          Promise.resolve()
            .then(() => getDocument(id).patch([at(path, set(text))]))
            .catch((error: unknown) => {
              logger.error(`patch failed for ${path}`, error);
              throw error;
            }),
        openInStudio
      );
    };

    // The Studio focuses its input when a click opens the field, which ends
    // an edit mid-word. So no real click reaches the overlay: a single click
    // is replayed once it is clearly not a double-click, and a double-click
    // opens the field after Enter instead.
    const onClickCapture = (event: MouseEvent) => {
      if (
        !event.isTrusted ||
        !(event.target instanceof Node && target.contains(event.target))
      ) {
        return;
      }
      event.stopPropagation();
      cancelPending();
      if (!target.isContentEditable) {
        pendingClick = setTimeout(openInStudio, DOUBLE_CLICK_MS);
      }
    };

    const listeners = new AbortController();
    const { signal } = listeners;
    target.addEventListener("dblclick", onDoubleClick, { signal });
    // Before the overlay's schema handshake mounts this, a double-click falls
    // through to stock click-to-edit; the text cursor marks it armed.
    const cursor = target.style.cursor;
    target.style.cursor = "text";
    const view = target.ownerDocument.defaultView;
    view?.addEventListener("click", onClickCapture, { capture: true, signal });
    view?.addEventListener("mouseleave", onLeaveCapture, {
      capture: true,
      signal,
    });
    return () => {
      cancelPending();
      listeners.abort();
      target.style.cursor = cursor;
    };
  }, [element, id, path, getDocument]);

  return null;
};
