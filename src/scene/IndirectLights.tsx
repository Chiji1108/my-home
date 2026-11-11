import { useMemo } from 'react'
import { Matrix4, Quaternion, Vector3 } from 'three'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'
import { type Aim, type Strip, strips } from '../plan/indirectLights'
import { light } from '../plan/palette'
import { useSceneState } from './SceneState'

RectAreaLightUniformsLib.init()

const TAPE_WIDTH = 0.012

const aimVector: Record<Aim, Vector3> = {
  up: new Vector3(0, 1, 0),
  down: new Vector3(0, -1, 0),
  north: new Vector3(0, 0, -1),
  south: new Vector3(0, 0, 1),
  east: new Vector3(1, 0, 0),
  west: new Vector3(-1, 0, 0),
}

function StripLight({ strip }: { strip: Strip }) {
  const { position, quaternion, length } = useMemo(() => {
    const from = new Vector3(strip.from[0], strip.height, strip.from[1])
    const to = new Vector3(strip.to[0], strip.height, strip.to[1])
    const along = to.clone().sub(from).normalize()
    // A rect light shines along its own -z.
    const back = aimVector[strip.aim].clone().negate()
    return {
      position: from.clone().lerp(to, 0.5),
      quaternion: new Quaternion().setFromRotationMatrix(
        new Matrix4().makeBasis(along, back.clone().cross(along), back),
      ),
      length: from.distanceTo(to),
    }
  }, [strip])

  return (
    <group position={position} quaternion={quaternion}>
      <rectAreaLight color={light.lamp} width={length} height={TAPE_WIDTH} intensity={strip.power / TAPE_WIDTH} />
      <mesh rotation-y={Math.PI}>
        <planeGeometry args={[length, TAPE_WIDTH]} />
        <meshStandardMaterial color="#000000" emissive={light.lamp} emissiveIntensity={4} />
      </mesh>
    </group>
  )
}

export function IndirectLights() {
  const { indirect } = useSceneState()
  if (!indirect) return null
  return strips.map((strip) => <StripLight key={strip.id} strip={strip} />)
}
