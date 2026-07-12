import { useEffect, useReducer, useRef } from 'react'
import { GUIDE_PATH } from '../config/routes'
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

/**
 * 첫 진입 통합 환영 온보딩. 지역·거래종목·거래상태·짧은 사용법·면책동의를 하나의 관문으로.
 * 면책 ack/skip + 온보딩 완료 플래그 커밋은 부모(DisclaimerProvider)가 onComplete에서 수행하고,
 * 여기서는 언어·프리셋(라이브)·자동스냅샷 시간대만 반영한다.
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
    onComplete(persist)
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

  const isLast = draft.step === WELCOME_LAST_STEP
  const nextDisabled =
    (draft.step === 3 && draft.marginMode === null) ||
    (draft.step === 4 && draft.stage === null) ||
    (draft.step === 6 && draft.saveLocal === null)

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
              <p className="disclaimer-modal-text">{c.marginBody}</p>
              <div className="welcome-options" role="group" aria-label={c.marginTitle}>
                {marginCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className={`welcome-option welcome-option--card ${draft.marginMode === card.id ? 'welcome-option--active' : ''}`}
                    aria-pressed={draft.marginMode === card.id}
                    onClick={() => chooseMargin(card.id)}
                  >
                    <span className="welcome-option__title">{card.title}</span>
                    <span className="welcome-option__desc">{card.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {draft.step === 4 && (
            <>
              <p className="disclaimer-modal-text">{c.stageBody}</p>
              <div className="welcome-options" role="group" aria-label={c.stageTitle}>
                {stageCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className={`welcome-option welcome-option--card ${draft.stage === card.id ? 'welcome-option--active' : ''}`}
                    aria-pressed={draft.stage === card.id}
                    onClick={() => chooseStage(card.id)}
                  >
                    <span className="welcome-option__title">{card.title}</span>
                    <span className="welcome-option__desc">{card.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {draft.step === 5 && (
            <>
              <ul className="welcome-usage-list">
                {usageBody.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
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

          {draft.step === 6 && (
            <>
              <p className="disclaimer-modal-text">{c.saveBody}</p>
              <div className="welcome-options" role="group" aria-label={c.saveTitle}>
                <button
                  type="button"
                  className={`welcome-option welcome-option--card ${draft.saveLocal === true ? 'welcome-option--active' : ''}`}
                  aria-pressed={draft.saveLocal === true}
                  onClick={() => chooseSave(true)}
                >
                  <span className="welcome-option__title">{c.saveYes}</span>
                  <span className="welcome-option__desc">{c.saveYesDesc}</span>
                </button>
                <button
                  type="button"
                  className={`welcome-option welcome-option--card ${draft.saveLocal === false ? 'welcome-option--active' : ''}`}
                  aria-pressed={draft.saveLocal === false}
                  onClick={() => chooseSave(false)}
                >
                  <span className="welcome-option__title">{c.saveNo}</span>
                  <span className="welcome-option__desc">{c.saveNoDesc}</span>
                </button>
              </div>
            </>
          )}

          {draft.step === 7 && (
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
      return c.marginTitle
    case 4:
      return c.stageTitle
    case 5:
      return c.usageTitle
    case 6:
      return c.saveTitle
    default:
      return c.disclaimerStepTitle
  }
}
