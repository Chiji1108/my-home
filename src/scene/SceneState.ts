import { createContext, useContext } from 'react'

export type SceneState = {
  night: boolean
  wallOpen: boolean
}

const SceneStateContext = createContext<SceneState>({ night: false, wallOpen: false })

export const SceneStateProvider = SceneStateContext.Provider
export const useSceneState = () => useContext(SceneStateContext)
