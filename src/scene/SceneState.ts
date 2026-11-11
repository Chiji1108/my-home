import { createContext, useContext } from 'react'

export type SceneState = {
  night: boolean
  wallOpen: boolean
  /** The concealed strips are lit; never true by day. */
  indirect: boolean
}

const SceneStateContext = createContext<SceneState>({ night: false, wallOpen: false, indirect: false })

export const SceneStateProvider = SceneStateContext.Provider
export const useSceneState = () => useContext(SceneStateContext)
