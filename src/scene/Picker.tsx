import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { type OperableId, works } from '../plan/interact'
import { isSeeThrough, operableOf, TAP_SLOP, under } from './pointing'

type Point = { clientX: number; clientY: number }

// What a press at the point would work: the first thing under it, looking
// through glass that is not itself part of a fitting.
function pick(...[point, ...view]: Parameters<typeof under>) {
  for (const { object } of under(point, ...view)) {
    const id = operableOf(object)
    if (id) return works(id) ? id : null
    if (!isSeeThrough(object)) return null
  }
  return null
}

/**
 * Seen from above, a fitting is opened or shut by clicking or tapping it,
 * anywhere on it. A press that travels is a drag, which turns the view
 * instead.
 */
export function Picker({ onToggle }: { onToggle: (id: OperableId) => void }) {
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const canvas = useThree((state) => state.gl.domElement)
  /** Where a mouse that is not pressed has moved to since the cursor was last set. */
  const [hover] = useState<{ moved: Point | null }>({ moved: null })

  useEffect(() => {
    let press: { id: number; x: number; y: number; travel: number } | null = null

    const onDown = (event: PointerEvent) => {
      press = event.isPrimary ? { id: event.pointerId, x: event.clientX, y: event.clientY, travel: 0 } : null
    }
    const onMove = (event: PointerEvent) => {
      // Nothing held: a press let go of somewhere off the scene is over.
      if (event.buttons === 0) {
        press = null
        if (event.pointerType === 'mouse') hover.moved = { clientX: event.clientX, clientY: event.clientY }
      } else if (event.pointerId === press?.id) {
        press.travel += Math.hypot(event.clientX - press.x, event.clientY - press.y)
        press.x = event.clientX
        press.y = event.clientY
      }
    }
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== press?.id) return
      const picked = event.button === 0 && press.travel < TAP_SLOP ? pick(event, canvas, camera, scene) : null
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
  }, [camera, scene, canvas, onToggle, hover])

  // The cursor shows what a click would do. Looked up once a frame at most.
  useFrame(() => {
    if (!hover.moved) return
    canvas.style.cursor = pick(hover.moved, canvas, camera, scene) ? 'pointer' : ''
    hover.moved = null
  })

  return null
}
