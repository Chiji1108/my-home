import { useSyncExternalStore } from 'react'

// How the page is being worked, read from the events themselves rather
// than guessed from the device: whether the pointer is locked, and what
// kind of pointer was last put down.

const onLockChange = (listener: () => void) => {
  document.addEventListener('pointerlockchange', listener)
  return () => document.removeEventListener('pointerlockchange', listener)
}

// Where the browser has no pointer lock at all the element is undefined, not null.
export const isLocked = () => Boolean(document.pointerLockElement)
/** Whether the pointer is locked, which is what looking round with a mouse takes. */
export const useLocked = () => useSyncExternalStore(onLockChange, isLocked)

// A click is a pointer event in some browsers and a mouse event in others,
// where what made it is told from the last pointer put down, and from the
// count of clicks, which is none when a key did it.
const byMouse = (event: MouseEvent) =>
  'pointerType' in event ? event.pointerType === 'mouse' : !touching && event.detail > 0

/**
 * Asks for the pointer to be locked. Only a mouse can be, and only from
 * within the handling of something the user did, so this is called with
 * the event. Where there is no locking, or it is refused, things are left
 * as they were, and the mouse looks round by dragging.
 */
export function lockPointer(event: MouseEvent) {
  if (!byMouse(event) || isLocked()) return
  // Browsers that return a promise reject it when they refuse.
  void Promise.resolve(document.body.requestPointerLock?.()).catch(() => {})
}

let touching = false
const listeners = new Set<() => void>()
window.addEventListener(
  'pointerdown',
  (event) => {
    const next = event.pointerType !== 'mouse'
    if (next === touching) return
    touching = next
    for (const listener of listeners) listener()
  },
  { capture: true },
)

const onTouching = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Whether the last pointer put down was a finger or a pen rather than a mouse. */
export const useTouching = () => useSyncExternalStore(onTouching, () => touching)
