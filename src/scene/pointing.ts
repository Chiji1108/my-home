import type { OperableId } from '../plan/interact'
import { floorLevelAt, type Vec2 } from '../plan/plan'
import { type Camera, type Intersection, type Material, Mesh, type Object3D, Raycaster, Vector2, Vector3 } from 'three'

const raycaster = new Raycaster()
const pointer = new Vector2()
const normal = new Vector3()

export const isSeeThrough = (object: Object3D) =>
  object instanceof Mesh && [object.material].flat().every((material: Material) => material.transparent)

const isShown = (object: Object3D | null): boolean => !object || (object.visible && isShown(object.parent))

/** What lies under a pointer, nearest first, leaving out what is not being drawn. */
export function under(event: { clientX: number; clientY: number }, canvas: HTMLCanvasElement, camera: Camera, scene: Object3D): Intersection[] {
  const rect = canvas.getBoundingClientRect()
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, 1 - ((event.clientY - rect.top) / rect.height) * 2)
  raycaster.setFromCamera(pointer, camera)
  return raycaster.intersectObjects(scene.children).filter(({ object }) => isShown(object))
}

/** A floor comes no higher than this above its room's level, which takes in the rug. */
const FLOOR_TOP = 0.05

/**
 * The point of floor among what lies under a pointer: where the first
 * thing that is not looked through, as glass is, is floor. Null if it is
 * anything else.
 */
export function floorAmong(hits: Intersection[]): Vec2 | null {
  const hit = hits.find(({ object }) => !isSeeThrough(object))
  if (!hit?.face) return null
  const at: Vec2 = [hit.point.x, hit.point.z]
  const level = floorLevelAt(at)
  if (level === undefined || hit.point.y > level + FLOOR_TOP) return null
  // Facing up, so not the foot of a wall or of a piece of furniture.
  const facesUp = normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).y > 0.9
  return facesUp ? at : null
}

/**
 * How a fitting, or a piece of furniture with doors, is known to whatever
 * is pointed at it: given as `userData` to the group that holds all of it,
 * what moves and what stays.
 */
export const operableAs = (id: OperableId) => ({ operable: id })

/** The id on the object or, failing that, on the nearest of its parents that has one. */
export const operableOf = (object: Object3D | null): OperableId | undefined =>
  object ? (object.userData.operable ?? operableOf(object.parent)) : undefined

/** Pixels a pointer may travel and still count as a tap. */
export const TAP_SLOP = 6
