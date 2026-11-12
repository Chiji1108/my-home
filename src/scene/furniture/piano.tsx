import { materials } from '../materials'
import { Block, Cyl, Soft } from '../parts'
import type { PieceProps } from './types'

const WHITE_KEYS = 52
// Which white keys of an octave, counted from A, have a black key to their right.
const SHARP_AFTER = [true, false, true, true, false, true, true]

// A slim stage piano on panel legs. The keys face the front (+z); the back
// goes against a wall. `height` is the top of the control panel.
export function Piano({ size: [w, d, h] }: PieceProps) {
  const keyTop = h - 0.05
  const bodyBottom = keyTop - 0.085
  const cheek = 0.035
  const keysWidth = w - cheek * 2
  const keysDepth = d * 0.42
  const keysZ = d / 2 - keysDepth / 2 - 0.012
  const pitch = keysWidth / WHITE_KEYS
  const sharpDepth = keysDepth * 0.62
  const panelDepth = d - keysDepth - 0.012
  const legX = w / 2 - 0.09
  return (
    <group>
      <Soft size={[w, keyTop - 0.015 - bodyBottom, d]} position={[0, (keyTop - 0.015 + bodyBottom) / 2, 0]} material={materials.steel} radius={0.008} />
      <Block size={[w, 0.065, panelDepth]} position={[0, h - 0.0325, -d / 2 + panelDepth / 2]} material={materials.steel} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Block size={[cheek, 0.035, d]} position={[side * (w / 2 - cheek / 2), keyTop + 0.0025, 0]} material={materials.steel} />
          <Block size={[0.03, bodyBottom, d * 0.8]} position={[side * legX, bodyBottom / 2, 0]} material={materials.steel} />
        </group>
      ))}
      <Block size={[legX * 2, 0.06, 0.02]} position={[0, bodyBottom * 0.45, -d * 0.3]} material={materials.steel} />

      <Block size={[keysWidth, 0.015, keysDepth]} position={[0, keyTop - 0.0075, keysZ]} material={materials.porcelain} />
      {Array.from({ length: WHITE_KEYS - 1 }, (_, key) =>
        SHARP_AFTER[key % 7] ? (
          <Block
            key={key}
            size={[pitch * 0.58, 0.01, sharpDepth]}
            position={[-keysWidth / 2 + (key + 1) * pitch, keyTop + 0.005, keysZ - (keysDepth - sharpDepth) / 2]}
            material={materials.screen}
          />
        ) : null,
      )}

      {/* Music stand with an open score */}
      <Block size={[w * 0.48, 0.2, 0.006]} position={[0, h + 0.095, -d / 2 + 0.07]} rotation={[-0.22, 0, 0]} material={materials.steel} />
      <Block size={[0.42, 0.15, 0.004]} position={[0, h + 0.09, -d / 2 + 0.078]} rotation={[-0.22, 0, 0]} material={materials.cotton} />
    </group>
  )
}

export function PianoBench({ size: [w, d, h] }: PieceProps) {
  const cushion = 0.05
  const frame = 0.035
  const legHeight = h - cushion - frame
  return (
    <group>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Cyl
            key={`${sx}${sz}`}
            radius={0.018}
            topRadius={0.022}
            height={legHeight}
            position={[sx * (w / 2 - 0.05), legHeight / 2, sz * (d / 2 - 0.05)]}
            material={materials.oak}
          />
        )),
      )}
      <Soft size={[w - 0.02, frame, d - 0.02]} position={[0, legHeight + frame / 2, 0]} material={materials.oak} radius={0.008} />
      <Soft size={[w, cushion, d]} position={[0, h - cushion / 2, 0]} material={materials.linen} radius={0.02} />
    </group>
  )
}
