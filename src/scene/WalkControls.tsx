import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { Euler, MathUtils, type PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { move, obstacles } from '../plan/collision'
import { type OperableId, operable } from '../plan/interact'
import type { Vec2 } from '../plan/plan'
import { eyeHeightAt, eyeHeightOf, type Place } from '../plan/places'
import { isLocked, lockPointer } from '../input'
import { isSeeThrough, TAP_SLOP, under } from './pointing'
import { inReach } from './reach'
import { useSceneState } from './SceneState'

const BODY_RADIUS = 0.2
/** Metres per second. */
const SPEED = 1.4
/** Radians turned by a drag as long as the viewport is tall. */
const TURN = 0.4 * Math.PI * 2
/** Radians turned by a locked mouse for each pixel it moves. */
const MOUSE_TURN = 0.0022
const MAX_PITCH = MathUtils.degToRad(70)
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

// Controls that are typed into, or that a letter picks an option in.
const takesLetters = (target: EventTarget | null) =>
  usesArrows(target) && !(target instanceof HTMLInputElement && ['radio', 'checkbox', 'range'].includes(target.type))

const eye = new Vector3()
const normal = new Vector3()
const gaze = new Quaternion()
const angles = new Euler(0, 0, 0, 'YXZ')

// Where the body is and which way it looks on taking up the walk at a place.
function standingAt(place: Place) {
  const dx = place.lookAt[0] - place.position[0]
  const dy = place.lookAt[1] - place.position[1]
  return {
    position: place.position as Vec2,
    yaw: Math.atan2(-dx, -dy),
    /** Height of the eye above the main floor, which follows the floor the body is on. */
    eye: eyeHeightOf(place),
    pitch: Math.atan2(place.lookAtHeight - eyeHeightOf(place), Math.hypot(dx, dy)),
    /** Where a tap on the floor is leading. */
    goal: null as Vec2 | null,
  }
}

/**
 * First-person walking. The body is a point on the plan with a heading; the
 * camera follows it, which also carries it in from wherever it was when the
 * walk began, and on to each place it is sent to. Yaw 0 looks north and
 * grows turning left.
 *
 * A mouse looks round while the pointer is locked, which a click on the
 * scene asks for. A finger looks round by dragging, and a tap on the floor
 * walks there. What is within reach to open or shut is kept up to date,
 * and `onToggle` is asked to do it.
 */
export function WalkControls({ shot, onToggle }: { shot: { place: Place }; onToggle: (id: OperableId) => void }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const scene = useThree((state) => state.scene)
  const canvas = useThree((state) => state.gl.domElement)
  const { open } = useSceneState()
  const boxes = useMemo(() => obstacles(open), [open])

  const [body] = useState(() => ({ ...standingAt(shot.place), keys: new Set<string>() }))

  // `shot` is a new value each time a place is asked for, the same one included.
  useEffect(() => {
    Object.assign(body, standingAt(shot.place))
  }, [body, shot])

  useEffect(() => {
    let drag: { id: number; x: number; y: number; travel: number } | null = null

    const floorAt = (event: PointerEvent): Vec2 | null => {
      // Glass is looked through, so the floor beyond a pane can be tapped.
      const hit = under(event, canvas, camera, scene).find(({ object }) => !isSeeThrough(object))
      if (!hit?.face || hit.point.y > FLOOR_TOP) return null
      // Facing up, so not the foot of a wall or of a piece of furniture.
      const facesUp = normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).y > 0.9
      return facesUp ? [hit.point.x, hit.point.z] : null
    }

    const turn = (dx: number, dy: number, perPixel: number) => {
      body.yaw -= dx * perPixel
      body.pitch = MathUtils.clamp(body.pitch - dy * perPixel, -MAX_PITCH, MAX_PITCH)
    }

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return lockPointer(event)
      if (drag) return
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
      const tapped = event.type === 'pointerup' && event.button === 0 && drag.travel < TAP_SLOP
      if (tapped) body.goal = floorAt(event) ?? body.goal
      drag = null
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
        if (within && !event.repeat && !takesLetters(event.target)) onToggle(within)
        return
      }
      if (!(event.code in keyMoves)) return
      if (event.code.startsWith('Arrow')) {
        if (usesArrows(event.target)) return
        // Keeps the arrow keys from scrolling the row of places.
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
    document.addEventListener('mousemove', onMouseMove, { signal })
    document.addEventListener('pointerlockchange', release, { signal })
    return () => listening.abort()
  }, [body, camera, scene, canvas, onToggle])

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

    const heading: Vec2 = [-Math.sin(body.yaw), -Math.cos(body.yaw)]
    inReach.set(operable(next, heading, BODY_RADIUS, open, boxes))

    const ease = 1 - Math.exp(-EASE * dt)
    body.eye = eyeHeightAt(next) ?? body.eye
    camera.position.lerp(eye.set(next[0], body.eye, next[1]), ease)
    camera.quaternion.slerp(gaze.setFromEuler(angles.set(body.pitch, body.yaw, 0)), ease)
  })

  return null
}
