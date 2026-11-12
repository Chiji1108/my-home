import { type Camera, type Intersection, type Material, Mesh, type Object3D, Raycaster, Vector2 } from 'three'

const raycaster = new Raycaster()
const pointer = new Vector2()

export const isSeeThrough = (object: Object3D) =>
  object instanceof Mesh && [object.material].flat().every((material: Material) => material.transparent)

const isShown = (object: Object3D | null): boolean => !object || (object.visible && isShown(object.parent))

/** What lies under a pointer, nearest first, leaving out what is not being drawn. */
export function under(event: PointerEvent, canvas: HTMLCanvasElement, camera: Camera, scene: Object3D): Intersection[] {
  const rect = canvas.getBoundingClientRect()
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, 1 - ((event.clientY - rect.top) / rect.height) * 2)
  raycaster.setFromCamera(pointer, camera)
  return raycaster.intersectObjects(scene.children).filter(({ object }) => isShown(object))
}

/** Pixels a pointer may travel and still count as a tap. */
export const TAP_SLOP = 6
