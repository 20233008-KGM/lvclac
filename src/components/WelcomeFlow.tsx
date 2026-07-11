import { useEffect, useReducer, useRef } from 'react'
import { GUIDE_PATH } from '../config/routes'
import { PRESET_IDS, useLanguage, type PresetId } from '../i18n'
import { useModalFocusRestore } from '../hooks/useModalFocusRestore'
import {
  WELCOME_LAST_STEP,
  WELCOME_STEP_COUNT,
  makeInitialDraft,
  welcomeReducer,
  type TraderStage,
} from './welcomeFlowState'
import {
  WELCOME_REGIONS,
  regionToLocale,
  regionToSuggestedPreset,
  regionToTimeZone,
  writePreferredSnapshotTimeZone,
  type WelcomeRegion,
} from './welcomePreferences'

/** 거래 종목 선택지(표준 제외한 5종 상품군). */
const INSTRUMENT_IDS = PRESET_IDS.filter((id): id is Exclude<PresetId, 'default'> => id !== 'default')

/**
 * 첫 진입 통합 환영 온보딩. 지역·거래종목·거래상태·짧은 사용법·면책동의를 하나의 관문으로.
 * 면책 ack/skip + 온보딩 완료 플래그 커밋은 부모(DisclaimerProvider)가 onComplete에서 수행하고,
 * 여기서는 언어·프리셋(라이브)·자동스냅샷 시간대만 반영한다.
 */
export function WelcomeFlow({ onComplete }: { onComplete: () => void }) {
  const { t, locale, preset, setLocale, setPreset } = useLanguage()
  useModalFocusRestore()

  const initialRegion: WelcomeRegion = locale === 'ko' ? 'KR' : 'US'
  const initialInstrument: PresetId =
    preset !== 'default' ? preset : regionToSuggestedPreset(initialRegion)
  const [draft, dispatch] = useReducer(
    welcomeReducer,
    makeInitialDraft(initialRegion, initialInstrument),
  )

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

  const c = t.welcome
  const stepLabel = c.stepLabel
    .replace('{current}', String(draft.step + 1))
    .replace('{total}', String(WELCOME_STEP_COUNT))

  function chooseRegion(region: WelcomeRegion) {
    dispatch({ type: 'setRegion', region })
    setLocale(regionToLocale(region)) // 이후 단계 텍스트가 즉시 해당 언어로
  }

  function chooseInstrument(instrument: PresetId) {
    dispatch({ type: 'setInstrument', instrument })
    setPreset(instrument) // 뒤 계산기 라벨을 실시간 반영 + 영속
  }

  function chooseStage(stage: TraderStage) {
    dispatch({ type: 'setStage', stage })
  }

  function complete() {
    if (!draft.ackChecked) return
    writePreferredSnapshotTimeZone(regionToTimeZone(draft.region))
    setPreset(draft.instrument)
    onComplete()
  }

  const isLast = draft.step === WELCOME_LAST_STEP
  const nextDisabled = draft.step === 3 && draft.stage === null

  return (
    <div className="disclaimer-overlay" role="presentation">
      <div
        className="disclaimer-modal disclaimer-modal--wide disclaimer-modal--form welcome-flow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-step-title"
      >
        <div className="disclaimer-modal-scroll welcome-flow__body">
          <h2
            id="welcome-step-title"
            className="disclaimer-modal-title"
            tabIndex={-1}
            ref={headingRef}
          >
            {stepTitle(draft.step, c)}
          </h2>

          {draft.step === 0 && <p className="disclaimer-modal-text">{c.greetingBody}</p>}

          {draft.step === 1 && (
            <>
              <p className="disclaimer-modal-text">{c.regionBody}</p>
              <div className="welcome-options welcome-options--grid" role="group" aria-label={c.regionTitle}>
                {WELCOME_REGIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    className={`welcome-option ${draft.region === region ? 'welcome-option--active' : ''}`}
                    aria-pressed={draft.region === region}
                    onClick={() => chooseRegion(region)}
                  >
                    {c.regions[region]}
                  </button>
                ))}
              </div>
            </>
          )}

          {draft.step === 2 && (
            <>
              <p className="disclaimer-modal-text">{c.instrumentBody}</p>
              <div className="welcome-options welcome-options--grid" role="group" aria-label={c.instrumentTitle}>
                {INSTRUMENT_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={`welcome-option ${draft.instrument === id ? 'welcome-option--active' : ''}`}
                    aria-pressed={draft.instrument === id}
                    onClick={() => chooseInstrument(id)}
                  >
                    {t.glossaryPreset.options[id]}
                  </button>
                ))}
              </div>
            </>
          )}

          {draft.step === 3 && (
            <>
              <p className="disclaimer-modal-text">{c.stageBody}</p>
              <div className="welcome-options" role="group" aria-label={c.stageTitle}>
                <button
                  type="button"
                  className={`welcome-option welcome-option--card ${draft.stage === 'firstTrade' ? 'welcome-option--active' : ''}`}
                  aria-pressed={draft.stage === 'firstTrade'}
                  onClick={() => chooseStage('firstTrade')}
                >
                  <span className="welcome-option__title">{c.stageFirst}</span>
                  <span className="welcome-option__desc">{c.stageFirstDesc}</span>
                </button>
                <button
                  type="button"
                  className={`welcome-option welcome-option--card ${draft.stage === 'hasPosition' ? 'welcome-option--active' : ''}`}
                  aria-pressed={draft.stage === 'hasPosition'}
                  onClick={() => chooseStage('hasPosition')}
                >
                  <span className="welcome-option__title">{c.stageHasPosition}</span>
                  <span className="welcome-option__desc">{c.stageHasPositionDesc}</span>
                </button>
              </div>
            </>
          )}

          {draft.step === 4 && (
            <>
              <ul className="welcome-usage-list">
                {(draft.stage === 'hasPosition' ? c.usageHasPositionBody : c.usageFirstBody).map(
                  (line, i) => (
                    <li key={i}>{line}</li>
                  ),
                )}
              </ul>
              <a
                className="link-btn welcome-flow__guide"
                href={GUIDE_PATH}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.guideLink}
              </a>
            </>
          )}

          {draft.step === 5 && (
            <>
              <p className="disclaimer-modal-text">{c.disclaimerStepBody}</p>
              <div className="disclaimer-sections">
                {t.legal.sections.map((section) => (
                  <section key={section.title}>
                    <h3>{section.title}</h3>
                    <p>{section.body}</p>
                  </section>
                ))}
              </div>
              <p className="disclaimer-modal-warning">
                <span className="legal-emphasis">{t.legal.resultMismatchWarning}</span>
              </p>
            </>
          )}
        </div>

        <div className="welcome-flow__foot">
          {isLast && (
            <label className="disclaimer-modal-ack">
              <input
                type="checkbox"
                checked={draft.ackChecked}
                onChange={(e) => dispatch({ type: 'setAck', ack: e.target.checked })}
              />
              <span>{t.legal.acknowledge}</span>
            </label>
          )}
          <div className="welcome-flow__nav">
            {draft.step > 0 ? (
              <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'back' })}>
                {c.back}
              </button>
            ) : (
              <span />
            )}
            <span className="welcome-flow__step-count" aria-live="polite">
              {stepLabel}
            </span>
            {isLast ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={complete}
                disabled={!draft.ackChecked}
              >
                {c.start}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => dispatch({ type: 'next' })}
                disabled={nextDisabled}
              >
                {c.next}
              </button>
            )}
          </div>
          {!isLast && (
            <button
              type="button"
              className="link-btn welcome-flow__skip"
              onClick={() => dispatch({ type: 'goto', step: WELCOME_LAST_STEP })}
            >
              {c.skip}
            </button>
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
      return c.regionTitle
    case 2:
      return c.instrumentTitle
    case 3:
      return c.stageTitle
    case 4:
      return c.usageTitle
    default:
      return c.disclaimerStepTitle
  }
}
