import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { Euler } from 'three'
import { type Box, obstacles } from '../plan/collision'
import { type OperableId, works } from '../plan/interact'
import { type Standing, standingNear } from '../plan/places'
import type { Vec2 } from '../plan/plan'
import { lockPointer } from '../input'
import { floorPoint, isSeeThrough, operableOf, TAP_SLOP, under } from './pointing'
import { useSceneState } from './SceneState'

type Point = { clientX: number; clientY: number }
type Picked = { work: OperableId } | { stand: Vec2 } | null

const angles = new Euler()

// What a press at the point would do: work the first thing under it, or
// stand on it if it is floor, looking through glass that is not itself
// part of a fitting.
function pick(boxes: readonly Box[], ...[point, ...view]: Parameters<typeof under>): Picked {
  for (const hit of under(point, ...view)) {
    const id = operableOf(hit.object)
    if (id) return works(id) ? { work: id } : null
    if (isSeeThrough(hit.object)) continue
    const floor = floorPoint(hit)
    const stand = floor && standingNear(floor, boxes)
    return stand ? { stand } : null
  }
  return null
}

/**
 * Seen from above, a click or a tap works what it lands on: a fitting,
 * anywhere on it, is opened or shut, and the floor is stood on, looking
 * the way the view from above was. A press that travels is a drag, which
 * turns the view instead.
 */
export function Picker({ onToggle, onStand }: { onToggle: (id: OperableId) => void; onStand: (at: Standing) => void }) {
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const canvas = useThree((state) => state.gl.domElement)
  const { open } = useSceneState()
  const boxes = useMemo(() => obstacles(open), [open])
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
      const picked = event.button === 0 && press.travel < TAP_SLOP ? pick(boxes, event, canvas, camera, scene) : null
      press = null
      if (!picked) return
      if ('work' in picked) return onToggle(picked.work)
      // The way the camera is turned, which holds even looking straight down.
      onStand({ position: picked.stand, yaw: angles.setFromQuaternion(camera.quaternion, 'YXZ').y, pitch: 0 })
      // A click of the mouse on the way into the walk is the moment to lock the pointer.
      lockPointer(event)
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
  }, [camera, scene, canvas, boxes, onToggle, onStand, hover])

  // The cursor shows what a click would do. Looked up once a frame at most.
  useFrame(() => {
    if (!hover.moved) return
    canvas.style.cursor = pick(boxes, hover.moved, canvas, camera, scene) ? 'pointer' : ''
    hover.moved = null
  })

  return null
}
