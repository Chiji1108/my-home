import { type Viewpoint, viewpoints } from '../plan/viewpoints'

type Props = {
  view: Viewpoint
  onView: (view: Viewpoint) => void
  walking: boolean
  onWalk: () => void
  night: boolean
  onNight: (night: boolean) => void
  wallOpen: boolean
  onWallOpen: (open: boolean) => void
}

function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="pill toggle">
      <legend>{label}</legend>
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name={label}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  )
}

export function Overlay({ view, onView, walking, onWalk, night, onNight, wallOpen, onWallOpen }: Props) {
  return (
    <div className="overlay" data-night={night}>
      {walking && (
        <p className="hint">
          ドラッグで見回す ・ 床をタップで移動<span className="keys"> ・ WASD</span>
        </p>
      )}
      <div className="toggles">
        <Toggle
          label="時間帯"
          options={[
            { value: 'day', label: '昼' },
            { value: 'night', label: '夜' },
          ]}
          value={night ? 'night' : 'day'}
          onChange={(value) => onNight(value === 'night')}
        />
        <Toggle
          label="スライディングウォール"
          options={[
            { value: 'open', label: '開' },
            { value: 'closed', label: '閉' },
          ]}
          value={wallOpen ? 'open' : 'closed'}
          onChange={(value) => onWallOpen(value === 'open')}
        />
      </div>
      <nav className="pill views" aria-label="視点">
        {viewpoints.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={!walking && option.id === view.id}
            onClick={() => onView(option)}
          >
            {option.label}
          </button>
        ))}
        <button type="button" aria-pressed={walking} onClick={onWalk}>
          歩く
        </button>
      </nav>
    </div>
  )
}
