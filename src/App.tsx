import { Canvas } from '@react-three/fiber'
import { useCallback, useState } from 'react'
import { initiallyOpen, type OpenState, type OperableId } from './plan/interact'
import { type Place, places } from './plan/places'
import { CameraRig } from './scene/CameraRig'
import { FurnitureLayer } from './scene/furniture'
import { Lighting } from './scene/Lighting'
import { Picker } from './scene/Picker'
import { SceneStateProvider } from './scene/SceneState'
import { Shell } from './scene/Shell'
import { WalkControls } from './scene/WalkControls'
import { Overlay } from './ui/Overlay'

export function App() {
  // How the unit is seen, and the place a walk was last sent to. A new
  // value each time one is asked for, so that asking again for the view
  // from above, or for the same place, goes back to it.
  const [shot, setShot] = useState<{ walking: boolean; place: Place }>({ walking: false, place: places[0] })
  const [night, setNight] = useState(false)
  const [open, setOpen] = useState(initiallyOpen)
  const toggle = useCallback((id: OperableId) => setOpen((open): OpenState => ({ ...open, [id]: !open[id] })), [])

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
            <WalkControls shot={shot} onToggle={toggle} />
          ) : (
            <>
              <CameraRig shot={shot} />
              <Picker onToggle={toggle} />
            </>
          )}
        </SceneStateProvider>
      </Canvas>
      <Overlay
        walking={shot.walking}
        onOverview={() => setShot({ walking: false, place: shot.place })}
        // Asked for during a walk, the walk carries on from where it is.
        onWalk={() => shot.walking || setShot({ walking: true, place: shot.place })}
        onPlace={(place) => setShot({ walking: true, place })}
        night={night}
        onNight={setNight}
        open={open}
        onToggle={toggle}
      />
    </>
  )
}
