import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { Euler, MathUtils, type PerspectiveCamera, Quaternion, Raycaster, Vector2, Vector3 } from 'three'
import { move, obstacles } from '../plan/collision'
import { floorLevelAt, type Vec2 } from '../plan/plan'
import { EYE_HEIGHT, type EyeViewpoint } from '../plan/viewpoints'
import { useSceneState } from './SceneState'

const BODY_RADIUS = 0.2
/** Metres per second. */
const SPEED = 1.4
/** Radians turned by a drag as long as the viewport is tall, as in the room views. */
const TURN = 0.4 * Math.PI * 2
const MAX_PITCH = MathUtils.degToRad(70)
/** Pixels a pointer may travel and still count as a tap. */
const TAP_SLOP = 6
/** A tap counts as on the floor up to this height, which takes in the rug. */
const FLOOR_TOP = 0.05
/** How quickly the camera catches up with the body, per second. */
const EASE = 12

const keyMoves: Record<string, readonly [strafe: number, forward: number]> = {
  KeyW: [0, 1],
  KeyS: [0, -1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
}

// Controls that put the arrow keys to their own use while focused.
const usesArrows = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.matches('input, select, textarea, [contenteditable]')

const raycaster = new Raycaster()
const pointer = new Vector2()
const eye = new Vector3()
const normal = new Vector3()
const gaze = new Quaternion()
const angles = new Euler(0, 0, 0, 'YXZ')

/**
 * First-person walking. The body is a point on the plan with a heading; the
 * camera follows it, which also carries it in from wherever it was when the
 * walk began. Yaw 0 looks north and grows turning left.
 */
export function WalkControls({ start }: { start: EyeViewpoint }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const scene = useThree((state) => state.scene)
  const canvas = useThree((state) => state.gl.domElement)
  const { wallOpen } = useSceneState()
  const boxes = useMemo(() => obstacles({ wallOpen }), [wallOpen])

  const [body] = useState(() => {
    const dx = start.lookAt[0] - start.position[0]
    const dy = start.lookAt[1] - start.position[1]
    return {
      position: start.position as Vec2,
      yaw: Math.atan2(-dx, -dy),
      pitch: Math.atan2(start.lookAtHeight - EYE_HEIGHT, Math.hypot(dx, dy)),
      /** Where a tap on the floor is leading. */
      goal: null as Vec2 | null,
      keys: new Set<string>(),
    }
  })

  useEffect(() => {
    camera.zoom = 1
    camera.updateProjectionMatrix()
  }, [camera])

  useEffect(() => {
    let drag: { id: number; x: number; y: number; travel: number } | null = null

    const floorAt = (event: PointerEvent): Vec2 | null => {
      const rect = canvas.getBoundingClientRect()
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((event.clientY - rect.top) / rect.height) * 2,
      )
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(scene.children)[0]
      if (!hit?.face || hit.point.y > FLOOR_TOP) return null
      // Facing up, so not the foot of a wall or of a piece of furniture.
      const facesUp = normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).y > 0.9
      return facesUp ? [hit.point.x, hit.point.z] : null
    }

    const onDown = (event: PointerEvent) => {
      if (drag) return
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, travel: 0 }
      canvas.setPointerCapture(event.pointerId)
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== drag?.id) return
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y
      const turn = TURN / canvas.clientHeight
      body.yaw -= dx * turn
      body.pitch = MathUtils.clamp(body.pitch - dy * turn, -MAX_PITCH, MAX_PITCH)
      drag = { id: drag.id, x: event.clientX, y: event.clientY, travel: drag.travel + Math.hypot(dx, dy) }
    }
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== drag?.id) return
      const tapped = event.type === 'pointerup' && event.button === 0 && drag.travel < TAP_SLOP
      if (tapped) body.goal = floorAt(event) ?? body.goal
      drag = null
    }
    // While Meta is held the other keys never report being let go.
    const release = () => body.keys.clear()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Meta') return release()
      if (!(event.code in keyMoves) || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.code.startsWith('Arrow')) {
        if (usesArrows(event.target)) return
        // Keeps the arrow keys from scrolling the row of viewpoints.
        event.preventDefault()
      }
      body.keys.add(event.code)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Meta') release()
      else body.keys.delete(event.code)
    }

    const listening = new AbortController()
    const { signal } = listening
    canvas.addEventListener('pointerdown', onDown, { signal })
    canvas.addEventListener('pointermove', onMove, { signal })
    canvas.addEventListener('pointerup', onUp, { signal })
    canvas.addEventListener('pointercancel', onUp, { signal })
    window.addEventListener('keydown', onKeyDown, { signal })
    window.addEventListener('keyup', onKeyUp, { signal })
    window.addEventListener('blur', release, { signal })
    return () => listening.abort()
  }, [body, camera, scene, canvas])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    let strafe = 0
    let forward = 0
    for (const code of body.keys) {
      strafe += keyMoves[code]?.[0] ?? 0
      forward += keyMoves[code]?.[1] ?? 0
    }

    // The step to take this frame: keys win over a tapped goal.
    let step: Vec2 = [0, 0]
    let reach = SPEED * dt
    const [x, y] = body.position
    if (strafe || forward) {
      body.goal = null
      const sin = Math.sin(body.yaw)
      const cos = Math.cos(body.yaw)
      const scale = reach / Math.hypot(strafe, forward)
      step = [(cos * strafe - sin * forward) * scale, (-sin * strafe - cos * forward) * scale]
    } else if (body.goal) {
      const dx = body.goal[0] - x
      const dy = body.goal[1] - y
      const distance = Math.hypot(dx, dy)
      reach = Math.min(reach, distance)
      if (distance < 0.02) body.goal = null
      else step = [(dx / distance) * reach, (dy / distance) * reach]
    }

    // Run even when standing still, so that a closing sliding wall moves the body aside.
    const next = move(body.position, step, BODY_RADIUS, boxes)
    // There is no route finding: a goal that the body can no longer close in on is dropped.
    if (body.goal && Math.hypot(next[0] - x, next[1] - y) < reach * 0.2) body.goal = null
    body.position = next

    const ease = 1 - Math.exp(-EASE * dt)
    // The eye rides at its height above whichever floor the body is on.
    camera.position.lerp(eye.set(next[0], (floorLevelAt(next) ?? 0) + EYE_HEIGHT, next[1]), ease)
    camera.quaternion.slerp(gaze.setFromEuler(angles.set(body.pitch, body.yaw, 0)), ease)
  })

  return null
}
