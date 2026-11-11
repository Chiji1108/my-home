import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, type PerspectiveCamera, Vector3 } from 'three'
import { bounds } from '../plan/plan'
import { EYE_HEIGHT, type Viewpoint } from '../plan/viewpoints'

const { ACTION } = CameraControlsImpl

// Aimed a little south of the unit's middle so the plan sits above the
// controls at the bottom of the screen.
const centre = new Vector3((bounds.x0 + bounds.x1) / 2, 0, (bounds.y0 + bounds.y1) / 2 + 1.4)
const corners = [bounds.x0, bounds.x1].flatMap((x) =>
  [0, bounds.height].flatMap((y) => [bounds.y0, bounds.y1].map((z) => new Vector3(x, y, z).sub(centre))),
)

// Distance at which the whole unit fits the viewport from the given angle.
function fittingDistance(azimuth: number, polar: number, camera: PerspectiveCamera) {
  const back = new Vector3().setFromSphericalCoords(1, polar, azimuth)
  const right = new Vector3(0, 1, 0).cross(back).normalize()
  const up = back.clone().cross(right)
  const tanY = Math.tan(MathUtils.degToRad(camera.fov) / 2)
  const tanX = tanY * camera.aspect
  const margin = 1.15
  return Math.max(
    ...corners.map((corner) => {
      const toward = corner.dot(back)
      return toward + margin * Math.max(Math.abs(corner.dot(right)) / tanX, Math.abs(corner.dot(up)) / tanY)
    }),
  )
}

export function CameraRig({ shot }: { shot: { view: Viewpoint } }) {
  const controls = useRef<CameraControlsImpl>(null)
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const settled = useRef(false)

  useEffect(() => {
    const rig = controls.current
    if (!rig) return
    const { view } = shot
    const animate = settled.current
    settled.current = true
    const inside = view.kind === 'eye'

    // Inside a room the camera turns on the spot: zooming narrows the lens
    // instead of walking through furniture, and panning is off.
    rig.mouseButtons.wheel = inside ? ACTION.ZOOM : ACTION.DOLLY
    rig.mouseButtons.right = inside ? ACTION.NONE : ACTION.TRUCK
    rig.touches.two = inside ? ACTION.TOUCH_ZOOM : ACTION.TOUCH_DOLLY_TRUCK
    rig.touches.three = inside ? ACTION.NONE : ACTION.TOUCH_TRUCK
    rig.maxPolarAngle = inside ? Math.PI : 1.45
    rig.azimuthRotateSpeed = inside ? 0.4 : 1
    rig.polarRotateSpeed = inside ? 0.4 : 1
    void rig.zoomTo(1, animate)

    if (view.kind === 'dollhouse') {
      const distance = fittingDistance(view.azimuth, view.polar, camera)
      const position = new Vector3().setFromSphericalCoords(distance, view.polar, view.azimuth).add(centre)
      rig.minDistance = 3
      rig.maxDistance = distance * 1.5
      void rig.setLookAt(position.x, position.y, position.z, centre.x, centre.y, centre.z, animate)
      return
    }

    const eye = new Vector3(view.position[0], EYE_HEIGHT, view.position[1])
    const gaze = new Vector3(view.lookAt[0], view.lookAtHeight, view.lookAt[1]).sub(eye).setLength(0.05)
    const target = eye.clone().add(gaze)
    rig.minDistance = 0.05
    rig.maxDistance = 0.05
    void rig.setLookAt(eye.x, eye.y, eye.z, target.x, target.y, target.z, animate)
  }, [shot, camera])

  return <CameraControls ref={controls} makeDefault minZoom={1} maxZoom={3} smoothTime={0.6} />
}
