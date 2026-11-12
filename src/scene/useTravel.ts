import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { MathUtils, type Object3D } from 'three'
import type { OperableId } from '../plan/interact'
import { useSceneState } from './SceneState'
import { useShadowsDirty } from './shadows'

/** Something this close to where it is going is put there. */
const AT_REST = 1e-4

/**
 * Moves a fitting, or the doors of a piece of furniture, as it is opened
 * and shut. `place` puts the object the returned ref is given to where it
 * belongs when it has travelled that far, from 0, shut, to 1, open. The
 * travel eases towards the state and stops dead on reaching it, and the
 * shadows are drawn again only on the frames in which it moves.
 */
export function useTravel<T extends Object3D>(id: OperableId, place: (object: T, travel: number) => void) {
  const { open } = useSceneState()
  const object = useRef<T>(null)
  const goal = open[id] ? 1 : 0
  const travel = useRef(goal)
  const shadowsDirty = useShadowsDirty()

  useLayoutEffect(() => {
    if (object.current) place(object.current, travel.current)
  })

  useFrame((_, delta) => {
    if (!object.current || travel.current === goal) return
    const next = MathUtils.damp(travel.current, goal, 5, delta)
    travel.current = Math.abs(next - goal) < AT_REST ? goal : next
    place(object.current, travel.current)
    shadowsDirty()
  })

  return object
}
