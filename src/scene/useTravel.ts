import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, type Object3D } from 'three'
import type { OperableId } from '../plan/interact'
import { useSceneState } from './SceneState'
import { useShadowsDirty } from './shadows'

/** Something this close to where it is going is put there. */
const AT_REST = 1e-4

/**
 * Moves a fitting, or the doors of a piece of furniture, as it is opened
 * and shut. `place` puts the object the returned ref is given to where it
 * belongs when it has travelled that far, from 0, shut, to 1, open. It is
 * the only thing that places the object: on the first frame, where its
 * state has it, and after that easing towards the state and stopping dead
 * on reaching it. The shadows are drawn again on the frames in which it
 * moves and on no others.
 */
export function useTravel<T extends Object3D>(id: OperableId, place: (object: T, travel: number) => void) {
  const { open } = useSceneState()
  const object = useRef<T>(null)
  const goal = open[id] ? 1 : 0
  /** Null until the object has been placed. */
  const travel = useRef<number | null>(null)
  const shadowsDirty = useShadowsDirty()

  useFrame((_, delta) => {
    if (!object.current || travel.current === goal) return
    const next = travel.current === null ? goal : MathUtils.damp(travel.current, goal, 5, delta)
    travel.current = Math.abs(next - goal) < AT_REST ? goal : next
    place(object.current, travel.current)
    shadowsDirty()
  })

  return object
}
