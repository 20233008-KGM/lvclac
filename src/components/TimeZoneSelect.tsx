import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildTimeZoneOptions,
  filterTimeZoneOptions,
  formatTimeZoneLabel,
  type TimeZoneOption,
} from './timeZoneOptions'

/** 필터 결과가 아무리 많아도 이 개수까지만 렌더한다(400개 전부 그리지 않도록). */
const MAX_VISIBLE = 80

/**
 * 전체 IANA 시간대를 검색으로 고르는 콤보박스.
 * - 입력창에 타이핑하면 도시·시간대·오프셋으로 필터된다.
 * - 위/아래 화살표로 이동, Enter로 선택, Esc로 닫는다.
 * - 값은 부모가 소유(controlled). 기본값은 보통 브라우저 추정 시간대라 처음부터 채워져 있다.
 */
export function TimeZoneSelect({
  value,
  onChange,
  disabled = false,
  searchPlaceholder,
  id,
}: {
  value: string
  onChange: (tz: string) => void
  disabled?: boolean
  searchPlaceholder?: string
  id?: string
}) {
  const options = useMemo(() => buildTimeZoneOptions(), [])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dirty, setDirty] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // dirty(사용자가 타이핑함)일 때만 필터, 아니면 전체를 보여준다.
  const filtered = useMemo(
    () => (dirty ? filterTimeZoneOptions(options, query) : options).slice(0, MAX_VISIBLE),
    [options, query, dirty],
  )
  const totalMatches = useMemo(
    () => (dirty ? filterTimeZoneOptions(options, query).length : options.length),
    [options, query, dirty],
  )

  const closeAndReset = () => {
    setOpen(false)
    setDirty(false)
    setQuery('')
  }

  // 바깥을 클릭하면 닫고 입력값을 현재 선택으로 되돌린다.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeAndReset()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  })

  // 활성 항목이 보이도록 스크롤.
  useEffect(() => {
    if (!open) return
    const list = listRef.current
    const active = list?.children[activeIndex] as HTMLElement | undefined
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open, filtered.length])

  const openList = () => {
    if (disabled) return
    setOpen(true)
    setDirty(false)
    setQuery('')
    // 검색 전에는 현재 선택을 미리 강조하되, 화면에 실제로 렌더되는(캡 이내) 경우만.
    // 그 밖이면 -1(강조 없음)로 둬서 Enter가 엉뚱한 항목을 고르지 않게 한다.
    const currentIndex = options.findIndex((option) => option.tz === value)
    setActiveIndex(currentIndex >= 0 && currentIndex < MAX_VISIBLE ? currentIndex : -1)
  }

  const select = (option: TimeZoneOption | undefined) => {
    if (!option) return
    onChange(option.tz)
    closeAndReset()
    inputRef.current?.blur()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      openList()
      event.preventDefault()
      return
    }
    if (event.key === 'ArrowDown') {
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1))
      event.preventDefault()
    } else if (event.key === 'ArrowUp') {
      setActiveIndex((index) => Math.max(index - 1, 0))
      event.preventDefault()
    } else if (event.key === 'Enter') {
      // 강조된 항목이 없으면(검색 전 -1) 값 변경 없이 닫기만 한다.
      if (activeIndex >= 0) select(filtered[activeIndex])
      else closeAndReset()
      event.preventDefault()
    } else if (event.key === 'Escape') {
      closeAndReset()
      event.preventDefault()
    }
  }

  const inputValue = open && dirty ? query : formatTimeZoneLabel(value)
  const listId = id ? `${id}-listbox` : undefined

  return (
    <div className="tz-select" ref={rootRef}>
      <input
        id={id}
        ref={inputRef}
        className="tz-select__input"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={inputValue}
        placeholder={searchPlaceholder}
        onFocus={openList}
        onChange={(event) => {
          setQuery(event.target.value)
          setDirty(true)
          setOpen(true)
          setActiveIndex(0)
        }}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <ul className="tz-select__list" id={listId} role="listbox" ref={listRef}>
          {filtered.length === 0 && (
            <li className="tz-select__empty" role="presentation">
              —
            </li>
          )}
          {filtered.map((option, index) => (
            <li
              key={option.tz}
              role="option"
              aria-selected={option.tz === value}
              className={
                'tz-select__option' +
                (index === activeIndex ? ' tz-select__option--active' : '') +
                (option.tz === value ? ' tz-select__option--selected' : '')
              }
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => {
                // blur로 목록이 닫히기 전에 선택되도록 기본 동작 막기.
                event.preventDefault()
                select(option)
              }}
            >
              <span className="tz-select__option-city">{option.tz}</span>
              {option.offset && <span className="tz-select__option-offset">{option.offset}</span>}
            </li>
          ))}
          {totalMatches > filtered.length && (
            <li className="tz-select__more" role="presentation">
              +{totalMatches - filtered.length}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
