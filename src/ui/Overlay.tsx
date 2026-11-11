import { type Viewpoint, viewpoints } from '../plan/viewpoints'

type Props = {
  view: Viewpoint
  onView: (view: Viewpoint) => void
  night: boolean
  onNight: (night: boolean) => void
  wallOpen: boolean
  onWallOpen: (open: boolean) => void
  indirect: boolean
  onIndirect: (on: boolean) => void
}

function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}) {
  return (
    <fieldset className="pill toggle" disabled={disabled}>
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

export function Overlay({ view, onView, night, onNight, wallOpen, onWallOpen, indirect, onIndirect }: Props) {
  return (
    <div className="overlay" data-night={night}>
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
        <Toggle
          label="間接照明"
          options={[
            { value: 'on', label: '入' },
            { value: 'off', label: '切' },
          ]}
          value={indirect ? 'on' : 'off'}
          onChange={(value) => onIndirect(value === 'on')}
          disabled={!night}
        />
      </div>
      <nav className="pill views" aria-label="視点">
        {viewpoints.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={option.id === view.id}
            onClick={() => onView(option)}
          >
            {option.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
