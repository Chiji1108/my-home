import { createContext, useContext } from 'react'
import { initiallyOpen, type OpenState } from '../plan/plan'

export type SceneState = {
  night: boolean
  /** Which of the fittings stand open. */
  open: OpenState
}

const SceneStateContext = createContext<SceneState>({ night: false, open: initiallyOpen })

export const SceneStateProvider = SceneStateContext.Provider
export const useSceneState = () => useContext(SceneStateContext)
