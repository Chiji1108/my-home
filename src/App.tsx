import { addTail, Canvas, useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { type Viewpoint, viewpoints } from './plan/viewpoints'
import { CameraRig } from './scene/CameraRig'
import { FurnitureLayer } from './scene/furniture'
import { Lighting } from './scene/Lighting'
import { SceneStateProvider } from './scene/SceneState'
import { Shell } from './scene/Shell'
import { Overlay } from './ui/Overlay'

// Frames are rendered on demand, but the clock would keep running between
// them and hand the first frame of an animation the whole pause as its time
// step, so the animation would jump to its end. The clock is therefore
// stopped whenever rendering stops, and starts again with the next frame.
function PauseClockWhileIdle() {
  const clock = useThree((state) => state.clock)
  useEffect(
    () =>
      addTail(() => {
        clock.stop()
        // stop() turns this off, and without it the next frame would not restart the clock.
        clock.autoStart = true
      }),
    [clock],
  )
  return null
}

export function App() {
  // Wrapped so that choosing the current viewpoint again is a new value,
  // which sends a camera the user has moved back to it.
  const [shot, setShot] = useState<{ view: Viewpoint }>({ view: viewpoints[0] })
  const [night, setNight] = useState(false)
  const [wallOpen, setWallOpen] = useState(false)
  const { view } = shot

  return (
    <>
      <Canvas
        frameloop="demand"
        shadows="percentage"
        dpr={[1, 2]}
        gl={{ antialias: false }}
        camera={{ fov: 60, near: 0.05, far: 120 }}
      >
        <SceneStateProvider value={{ night, wallOpen }}>
          <Shell />
          <FurnitureLayer />
          <Lighting />
        </SceneStateProvider>
        <CameraRig shot={shot} />
        <PauseClockWhileIdle />
      </Canvas>
      <Overlay
        view={view}
        onView={(next) => setShot({ view: next })}
        night={night}
        onNight={setNight}
        wallOpen={wallOpen}
        onWallOpen={setWallOpen}
      />
    </>
  )
}
