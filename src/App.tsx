import { Canvas } from '@react-three/fiber'
import { useCallback, useState } from 'react'
import { initiallyOpen, type OpenState, type OperableId } from './plan/interact'
import { type Standing, start } from './plan/places'
import { CameraRig } from './scene/CameraRig'
import { FurnitureLayer } from './scene/furniture'
import { Lighting } from './scene/Lighting'
import { Picker } from './scene/Picker'
import { SceneStateProvider } from './scene/SceneState'
import { Shell } from './scene/Shell'
import { WalkControls } from './scene/WalkControls'
import { Overlay } from './ui/Overlay'

export function App() {
  // How the unit is seen. A new value each time a view is asked for, so
  // that asking again for the view from above goes back to it.
  const [shot, setShot] = useState({ walking: false })
  // Where the walk stands and looks. It is the walk's to move, and kept
  // here so that a walk is taken up again where the last one was left.
  const [standing] = useState<Standing>(() => ({ ...start }))
  const [night, setNight] = useState(false)
  const [open, setOpen] = useState(initiallyOpen)
  const toggle = useCallback((id: OperableId) => setOpen((open): OpenState => ({ ...open, [id]: !open[id] })), [])
  const stand = useCallback(
    (at: Standing) => {
      Object.assign(standing, at)
      setShot({ walking: true })
    },
    [standing],
  )

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
          {shot.walking ? (
            <WalkControls standing={standing} onToggle={toggle} />
          ) : (
            <>
              <CameraRig shot={shot} />
              <Picker onToggle={toggle} onStand={stand} />
            </>
          )}
        </SceneStateProvider>
      </Canvas>
      <Overlay
        walking={shot.walking}
        onOverview={() => setShot({ walking: false })}
        // Asked for during a walk, the walk carries on from where it is.
        onWalk={() => shot.walking || setShot({ walking: true })}
        night={night}
        onNight={setNight}
        open={open}
        onToggle={toggle}
      />
    </>
  )
}
