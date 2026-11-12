import { CameraControls, type CameraControlsImpl } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, type PerspectiveCamera, Vector3 } from 'three'
import { overview } from '../plan/places'
import { bounds } from '../plan/plan'

// Aimed a little south of the unit's middle so the plan sits above the
// controls at the bottom of the screen.
const centre = new Vector3((bounds.x0 + bounds.x1) / 2, 0, (bounds.y0 + bounds.y1) / 2 + 1.4)
const corners = [bounds.x0, bounds.x1].flatMap((x) =>
  [0, bounds.height].flatMap((y) => [bounds.y0, bounds.y1].map((z) => new Vector3(x, y, z).sub(centre))),
)

// Distance at which the whole unit fits the viewport from the given angle.
function fittingDistance(azimuth: number, polar: number, fov: number, aspect: number) {
  const back = new Vector3().setFromSphericalCoords(1, polar, azimuth)
  const right = new Vector3(0, 1, 0).cross(back).normalize()
  const up = back.clone().cross(right)
  const tanY = Math.tan(MathUtils.degToRad(fov) / 2)
  const tanX = tanY * aspect
  const margin = 1.15
  return Math.max(
    ...corners.map((corner) => {
      const toward = corner.dot(back)
      return toward + margin * Math.max(Math.abs(corner.dot(right)) / tanX, Math.abs(corner.dot(up)) / tanY)
    }),
  )
}

/**
 * The view from above, orbiting the unit. `shot` is a new value each time
 * the view is asked for, which sends a camera the user has moved back to
 * where it began.
 */
export function CameraRig({ shot }: { shot: object }) {
  const controls = useRef<CameraControlsImpl>(null)
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const aspect = useThree((state) => state.size.width / state.size.height)
  // The first placement is a cut; every later one is a move.
  const settled = useRef(false)

  useEffect(() => {
    const rig = controls.current
    if (!rig) return
    void rig.normalizeRotations().rotateTo(overview.azimuth, overview.polar, settled.current)
    void rig.moveTo(centre.x, centre.y, centre.z, settled.current)
  }, [shot])

  // The distance that fits the unit depends on the viewport's shape, so it
  // is set again whenever that changes.
  useEffect(() => {
    const rig = controls.current
    if (!rig) return
    const distance = fittingDistance(overview.azimuth, overview.polar, camera.fov, aspect)
    rig.maxDistance = distance * 1.5
    void rig.dollyTo(distance, settled.current)
  }, [shot, camera, aspect])

  useEffect(() => {
    settled.current = true
  }, [])

  return <CameraControls ref={controls} makeDefault minDistance={3} maxPolarAngle={1.45} smoothTime={0.6} />
}
