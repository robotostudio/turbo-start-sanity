"use client";

import { at, set } from "@sanity/mutate";
import type { OverlayComponent } from "@sanity/visual-editing/react";
import { useDocuments } from "@sanity/visual-editing/react";
import { Logger } from "@workspace/logger";
import { stegaClean } from "next-sanity";
import { useEffect } from "react";

const logger = new Logger("inline-text");

/** Set by a block on an element that renders one plain string field. */
const EDIT_ATTR = "data-inline-edit";

/** A Portable Text span's text, `…[_key=="b"].children[_key=="s"].text`: its
 * own plain string, so its words are typeable. Marks, links and paragraph
 * breaks stay in the Studio form. */
const SPAN_TEXT = /\.children\[_key=="[^"]+"\]\.text$/;

/**
 * Whether double-click typing arms here. Opt-in, because the resolver also
 * sees every nav link, button label and badge:
 * - a flagged `string` element (not `text`: it can hold several lines, and
 *   Enter saves), or
 * - a Portable Text span whose element holds only its text: a one-span
 *   paragraph, or the bold/italic run inside one. A mixed paragraph renders
 *   its plain runs straight into the `<p>`, so those have no element to type in.
 * Never inside a link or button: with the overlay toggled off its click
 * capture is gone, so a click to move the caret would follow the link.
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

/** Caret position as a character offset, so it survives the text being
 * rewritten under it. */
function caretOffset(element: HTMLElement): number | null {
  const selection = element.ownerDocument.defaultView?.getSelection();
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
  const selection = element.ownerDocument.defaultView?.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * Turns one element into a text field until blur, then saves once. Imperative
 * and detached from React: the overlay component unmounts when the pointer
 * leaves, so an effect cleanup would end the session mid-sentence.
 *
 * - Strip stega first: it trails the text invisibly, so Backspace deleted
 *   nothing visible for dozens of presses.
 * - Save only on blur: each save re-renders, and a render overwrites the
 *   screen, so typed characters vanished and came back.
 * - A render landing mid-edit (the last save's refresh, a Studio edit) gets
 *   the typed text put back over it; Escape shows the newest render.
 * - Rewrite React's text node in place, never swap it: Portable Text spans are
 *   nodes React holds on to, and it would later update or remove a stray one.
 * - No save, or a failed one: restore React's text with its stega, so the page
 *   never shows a value the document lacks and the overlay finds it again.
 * - React removes its node mid-edit: end without saving or touching its DOM.
 */
function startEditing(
  element: HTMLElement,
  save: (text: string) => Promise<unknown>
) {
  const own = element.firstChild;
  if (!(own instanceof Text)) {
    return;
  }
  const show = (text: string) => {
    own.nodeValue = text;
    // Typing can leave the browser's own nodes in place of React's.
    if (element.firstChild !== own || element.childNodes.length > 1) {
      element.replaceChildren(own);
    }
  };

  // What React last wrote, stega included.
  let rendered = own.nodeValue ?? "";
  let typed = stegaClean(rendered);
  let caret = typed.length;
  let edited = false;
  let typing = false;
  let composing = false;
  let cancelled = false;
  let aborted = false;

  // The browser may swap React's node while editing (a paste over a selection
  // does); put it back, so React's later updates land on a node still in the
  // page and the removal check below never mistakes the swap for React's.
  const keepOwnNode = () => {
    if (element.firstChild === own && element.childNodes.length === 1) {
      return;
    }
    const offset = caretOffset(element) ?? caret;
    typed = element.textContent ?? "";
    show(typed);
    placeCaret(element, offset);
  };

  const onRender = () => {
    // React removed its node (span restructured, field cleared): the DOM is
    // React's now, and the path may no longer exist.
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
      // Nothing typed yet: follow the update, minus its stega.
      typed = stegaClean(now);
      show(typed);
      return;
    }
    if (composing) {
      return;
    }
    show(typed);
    placeCaret(element, caret);
  };

  // May run before the keystroke's `input` event, so `beforeinput` is the
  // marker that says "the editor did this". Any other change is a render.
  const observer = new MutationObserver(() => {
    if (typing) {
      typing = false;
      keepOwnNode();
      return;
    }
    onRender();
  });

  const onBeforeInput = () => {
    typing = true;
    // Backspace at the start changes nothing, so no mutation clears the flag,
    // and a stale one lets the next render through over the typed text.
    setTimeout(() => {
      typing = false;
    });
  };

  // `execCommand` fires no `beforeinput`, but its `input` lands before the
  // observer runs, so re-homing the text here covers pastes too.
  const onInput = () => {
    typing = false;
    edited = true;
    typed = element.textContent ?? "";
    caret = caretOffset(element) ?? caret;
    keepOwnNode();
  };

  const onSelectionChange = () => {
    caret = caretOffset(element) ?? caret;
  };

  const onCompositionStart = () => {
    composing = true;
  };
  const onCompositionEnd = () => {
    composing = false;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    // Enter while composing picks an IME candidate; it does not end the edit.
    if (event.isComposing) {
      return;
    }
    // A string holds one line and a span cannot split a paragraph, so Enter
    // saves rather than opening a line that could never be stored.
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
    // One line: a pasted newline becomes a line break `textContent` drops,
    // gluing the words either side of it together.
    const text = (event.clipboardData?.getData("text/plain") ?? "").replace(
      /\s+/g,
      " "
    );
    // `execCommand` is deprecated but the only one-liner that inserts at the
    // caret with undo intact; swap for a Range insert if a browser drops it.
    element.ownerDocument.execCommand("insertText", false, text);
  };

  const onBlur = () => {
    observer.disconnect();
    element.removeEventListener("beforeinput", onBeforeInput);
    element.removeEventListener("input", onInput);
    element.removeEventListener("keydown", onKeyDown);
    element.removeEventListener("paste", onPaste);
    element.removeEventListener("compositionstart", onCompositionStart);
    element.removeEventListener("compositionend", onCompositionEnd);
    element.ownerDocument.removeEventListener(
      "selectionchange",
      onSelectionChange
    );
    element.removeAttribute("contenteditable");
    element.removeAttribute("spellcheck");
    if (aborted) {
      return;
    }

    const text = stegaClean(typed);
    // Cancelled, unchanged, or emptied. A cleared field unmounts its element
    // and fails validation, so empty counts as a cancel.
    if (cancelled || !text.trim() || text === stegaClean(rendered)) {
      show(rendered);
      return;
    }
    show(text);
    save(text).catch(() => show(rendered));
  };

  show(typed);
  // `plaintext-only` keeps Cmd+B/I and rich drops from adding formatting the
  // save could never keep.
  element.contentEditable = "plaintext-only";
  element.spellcheck = false;
  element.addEventListener("beforeinput", onBeforeInput);
  element.addEventListener("input", onInput);
  element.addEventListener("keydown", onKeyDown);
  element.addEventListener("paste", onPaste);
  element.addEventListener("compositionstart", onCompositionStart);
  element.addEventListener("compositionend", onCompositionEnd);
  element.addEventListener("blur", onBlur, { once: true });
  element.ownerDocument.addEventListener("selectionchange", onSelectionChange);
  observer.observe(element, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  element.focus();
  placeCaret(element, caret);
}

/**
 * Double-click to type into a string or Portable Text span; renders nothing.
 * Writes to the overlay node's own `id` and `path`, as Sanity's overlay
 * examples do, so text from a referenced document saves to that document.
 * Only mounted in Presentation: custom components wait for the optimistic
 * actor, which only the Presentation connection sets up.
 */
export const InlineText: OverlayComponent = ({ element, node }) => {
  const { getDocument } = useDocuments();
  const { id, path } = node;

  useEffect(() => {
    // `ElementNode` is `HTMLElement | SVGElement`; only the former is typeable.
    if (!(element instanceof HTMLElement)) {
      return;
    }
    const target = element;

    const onDoubleClick = (event: Event) => {
      // A session already running: the overlay component remounts whenever the
      // pointer re-enters, so this listener can be re-added mid-edit.
      if (target.isContentEditable) {
        return;
      }
      event.preventDefault();

      startEditing(target, (text) =>
        // Inside the chain, so a throwing `getDocument` (a document the overlay
        // is not tracking) fails like a rejected write instead of escaping.
        Promise.resolve()
          .then(() => getDocument(id).patch([at(path, set(text))]))
          .catch((error: unknown) => {
            logger.error(`patch failed for ${path}`, error);
            throw error;
          })
      );
    };

    target.addEventListener("dblclick", onDoubleClick);
    return () => target.removeEventListener("dblclick", onDoubleClick);
  }, [element, id, path, getDocument]);

  return null;
};
