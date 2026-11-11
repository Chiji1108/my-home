import { MeshStandardMaterial } from 'three'
import { palette, type Surface, type SurfaceName } from '../plan/palette'
import { concreteTexture, plankTexture } from './textures'

function material(surface: Surface) {
  const transparent = surface.opacity !== undefined
  return new MeshStandardMaterial({
    color: surface.color,
    roughness: surface.roughness,
    metalness: surface.metalness ?? 0,
    opacity: surface.opacity ?? 1,
    transparent,
    // Transparent panes must not hide what is behind them from the AO pass.
    depthWrite: !transparent,
  })
}

export const materials = Object.fromEntries(
  Object.entries(palette).map(([name, surface]) => [name, material(surface)]),
) as Record<SurfaceName, MeshStandardMaterial>

export const oakFloor = material(palette.oak)
oakFloor.map = plankTexture()

materials.concrete.map = concreteTexture()
