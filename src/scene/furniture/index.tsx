import type { ComponentType } from 'react'
import { MathUtils } from 'three'
import { type FurnitureKind, furniture } from '../../plan/furniture'
import { rooms } from '../../plan/plan'
import { Bed, BedsideTable, ClothesRack, Rug } from './bedroom'
import { CatFood, CatLitter, CatTower } from './cat'
import { StudyDesk, WorkDesk } from './desks'
import { Fridge, KitchenCounter } from './kitchen'
import { CoffeeTable, DiningTable, Downlight, Pendant, Plant } from './living'
import { DiningChair, Sofa, WorkChair } from './seating'
import { Bookshelf, Closet, DisplayShelf, ShoeCabinet, Sideboard } from './storage'
import type { PieceProps } from './types'
import { Bathtub, Toilet, Vanity, WashingMachine } from './wet'

const pieces: Record<FurnitureKind, ComponentType<PieceProps>> = {
  bed: Bed,
  bedsideTable: BedsideTable,
  rug: Rug,
  workDesk: WorkDesk,
  studyDesk: StudyDesk,
  workChair: WorkChair,
  displayShelf: DisplayShelf,
  bookshelf: Bookshelf,
  closet: Closet,
  shoeCabinet: ShoeCabinet,
  sideboard: Sideboard,
  sofa: Sofa,
  coffeeTable: CoffeeTable,
  diningTable: DiningTable,
  diningChair: DiningChair,
  pendant: Pendant,
  plant: Plant,
  fridge: Fridge,
  kitchenCounter: KitchenCounter,
  bathtub: Bathtub,
  toilet: Toilet,
  vanity: Vanity,
  washingMachine: WashingMachine,
  clothesRack: ClothesRack,
  downlight: Downlight,
  catLitter: CatLitter,
  catFood: CatFood,
  catTower: CatTower,
}

const floorLevel = Object.fromEntries(rooms.map((room) => [room.id, room.level]))

export function FurnitureLayer() {
  return (
    <group>
      {furniture.map((item, index) => {
        const Piece = pieces[item.kind]
        return (
          <group
            key={index}
            position={[item.position[0], floorLevel[item.room] ?? 0, item.position[1]]}
            rotation-y={MathUtils.degToRad(item.rotation)}
          >
            <Piece size={item.size} />
          </group>
        )
      })}
    </group>
  )
}
