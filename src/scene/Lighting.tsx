import { Environment, Lightformer } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useLayoutEffect, useRef } from 'react'
import type { DirectionalLight } from 'three'
import { light } from '../plan/palette'
import { bounds } from '../plan/plan'
import { useSceneState } from './SceneState'
import { useShadowsDirty, useStaticShadows } from './shadows'

const centre = [(bounds.x0 + bounds.x1) / 2, 0, (bounds.y0 + bounds.y1) / 2] as const

// The balcony faces south-south-east, so a late-morning sun stands a little
// east of the balcony's axis.
const sunDirection = [0.28, 0.72, 1] as const
const SUN_DISTANCE = 20

function Sun() {
  const sun = useRef<DirectionalLight>(null)

  // The light's target is not in the scene graph, so its matrix has to be
  // refreshed by hand for the shadow camera to aim at the unit.
  useLayoutEffect(() => {
    sun.current?.target.position.set(...centre)
    sun.current?.target.updateMatrixWorld()
  }, [])

  return (
    <directionalLight
      ref={sun}
      castShadow
      color={light.sun}
      intensity={3}
      position={[
        centre[0] + sunDirection[0] * SUN_DISTANCE,
        sunDirection[1] * SUN_DISTANCE,
        centre[2] + sunDirection[2] * SUN_DISTANCE,
      ]}
      shadow-mapSize={[4096, 4096]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.02}
      shadow-camera-left={-9}
      shadow-camera-right={9}
      shadow-camera-top={9}
      shadow-camera-bottom={-9}
      shadow-camera-near={1}
      shadow-camera-far={45}
    />
  )
}

// Image-based light built from panels instead of an HDR file: a broad sky
// overhead, a brighter panel on the balcony side and a dim one opposite.
function Sky({ night }: { night: boolean }) {
  return (
    <Environment key={night ? 'night' : 'day'} resolution={256} frames={1}>
      <color attach="background" args={[night ? '#0a0f1c' : '#cdc6ba']} />
      <Lightformer
        form="rect"
        color={night ? '#2a3a5c' : '#ffffff'}
        intensity={night ? 0.5 : 0.8}
        position={[0, 10, 0]}
        rotation-x={Math.PI / 2}
        scale={[30, 30, 1]}
      />
      <Lightformer
        form="rect"
        color={night ? '#22304f' : '#fff3e0'}
        intensity={night ? 0.4 : 1.3}
        position={[0, 4, 14]}
        rotation-y={Math.PI}
        scale={[30, 10, 1]}
      />
      <Lightformer
        form="rect"
        color={night ? '#141c30' : '#dfe6ee'}
        intensity={night ? 0.3 : 0.5}
        position={[0, 4, -14]}
        scale={[30, 10, 1]}
      />
    </Environment>
  )
}

export function Lighting() {
  const { night } = useSceneState()
  const shadowsDirty = useShadowsDirty()
  useStaticShadows()
  // The evening swaps the sun for the lamps.
  useLayoutEffect(shadowsDirty, [shadowsDirty, night])

  return (
    <>
      <color attach="background" args={[night ? light.nightSky : light.daySky]} />
      <Sky night={night} />
      {!night && <Sun />}
      <EffectComposer multisampling={4}>
        {/*
          Eight samples, half the pass's default; indoors the pass is most of the frame. Measured against
          sixteen: fewer than one pixel in two hundred differs by more than 8 in 255, and as the camera
          turns the picture changes from frame to frame by 2% more. The noise is fixed to the screen.
        */}
        <N8AO
          aoRadius={1}
          distanceFalloff={1}
          intensity={3}
          aoSamples={8}
          denoiseSamples={8}
          denoiseRadius={12}
        />
        <Bloom mipmapBlur luminanceThreshold={3} intensity={0.5} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}
