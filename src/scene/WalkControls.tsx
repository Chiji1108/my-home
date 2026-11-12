import { useFrame, useThree } from '@react-three/fiber'
import { type RefObject, useEffect, useState } from 'react'
import { Euler, MathUtils, type PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { move } from '../plan/collision'
import { type OperableId, operable } from '../plan/interact'
import type { Vec2 } from '../plan/plan'
import { BODY_RADIUS, eyeHeightAt, type Standing } from '../plan/places'
import { isLocked, lockPointer } from '../input'
import { floorAmong, TAP_SLOP, under } from './pointing'
import { inReach } from './reach'
import { useSceneState } from './SceneState'

/** Metres per second. */
const SPEED = 1.4
/** Radians turned by a drag as long as the viewport is tall. */
const TURN = 0.4 * Math.PI * 2
/** Radians turned by a locked mouse for each pixel it moves. */
const MOUSE_TURN = 0.002
const MAX_PITCH = MathUtils.degToRad(70)
/** How quickly the camera makes up a jump of the body's, per second. */
const EASE = 12
/** What is left of a jump is dropped once it is this small, in metres and in radians. */
const SETTLED = 1e-3

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

const eye = new Vector3()
const gaze = new Quaternion()
const level = new Quaternion()
const angles = new Euler(0, 0, 0, 'YXZ')

/**
 * First-person walking. The body is a point on the plan with a heading,
 * what `standing` holds, which is moved as it walks, and the camera is where its eye
 * is: it turns and moves with the body in the same frame, with nothing to
 * catch up. Only a jump is eased, and apart from that: taking up the walk,
 * which carries the camera in from wherever it was, and a step up or down
 * between floors.
 *
 * Any pointer looks round by dragging. Let go without having moved, a
 * finger walks to the spot of floor it tapped, and a mouse asks for the
 * pointer to be locked, after which it looks round just by moving. What is
 * within reach to open or shut is kept up to date, and `onToggle` is asked
 * to do it.
 */
export function WalkControls({ standing, onToggle }: { standing: RefObject<Standing>; onToggle: (id: OperableId) => void }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const scene = useThree((state) => state.scene)
  const canvas = useThree((state) => state.gl.domElement)
  const { open, boxes } = useSceneState()

  const [body] = useState(() => ({
    /** Height of the eye above the main floor, which follows the floor the body is on. None until the first frame. */
    eye: null as number | null,
    /** Where a tap on the floor is leading. */
    goal: null as Vec2 | null,
    keys: new Set<string>(),
    /** What is left of a jump: how far the camera still is from the eye, and how far turned from its gaze. */
    lag: new Vector3(),
    skew: new Quaternion(),
  }))

  useEffect(() => {
    let drag: { id: number; x: number; y: number; travel: number } | null = null

    const turn = (dx: number, dy: number, perPixel: number) => {
      const stance = standing.current
      stance.yaw -= dx * perPixel
      stance.pitch = MathUtils.clamp(stance.pitch - dy * perPixel, -MAX_PITCH, MAX_PITCH)
    }

    const onDown = (event: PointerEvent) => {
      if (drag || event.button !== 0 || isLocked()) return
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, travel: 0 }
      canvas.setPointerCapture(event.pointerId)
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== drag?.id) return
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y
      turn(dx, dy, TURN / canvas.clientHeight)
      drag = { id: drag.id, x: event.clientX, y: event.clientY, travel: drag.travel + Math.hypot(dx, dy) }
    }
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== drag?.id) return
      const tapped = event.type === 'pointerup' && drag.travel < TAP_SLOP
      drag = null
      if (!tapped) return
      if (event.pointerType === 'mouse') lockPointer(event)
      // Glass is looked through, so the floor beyond a pane can be tapped.
      else body.goal = floorAmong(under(event, canvas, camera, scene)) ?? body.goal
    }
    const onMouseMove = (event: MouseEvent) => {
      if (isLocked()) turn(event.movementX, event.movementY, MOUSE_TURN)
    }
    // While Meta is held the other keys never report being let go, nor do
    // they once the page has lost the keyboard or the pointer its lock.
    const release = () => body.keys.clear()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Meta') return release()
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.code === 'KeyE') {
        const within = inReach.get()
        if (within && !event.repeat) onToggle(within)
        return
      }
      if (!(event.code in keyMoves)) return
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
    document.addEventListener('mousemove', onMouseMove, { signal })
    document.addEventListener('pointerlockchange', release, { signal })
    return () => listening.abort()
  }, [body, standing, camera, scene, canvas, onToggle])

  // The walk ends with nothing within reach.
  useEffect(() => () => inReach.set(null), [])

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
    const stance = standing.current
    const [x, y] = stance.position
    if (strafe || forward) {
      body.goal = null
      const sin = Math.sin(stance.yaw)
      const cos = Math.cos(stance.yaw)
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
    const next = move(stance.position, step, BODY_RADIUS, boxes)
    // There is no route finding: a goal that the body can no longer close in on is dropped.
    if (body.goal && Math.hypot(next[0] - x, next[1] - y) < reach * 0.2) body.goal = null
    stance.position = next

    const heading: Vec2 = [-Math.sin(stance.yaw), -Math.cos(stance.yaw)]
    inReach.set(operable(next, heading, BODY_RADIUS, open, boxes))

    const height = eyeHeightAt(next) ?? body.eye ?? 0
    eye.set(next[0], height, next[1])
    gaze.setFromEuler(angles.set(stance.pitch, stance.yaw, 0))

    const { lag, skew } = body
    if (body.eye === null) {
      // Taking up the walk: the whole of the way from where the camera is.
      lag.copy(camera.position).sub(eye)
      skew.copy(gaze).invert().premultiply(camera.quaternion)
    } else {
      const left = Math.exp(-EASE * dt)
      // A step between floors is a jump of the eye's height.
      lag.y += body.eye - height
      lag.multiplyScalar(left)
      if (lag.length() < SETTLED) lag.set(0, 0, 0)
      skew.slerp(level, 1 - left)
      if (skew.angleTo(level) < SETTLED) skew.identity()
    }
    body.eye = height
    camera.position.copy(eye).add(lag)
    camera.quaternion.copy(skew).multiply(gaze)
  })

  return null
}
