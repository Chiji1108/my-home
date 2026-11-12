import type { Furniture, FurnitureId } from '../../plan/furniture'

export type PieceProps = { size: Furniture['size'] }
/** For a piece that has a state of its own in the scene. */
export type KnownPieceProps = PieceProps & { id: FurnitureId }
