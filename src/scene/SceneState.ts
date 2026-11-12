import { createContext, useContext } from 'react'
import { type Box, obstacles } from '../plan/collision'
import { initiallyOpen, type OpenState } from '../plan/interact'

export type SceneState = {
  night: boolean
  open: OpenState
  /** What a body can bump into, as the fittings stand. */
  boxes: readonly Box[]
}

const SceneStateContext = createContext<SceneState>({ night: false, open: initiallyOpen, boxes: obstacles(initiallyOpen) })

export const SceneStateProvider = SceneStateContext.Provider
export const useSceneState = () => useContext(SceneStateContext)
