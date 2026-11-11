import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { type Viewpoint, viewpoints } from './plan/viewpoints'
import { CameraRig } from './scene/CameraRig'
import { FurnitureLayer } from './scene/furniture'
import { Lighting } from './scene/Lighting'
import { SceneStateProvider } from './scene/SceneState'
import { Shell } from './scene/Shell'
import { Overlay } from './ui/Overlay'

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
