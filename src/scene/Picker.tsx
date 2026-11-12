import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import type { Object3D } from 'three'
import { type OperableId, works } from '../plan/interact'
import { isSeeThrough, TAP_SLOP, under } from './pointing'

/** The id that `useTravel` leaves on what it moves, looked for on the object and up through its parents. */
const operableOf = (object: Object3D | null): OperableId | undefined =>
  object ? (object.userData.operable ?? operableOf(object.parent)) : undefined

/**
 * Seen from above, a fitting is opened or shut by clicking or tapping it.
 * What is picked is the first thing under the pointer, looking through
 * glass that is not itself part of a fitting. A press that travels is a
 * drag, which turns the view instead.
 */
export function Picker({ onToggle }: { onToggle: (id: OperableId) => void }) {
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const canvas = useThree((state) => state.gl.domElement)

  useEffect(() => {
    let press: { id: number; x: number; y: number; travel: number } | null = null

    const pick = (event: PointerEvent) => {
      for (const { object } of under(event, canvas, camera, scene)) {
        const id = operableOf(object)
        if (id) return works(id) ? id : null
        if (!isSeeThrough(object)) return null
      }
      return null
    }

    const onDown = (event: PointerEvent) => {
      press = event.isPrimary ? { id: event.pointerId, x: event.clientX, y: event.clientY, travel: 0 } : null
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerId === press?.id) {
        press.travel += Math.hypot(event.clientX - press.x, event.clientY - press.y)
        press.x = event.clientX
        press.y = event.clientY
      } else if (event.pointerType === 'mouse' && event.buttons === 0) {
        canvas.style.cursor = pick(event) ? 'pointer' : ''
      }
    }
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== press?.id) return
      const picked = event.button === 0 && press.travel < TAP_SLOP ? pick(event) : null
      press = null
      if (picked) onToggle(picked)
    }
    const onCancel = () => {
      press = null
    }

    const listening = new AbortController()
    const { signal } = listening
    canvas.addEventListener('pointerdown', onDown, { signal })
    canvas.addEventListener('pointermove', onMove, { signal })
    canvas.addEventListener('pointerup', onUp, { signal })
    canvas.addEventListener('pointercancel', onCancel, { signal })
    return () => {
      listening.abort()
      canvas.style.cursor = ''
    }
  }, [camera, scene, canvas, onToggle])

  return null
}
