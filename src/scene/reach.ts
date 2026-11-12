import { useSyncExternalStore } from 'react'
import type { OperableId } from '../plan/interact'

// What the walk has within reach to open or shut. It changes as the body
// moves, so it is kept out of the scene's state: only what shows it is
// drawn again when it changes.
let within: OperableId | null = null
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const inReach = {
  get: () => within,
  set(next: OperableId | null) {
    if (next === within) return
    within = next
    for (const listener of listeners) listener()
  },
}

export const useInReach = () => useSyncExternalStore(subscribe, inReach.get)
