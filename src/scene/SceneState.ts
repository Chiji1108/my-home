import { createContext, useContext } from 'react'
import { initiallyOpen, type OpenState } from '../plan/interact'

export type SceneState = {
  night: boolean
  open: OpenState
}

const SceneStateContext = createContext<SceneState>({ night: false, open: initiallyOpen })

export const SceneStateProvider = SceneStateContext.Provider
export const useSceneState = () => useContext(SceneStateContext)
