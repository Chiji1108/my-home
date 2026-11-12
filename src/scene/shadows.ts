import { useThree } from '@react-three/fiber'
import { useCallback, useLayoutEffect } from 'react'

/**
 * Nothing that casts a shadow moves from frame to frame, so the shadow maps
 * are drawn only on request. Called once, by the lighting.
 */
export function useStaticShadows() {
  const shadowMap = useThree((state) => state.gl.shadowMap)
  useLayoutEffect(() => {
    shadowMap.autoUpdate = false
    shadowMap.needsUpdate = true
    return () => {
      shadowMap.autoUpdate = true
    }
  }, [shadowMap])
}

/** The request: call the returned function after changing what casts a shadow or what lights it. */
export function useShadowsDirty() {
  const shadowMap = useThree((state) => state.gl.shadowMap)
  return useCallback(() => {
    shadowMap.needsUpdate = true
  }, [shadowMap])
}
