import { RoundedBox } from '@react-three/drei'
import type { Material } from 'three'
import { light } from '../plan/palette'
import { materials } from './materials'
import { useSceneState } from './SceneState'

export type V3 = readonly [x: number, y: number, z: number]

type PartProps = {
  size: V3
  position: V3
  material: Material
  rotation?: V3
}

const mutable = (v: V3): [number, number, number] => [v[0], v[1], v[2]]

export function Block({ size, position, material, rotation }: PartProps) {
  return (
    <mesh
      castShadow
      receiveShadow
      position={mutable(position)}
      rotation={rotation && mutable(rotation)}
      material={material}
    >
      <boxGeometry args={mutable(size)} />
    </mesh>
  )
}

export function Soft({ size, position, material, rotation, radius }: PartProps & { radius?: number }) {
  return (
    <RoundedBox
      castShadow
      receiveShadow
      args={mutable(size)}
      radius={radius ?? Math.min(...size) * 0.3}
      smoothness={3}
      position={mutable(position)}
      rotation={rotation && mutable(rotation)}
      material={material}
    />
  )
}

export function Cyl({
  radius,
  height,
  position,
  material,
  rotation,
  topRadius,
}: {
  radius: number
  height: number
  position: V3
  material: Material
  rotation?: V3
  topRadius?: number
}) {
  return (
    <mesh
      castShadow
      receiveShadow
      position={mutable(position)}
      rotation={rotation && mutable(rotation)}
      material={material}
    >
      <cylinderGeometry args={[topRadius ?? radius, radius, height, 32]} />
    </mesh>
  )
}

/** A warm lamp that is switched on only in the evening. */
function LampLight({ power, castShadow = false }: { power: number; castShadow?: boolean }) {
  const { night } = useSceneState()
  if (!night) return null
  return (
    <pointLight
      color={light.lamp}
      intensity={power}
      distance={7}
      decay={2}
      castShadow={castShadow}
      shadow-mapSize={[1024, 1024]}
      shadow-bias={-0.002}
    />
  )
}

/** A washi paper shade with its lamp inside. */
export function WashiShade({
  size,
  position,
  power,
  castShadow,
}: {
  size: V3
  position: V3
  power: number
  castShadow?: boolean
}) {
  const { night } = useSceneState()
  return (
    <group position={mutable(position)}>
      <mesh scale={[size[0] / 2, size[1] / 2, size[2] / 2]}>
        <sphereGeometry args={[1, 32, 20]} />
        <meshStandardMaterial
          color={materials.washi.color}
          roughness={1}
          emissive={light.lamp}
          emissiveIntensity={night ? 6 : 0}
        />
      </mesh>
      <LampLight power={power} castShadow={castShadow} />
    </group>
  )
}
