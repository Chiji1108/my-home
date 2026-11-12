import type { MouseEvent, ReactNode } from 'react'
import type { OpenState, OperableId } from '../plan/interact'
import { type Place, places } from '../plan/places'
import { useInReach } from '../scene/reach'
import { lockPointer, useLocked, useTouching } from '../input'

type Props = {
  walking: boolean
  onOverview: () => void
  onWalk: () => void
  onPlace: (place: Place) => void
  night: boolean
  onNight: (night: boolean) => void
  open: OpenState
  onToggle: (id: OperableId) => void
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    {children}
  </svg>
)

const sun = (
  <Icon>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
  </Icon>
)

const moon = (
  <Icon>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" strokeLinejoin="round" />
  </Icon>
)

export function Overlay({ walking, onOverview, onWalk, onPlace, night, onNight, open, onToggle }: Props) {
  const target = useInReach()
  const locked = useLocked()
  const touching = useTouching()
  const action = target && (open[target] ? '閉める' : '開ける')
  // A click of the mouse on the way into the walk is the moment to lock the pointer.
  const walk = (enter: () => void) => (event: MouseEvent) => {
    enter()
    lockPointer(event.nativeEvent)
  }

  // With the pointer locked nothing can be pressed: only the aim is shown, and what E would do.
  if (locked) {
    return (
      <div className="overlay" data-night={night}>
        <div className="aim">
          <span className="crosshair" />
          {action && (
            <p className="pill interact">
              <kbd>E</kbd>
              {action}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="overlay" data-night={night}>
      <button
        type="button"
        className="pill night"
        aria-label="夜"
        aria-pressed={night}
        onClick={() => onNight(!night)}
      >
        {night ? moon : sun}
      </button>
      {walking && !touching && (
        <p className="pill prompt">
          <strong>クリックして歩く</strong>
          <span>WASD 移動 ・ E 開閉 ・ Esc メニュー</span>
        </p>
      )}
      <div className="dock">
        {target && action && (
          <button type="button" className="pill interact" onClick={() => onToggle(target)}>
            {!touching && <kbd>E</kbd>}
            {action}
          </button>
        )}
        {walking && touching && <p className="hint">ドラッグで見回す ・ 床をタップで移動</p>}
        {!walking && <p className="hint">ドラッグで回す ・ ドアや窓を押して開閉</p>}
        <nav className="pill bar" aria-label="見方と行き先">
          <div className="modes">
            <button type="button" aria-pressed={!walking} onClick={onOverview}>
              俯瞰
            </button>
            <button type="button" aria-pressed={walking} onClick={walk(onWalk)}>
              歩く
            </button>
          </div>
          <div className="places">
            {places.map((place) => (
              <button key={place.id} type="button" onClick={walk(() => onPlace(place))}>
                {place.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
