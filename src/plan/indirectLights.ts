import type { Vec2 } from './plan'

export type Aim = 'up' | 'down' | 'north' | 'south' | 'east' | 'west'

/** A run of LED tape or a slim bar light, hidden behind or under furniture. */
export type Strip = {
  id: string
  from: Vec2
  to: Vec2
  /** Above the main floor. */
  height: number
  /** The way the emitting face points; always square to the run. */
  aim: Aim
  /** Brightness per metre of run, relative to the other strips. */
  power: number
}

// The lights cast no shadows and light everything in front of their face,
// however far. So tape behind furniture faces the wall, which leaves the
// room behind its face as the furniture would, and every strip keeps its
// distance from the partitions.
export const strips: Strip[] = [
  // On the back of the sofa, a glow up the concrete wall.
  { id: 'ld-concrete-wall', from: [5.79, 8.45], to: [5.79, 9.9], height: 0.5, aim: 'east', power: 16 },
  // Bar on the wall above the window head, washing the ceiling.
  { id: 'ld-window-head', from: [3.3, 10.83], to: [5.3, 10.83], height: 2.05, aim: 'up', power: 5 },
  // Under the serving ledge, down the dining side of the counter.
  { id: 'kitchen-ledge', from: [3.85, 5.855], to: [5.4, 5.855], height: 1.045, aim: 'down', power: 2 },
  // On the back of the headboard.
  { id: 'bedroom-headboard', from: [0.185, 1.25], to: [0.185, 2.65], height: 0.7, aim: 'west', power: 9 },
  // Bias light on the back of the display.
  { id: 'workroom-monitor', from: [0.26, 9.15], to: [0.26, 9.65], height: 1.0, aim: 'west', power: 5 },
  // Under a board low enough that the tape is out of sight when standing.
  { id: 'workroom-shelf', from: [0.19, 7.6], to: [0.71, 7.6], height: 1.178, aim: 'down', power: 1.2 },
  { id: 'entrance-toe-kick', from: [3.82, 0.15], to: [3.82, 1.05], height: 0.01, aim: 'down', power: 0.7 },
  { id: 'study-bookshelf-top', from: [5.68, 1.95], to: [5.68, 3.05], height: 1.83, aim: 'up', power: 3 },
]
