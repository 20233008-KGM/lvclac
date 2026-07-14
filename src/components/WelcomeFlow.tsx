import { useEffect, useReducer, useRef, useState } from 'react'
import { FORMULAS_PATH, GUIDE_PATH } from '../config/routes'
import { useCalculator } from '../context/CalculatorContext'
import { PRESET_IDS, useLanguage, type PresetId } from '../i18n'
import { useModalFocusRestore } from '../hooks/useModalFocusRestore'
import { writeTraderStage } from './fieldHint'
import {
  MARGIN_MODE_IDS,
  WELCOME_LAST_STEP,
  WELCOME_STEP_COUNT,
  makeInitialDraft,
  welcomeReducer,
  type MarginMode,
  type TraderStage,
} from './welcomeFlowState'
import {
  WELCOME_REGIONS,
  regionToLocale,
  regionToSuggestedPreset,
  regionToTimeZone,
  writePreferredRegion,
  writePreferredSnapshotTimeZone,
  type WelcomeRegion,
} from './welcomePreferences'

/** 거래 종목 선택지(표준 제외한 5종 상품군). */
const INSTRUMENT_IDS = PRESET_IDS.filter((id): id is Exclude<PresetId, 'default'> => id !== 'default')

/** 로케일 무관 표기 태그 — 지역 코드칩 / 상품 모노칩. */
const REGION_CODE: Record<WelcomeRegion, string> = {
  KR: 'KR',
  US: 'US',
  EU: 'EU',
  JP: 'JP',
  OTHER: '—',
}
const INSTRUMENT_MONO: Record<Exclude<PresetId, 'default'>, string> = {
  index: 'IX',
  stock: 'EQ',
  commodity: 'CM',
  fx: 'FX',
  cfd: 'CD',
}

/** 완료 화면 표시 후 실제 닫힘(onComplete)까지 지연(ms). */
const FINISH_DELAY_MS = 1100

/* ── 인라인 아이콘(stroke 기반 단순 도형) ───────────────────────────── */
function IconCheck({ size = 13, width = 3 }: { size?: number; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function IconChevronLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}
function IconChevronRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}
function IconArrowUpRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}
function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="welcome-rail__hint-icon" aria-hidden="true">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}
function IconInfo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}
function IconWarning() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="welcome-warn__icon" aria-hidden="true">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  )
}
/** 거래 상황 아이콘: 첫 거래(원+십자) / 무포지션(빈 원) / 보유(원+점). */
function StageIcon({ stage }: { stage: TraderStage }) {
  if (stage === 'firstTrade') {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    )
  }
  if (stage === 'noPosition') {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
      </svg>
    )
  }
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconSaveYes() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v10M8 10l4 4 4-4" />
      <path d="M5 20h14" />
    </svg>
  )
}
function IconSaveNo() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M6 6l12 12" />
    </svg>
  )
}

/** 카드 우상단 선택 체크 뱃지. */
function CheckBadge() {
  return (
    <span className="welcome-card__check" aria-hidden="true">
      <IconCheck size={10} width={3.5} />
    </span>
  )
}

/**
 * 첫 진입 통합 환영 온보딩(2패널: 좌측 세로 스테퍼 + 우측 헤더/콘텐츠/푸터).
 * 지역·거래종목·거래상태·짧은 사용법·면책동의를 하나의 관문으로 묶는다.
 * 면책 ack/skip + 온보딩 완료 플래그 커밋은 부모(DisclaimerProvider)가 onComplete에서 수행하고,
 * 여기서는 언어·프리셋(라이브)·자동스냅샷 시간대만 반영한다.
 * 표현 계층만 교체 — welcomeReducer 상태 머신과 부수효과는 그대로 유지.
 */
export function WelcomeFlow({ onComplete }: { onComplete: (persist: boolean) => void }) {
  const { t, locale, preset, setLocale, setPreset } = useLanguage()
  const { setSaveEnabled, updateInputs } = useCalculator()
  useModalFocusRestore()

  const initialRegion: WelcomeRegion = locale === 'ko' ? 'KR' : 'US'
  const initialInstrument: PresetId =
    preset !== 'default' ? preset : regionToSuggestedPreset(initialRegion)
  const [draft, dispatch] = useReducer(
    welcomeReducer,
    makeInitialDraft(initialRegion, initialInstrument),
  )

  const [finished, setFinished] = useState(false)
  const finishTimer = useRef<number | null>(null)
  const headingRef = useRef<HTMLHeadingElement | null>(null)

  // 배경 스크롤 잠금(기존 면책 모달과 동일 정책).
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // 단계 전환 시 제목으로 포커스 이동(스크린리더가 새 단계를 읽도록).
  useEffect(() => {
    headingRef.current?.focus()
  }, [draft.step])

  // 언마운트 시 완료 타이머 정리.
  useEffect(
    () => () => {
      if (finishTimer.current) clearTimeout(finishTimer.current)
    },
    [],
  )

  const c = t.welcome
  const stepIndex = draft.step
  const stepLabel = c.stepLabel
    .replace('{current}', String(stepIndex + 1))
    .replace('{total}', String(WELCOME_STEP_COUNT))
  const eyebrow = `STEP ${String(stepIndex + 1).padStart(2, '0')}`
  const counterLabel = `${String(stepIndex + 1).padStart(2, '0')} / ${String(WELCOME_STEP_COUNT).padStart(2, '0')}`

  function chooseRegion(region: WelcomeRegion) {
    dispatch({ type: 'setRegion', region })
    setLocale(regionToLocale(region)) // 이후 단계 텍스트가 즉시 해당 언어로
  }

  function chooseInstrument(instrument: PresetId) {
    dispatch({ type: 'setInstrument', instrument })
    setPreset(instrument) // 뒤 계산기 라벨을 실시간 반영 + 영속
  }

  function chooseMargin(marginMode: MarginMode) {
    dispatch({ type: 'setMargin', marginMode })
    updateInputs({ marginInputMode: marginMode }) // 계산기 증거금 섹션에 즉시 반영
  }

  function chooseStage(stage: TraderStage) {
    dispatch({ type: 'setStage', stage })
  }

  function chooseSave(saveLocal: boolean) {
    dispatch({ type: 'setSave', saveLocal })
  }

  function complete() {
    if (!draft.ackChecked) return
    // 명시적으로 '저장 안 함'을 고른 경우에만 아무것도 남기지 않는다(=매 새로고침 fresh).
    // 미선택(건너뜀)은 온보딩 상태는 기억하되 입력값 저장은 켜지 않는다.
    const persist = draft.saveLocal !== false
    setPreset(draft.instrument)
    if (persist) {
      writePreferredRegion(draft.region)
      writePreferredSnapshotTimeZone(regionToTimeZone(draft.region))
      if (draft.stage) writeTraderStage(draft.stage)
    }
    if (draft.saveLocal === true) void setSaveEnabled(true, 'local')
    // 완료 화면을 잠깐 보여준 뒤 부모가 모달을 닫도록 onComplete 호출.
    setFinished(true)
    finishTimer.current = window.setTimeout(() => onComplete(persist), FINISH_DELAY_MS)
  }

  const marginCards: { id: MarginMode; title: string; desc: string }[] = MARGIN_MODE_IDS.map(
    (id) => ({
      id,
      title: t.marginMode[id],
      desc:
        id === 'rate'
          ? t.marginMode.rateHint
          : id === 'perContract'
            ? t.marginMode.perContractHint
            : t.marginMode.totalHint,
    }),
  )

  const stageCards: { id: TraderStage; title: string; desc: string }[] = [
    { id: 'firstTrade', title: c.stageFirst, desc: c.stageFirstDesc },
    { id: 'noPosition', title: c.stageNone, desc: c.stageNoneDesc },
    { id: 'hasPosition', title: c.stageHasPosition, desc: c.stageHasPositionDesc },
  ]

  const usageBody =
    draft.stage === 'hasPosition'
      ? c.usageHasPositionBody
      : draft.stage === 'noPosition'
        ? c.usageNoneBody
        : c.usageFirstBody

  const isLast = stepIndex === WELCOME_LAST_STEP
  const nextDisabled =
    (stepIndex === 1 && draft.marginMode === null) ||
    (stepIndex === 2 && draft.stage === null) ||
    (stepIndex === 3 && draft.saveLocal === null)

  // 진행(파랑) 라인 높이: 활성 칩 상단 가장자리에서 멈추도록 -15px 보정.
  const railFillHeight =
    stepIndex === 0 ? '0px' : `calc((100% - 44px) * ${stepIndex / 4} - 15px)`

  return (
    <div className="disclaimer-overlay welcome-overlay" role="presentation">
      <div
        className="welcome-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-step-title"
      >
        {/* ── 좌측 레일: 브랜드 + 세로 스테퍼 ── */}
        <aside className="welcome-rail">
          <div className="welcome-rail__brand">
            <div className="welcome-rail__brand-logo">
              <span className="welcome-rail__brand-diamond" />
            </div>
            <div className="welcome-rail__brand-text">
              <span className="welcome-rail__brand-title">{t.siteTitle}</span>
              <span className="welcome-rail__brand-event">Onboarding</span>
            </div>
          </div>

          <nav className="welcome-rail__nav" aria-label={t.siteTitle}>
            <div className="welcome-rail__steps">
              <span className="welcome-rail__line" aria-hidden="true" />
              <span
                className="welcome-rail__line-fill"
                style={{ height: railFillHeight }}
                aria-hidden="true"
              />
              {c.stepNav.map((label, i) => {
                const done = i < stepIndex
                const active = i === stepIndex
                const state = done ? 'done' : active ? 'active' : 'todo'
                return (
                  <button
                    key={label}
                    type="button"
                    className="welcome-rail__step"
                    aria-current={active ? 'step' : undefined}
                    onClick={() => dispatch({ type: 'goto', step: i })}
                  >
                    <span className={`welcome-rail__chip welcome-rail__chip--${state}`}>
                      {done ? <IconCheck size={13} width={3} /> : <span>{i + 1}</span>}
                    </span>
                    <span className={`welcome-rail__step-label welcome-rail__step-label--${state}`}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </nav>

          <div className="welcome-rail__hint">
            <IconLock />
            <span>{c.railHint}</span>
          </div>
        </aside>

        {/* ── 우측 패널: 헤더 / 콘텐츠 / 푸터 (또는 완료 화면) ── */}
        <div className="welcome-panel">
          {finished ? (
            <div className="welcome-done">
              <div className="welcome-done__icon">
                <IconCheck size={34} width={2.4} />
              </div>
              <h2 className="welcome-done__title">{c.doneTitle}</h2>
              <p className="welcome-done__body">{c.doneBody}</p>
            </div>
          ) : (
            <div className="welcome-panel__branch">
              <div className="welcome-panel__header">
                <div className="welcome-eyebrow">
                  <span className="welcome-eyebrow__step">{eyebrow}</span>
                  <span className="welcome-eyebrow__dot" aria-hidden="true" />
                  <span className="welcome-eyebrow__section">{c.stepNav[stepIndex]}</span>
                </div>
                <h2
                  id="welcome-step-title"
                  className="welcome-panel__title"
                  tabIndex={-1}
                  ref={headingRef}
                >
                  {stepTitle(stepIndex, c)}
                </h2>
                <p className="welcome-panel__body">{stepBody(stepIndex, c)}</p>
              </div>

              <div className="welcome-panel__content">
                <div className="welcome-fade" key={stepIndex}>
                  {stepIndex === 0 && (
                    <>
                      <p className="welcome-prompt">{c.regionPrompt}</p>
                      <div
                        className="welcome-grid welcome-grid--3"
                        role="group"
                        aria-label={c.regionTitle}
                      >
                        {WELCOME_REGIONS.map((region) => {
                          const on = draft.region === region
                          return (
                            <button
                              key={region}
                              type="button"
                              className={`welcome-card welcome-card--region ${on ? 'welcome-card--selected' : ''}`}
                              aria-pressed={on}
                              onClick={() => chooseRegion(region)}
                            >
                              <span className="welcome-code">{REGION_CODE[region]}</span>
                              <span className="welcome-card__label">{c.regions[region]}</span>
                              {on && <CheckBadge />}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {stepIndex === 1 && (
                    <>
                      <div
                        className="welcome-grid welcome-grid--3"
                        role="group"
                        aria-label={c.instrumentTitle}
                      >
                        {INSTRUMENT_IDS.map((id) => {
                          const on = draft.instrument === id
                          return (
                            <button
                              key={id}
                              type="button"
                              className={`welcome-card welcome-card--instrument ${on ? 'welcome-card--selected' : ''}`}
                              aria-pressed={on}
                              onClick={() => chooseInstrument(id)}
                            >
                              <span className="welcome-mono">{INSTRUMENT_MONO[id]}</span>
                              <span className="welcome-card__label">{t.glossaryPreset.options[id]}</span>
                              {on && <CheckBadge />}
                            </button>
                          )
                        })}
                      </div>

                      <div className="welcome-divider">
                        <span className="welcome-divider__label">{c.marginDivider}</span>
                        <span className="welcome-divider__line" aria-hidden="true" />
                      </div>

                      <div
                        className="welcome-grid welcome-grid--3"
                        role="group"
                        aria-label={c.marginTitle}
                      >
                        {marginCards.map((card) => {
                          const on = draft.marginMode === card.id
                          return (
                            <button
                              key={card.id}
                              type="button"
                              className={`welcome-card welcome-card--vertical ${on ? 'welcome-card--selected' : ''}`}
                              aria-pressed={on}
                              onClick={() => chooseMargin(card.id)}
                            >
                              <span className="welcome-card__title">{card.title}</span>
                              <span className="welcome-card__desc">{card.desc}</span>
                              {on && <CheckBadge />}
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {stepIndex === 2 && (
                    <>
                      <div className="welcome-stack" role="group" aria-label={c.stageTitle}>
                        {stageCards.map((card) => {
                          const on = draft.stage === card.id
                          return (
                            <button
                              key={card.id}
                              type="button"
                              className={`welcome-card welcome-card--row ${on ? 'welcome-card--selected' : ''}`}
                              aria-pressed={on}
                              onClick={() => chooseStage(card.id)}
                            >
                              <span className={`welcome-card__icon ${on ? 'welcome-card__icon--on' : ''}`}>
                                <StageIcon stage={card.id} />
                              </span>
                              <span className="welcome-card__stack">
                                <span className="welcome-card__title">{card.title}</span>
                                <span className="welcome-card__desc">{card.desc}</span>
                              </span>
                              {on && (
                                <span className="welcome-card__check welcome-card__check--inline" aria-hidden="true">
                                  <IconCheck size={11} width={3.5} />
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {draft.stage && (
                        <div className="welcome-usage">
                          <div className="welcome-usage__head">
                            <span className="welcome-usage__head-icon">
                              <IconInfo />
                            </span>
                            <span className="welcome-usage__head-text">{c.usageTitle}</span>
                          </div>
                          <div className="welcome-usage__list">
                            {usageBody.map((line, i) => (
                              <div className="welcome-usage__item" key={i}>
                                <span className="welcome-usage__num">{i + 1}</span>
                                <span className="welcome-usage__text">{line}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="welcome-links">
                        <a
                          className="welcome-link"
                          href={GUIDE_PATH}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {c.guideLink}
                          <IconArrowUpRight />
                        </a>
                        <a
                          className="welcome-link"
                          href={FORMULAS_PATH}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {c.mathLink}
                          <IconArrowUpRight />
                        </a>
                      </div>
                    </>
                  )}

                  {stepIndex === 3 && (
                    <div className="welcome-grid welcome-grid--2" role="group" aria-label={c.saveTitle}>
                      <button
                        type="button"
                        className={`welcome-card welcome-card--vertical welcome-card--icon-top ${draft.saveLocal === true ? 'welcome-card--selected' : ''}`}
                        aria-pressed={draft.saveLocal === true}
                        onClick={() => chooseSave(true)}
                      >
                        <span className={`welcome-card__icon ${draft.saveLocal === true ? 'welcome-card__icon--on' : ''}`}>
                          <IconSaveYes />
                        </span>
                        <span className="welcome-card__title">{c.saveYes}</span>
                        <span className="welcome-card__desc">{c.saveYesDesc}</span>
                        {draft.saveLocal === true && <CheckBadge />}
                      </button>
                      <button
                        type="button"
                        className={`welcome-card welcome-card--vertical welcome-card--icon-top ${draft.saveLocal === false ? 'welcome-card--selected' : ''}`}
                        aria-pressed={draft.saveLocal === false}
                        onClick={() => chooseSave(false)}
                      >
                        <span className={`welcome-card__icon ${draft.saveLocal === false ? 'welcome-card__icon--on' : ''}`}>
                          <IconSaveNo />
                        </span>
                        <span className="welcome-card__title">{c.saveNo}</span>
                        <span className="welcome-card__desc">{c.saveNoDesc}</span>
                        {draft.saveLocal === false && <CheckBadge />}
                      </button>
                    </div>
                  )}

                  {stepIndex === 4 && (
                    <>
                      <div className="welcome-legal">
                        {t.legal.sections.map((section) => (
                          <section className="welcome-legal__section" key={section.title}>
                            <h3>{section.title}</h3>
                            <p>{section.body}</p>
                          </section>
                        ))}
                      </div>
                      <div className="welcome-warn">
                        <IconWarning />
                        <span>{t.legal.resultMismatchWarning}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="welcome-panel__footer">
                {isLast && (
                  <label className="welcome-ack">
                    <input
                      type="checkbox"
                      checked={draft.ackChecked}
                      onChange={(e) => dispatch({ type: 'setAck', ack: e.target.checked })}
                    />
                    <span>{t.legal.acknowledge}</span>
                  </label>
                )}
                <div className="welcome-nav">
                  <div className="welcome-nav__slot welcome-nav__slot--start">
                    {stepIndex > 0 && (
                      <button
                        type="button"
                        className="welcome-btn welcome-btn--ghost"
                        onClick={() => dispatch({ type: 'back' })}
                      >
                        <IconChevronLeft />
                        {c.back}
                      </button>
                    )}
                  </div>
                  <span className="welcome-nav__counter" aria-live="polite">
                    {counterLabel}
                  </span>
                  <div className="welcome-nav__slot welcome-nav__slot--end">
                    {isLast ? (
                      <button
                        type="button"
                        className="welcome-btn welcome-btn--primary"
                        onClick={complete}
                        disabled={!draft.ackChecked}
                      >
                        {c.start}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="welcome-btn welcome-btn--primary"
                        onClick={() => dispatch({ type: 'next' })}
                        disabled={nextDisabled}
                      >
                        {c.next}
                        <IconChevronRight />
                      </button>
                    )}
                  </div>
                </div>
                {!isLast && (
                  <button
                    type="button"
                    className="welcome-skip"
                    onClick={() => dispatch({ type: 'goto', step: WELCOME_LAST_STEP })}
                  >
                    {c.skip}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function stepTitle(step: number, c: import('../i18n').Messages['welcome']): string {
  switch (step) {
    case 0:
      return c.greetingTitle
    case 1:
      return c.instrumentTitle
    case 2:
      return c.stageTitle
    case 3:
      return c.saveTitle
    default:
      return c.disclaimerStepTitle
  }
}

function stepBody(step: number, c: import('../i18n').Messages['welcome']): string {
  switch (step) {
    case 0:
      return c.greetingBody
    case 1:
      return c.instrumentBody
    case 2:
      return c.stageBody
    case 3:
      return c.saveBody
    default:
      return c.disclaimerStepBody
  }
}
