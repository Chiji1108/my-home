import { Canvas } from '@react-three/fiber'
import { useCallback, useState } from 'react'
import { type FittingId, initiallyOpen } from './plan/plan'
import { type Viewpoint, viewpoints, walkStart } from './plan/viewpoints'
import { CameraRig } from './scene/CameraRig'
import { FurnitureLayer } from './scene/furniture'
import { Lighting } from './scene/Lighting'
import { SceneStateProvider } from './scene/SceneState'
import { Shell } from './scene/Shell'
import { WalkControls } from './scene/WalkControls'
import { Overlay } from './ui/Overlay'

export function App() {
  // Wrapped so that choosing the current viewpoint again is a new value,
  // which sends a camera the user has moved back to it.
  const [shot, setShot] = useState<{ view: Viewpoint; walking: boolean }>({ view: viewpoints[0], walking: false })
  const [night, setNight] = useState(false)
  const [open, setOpen] = useState(initiallyOpen)
  /** The fitting within reach of the walk. */
  const [target, setTarget] = useState<FittingId | null>(null)
  const { view, walking } = shot
  const toggle = useCallback((id: FittingId) => setOpen((open) => ({ ...open, [id]: !open[id] })), [])

  return (
    <>
      <Canvas
        shadows="percentage"
        dpr={[1, 2]}
        gl={{ antialias: false }}
        camera={{ fov: 60, near: 0.05, far: 120 }}
      >
        <SceneStateProvider value={{ night, open }}>
          <Shell />
          <FurnitureLayer />
          <Lighting />
          {walking && <WalkControls start={walkStart(view)} onTarget={setTarget} onToggle={toggle} />}
        </SceneStateProvider>
        {!walking && <CameraRig shot={shot} />}
      </Canvas>
      <Overlay
        view={view}
        onView={(next) => setShot({ view: next, walking: false })}
        walking={walking}
        onWalk={() => setShot({ view, walking: true })}
        night={night}
        onNight={setNight}
        open={open}
        onOpen={(id, to) => setOpen({ ...open, [id]: to })}
        target={target}
        onToggle={toggle}
      />
    </>
  )
}
