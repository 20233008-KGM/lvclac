import { useEffect, useState, type ReactNode } from 'react'
import { LayoutProvider } from '../context/LayoutContext'
import { useLanguage } from '../i18n'
import { sampleInputs, type CalculatorInputs } from '../types'
import { InputPanel } from './InputPanel'
import { ResultPanel } from './ResultPanel'
import { SiteFooter } from './SiteFooter'
import { LanguageToggle } from './LanguageToggle'
import { PresetSelect } from './PresetSelect'
import { HowToUseButton } from './HowToUseButton'
import { AuthButton } from './auth/AuthButton'
import { SaveDraftToggle } from './SaveDraftToggle'
import { ClearAllInputsButton } from './ClearAllInputsButton'
import { NumberInput } from './NumberInput'
import { NumberStepper } from './NumberStepper'

/**
 * UI 키트 전시장 — 실제 컴포넌트를 채워진 샘플값으로 한 화면에 나열한다.
 * Figma로 통째로 가져와(html.to.design 등) 컴포넌트별로 분리·편집하기 위한 개발 전용 페이지.
 * 라우팅은 App.tsx에서 import.meta.env.DEV에서만 연결되므로 프로덕션엔 노출되지 않는다.
 * onChange류는 시각 전용이라 no-op — 컴포넌트는 초기 prop값 그대로 렌더된다.
 */

const noop = () => {}

/** 컴포넌트 하나를 라벨과 함께 감싼 카드 — Figma에서 프레임 하나로 분리된다. */
function KitItem({
  name,
  note,
  width,
  children,
}: {
  name: string
  note?: string
  width?: number
  children: ReactNode
}) {
  return (
    <section className="kit-item">
      <header className="kit-item__meta">
        <span className="kit-item__name">{name}</span>
        {note ? <span className="kit-item__note">{note}</span> : null}
      </header>
      <div className="kit-item__stage" style={width ? { width } : undefined}>
        {children}
      </div>
    </section>
  )
}

export function KitGallery() {
  const { setLocale, locale } = useLanguage()
  const [inputs] = useState<CalculatorInputs>(() => ({
    ...sampleInputs,
    orderPrice: sampleInputs.currentPrice,
  }))

  // URL의 ?lang=en / ?lang=ko 로 언어를 강제 — EN/KO 두 번 export할 때 결정적으로 쓴다.
  useEffect(() => {
    const lang = new URLSearchParams(window.location.search).get('lang')
    if (lang === 'en' || lang === 'ko') setLocale(lang)
  }, [setLocale])

  return (
    <LayoutProvider layoutMode="auto" fitScale={1}>
      <div className="kit-root" data-locale={locale}>
        <style>{KIT_STYLES}</style>

        <header className="kit-head">
          <h1 className="kit-head__title">LiqGuard UI Kit</h1>
          <p className="kit-head__sub">
            컴포넌트 전시장 · 현재 언어: <strong>{locale.toUpperCase()}</strong> · 편집용 스냅샷
          </p>
        </header>

        <section className="kit-section">
          <h2 className="kit-section__title">헤더 컨트롤</h2>
          <div className="kit-row">
            <KitItem name="LanguageToggle">
              <LanguageToggle variant="default" />
            </KitItem>
            <KitItem name="PresetSelect">
              <PresetSelect variant="inline" />
            </KitItem>
            <KitItem name="HowToUseButton">
              <HowToUseButton />
            </KitItem>
            <KitItem name="AuthButton" note="variant=header">
              <AuthButton variant="header" />
            </KitItem>
          </div>
        </section>

        <section className="kit-section">
          <h2 className="kit-section__title">개별 입력 컨트롤</h2>
          <div className="kit-row">
            <KitItem name="NumberInput" width={200}>
              <NumberInput value={350} onChange={noop} />
            </KitItem>
            <KitItem name="NumberStepper" width={220}>
              <NumberStepper
                value={2}
                onChange={noop}
                step={1}
                stepUpLabel="+1"
                stepDownLabel="-1"
              />
            </KitItem>
            <KitItem name="ClearAllInputsButton">
              <ClearAllInputsButton />
            </KitItem>
            <KitItem name="SaveDraftToggle">
              <SaveDraftToggle />
            </KitItem>
          </div>
        </section>

        <section className="kit-section">
          <h2 className="kit-section__title">패널</h2>
          <div className="kit-row kit-row--panels">
            <KitItem name="InputPanel" note="inputs · onChange" width={440}>
              <InputPanel inputs={inputs} onChange={noop} />
            </KitItem>
            <KitItem name="ResultPanel" note="inputs · onChange" width={480}>
              <ResultPanel inputs={inputs} onChange={noop} />
            </KitItem>
          </div>
        </section>

        <section className="kit-section">
          <h2 className="kit-section__title">푸터</h2>
          <div className="kit-row">
            <KitItem name="SiteFooter" width={900}>
              <SiteFooter />
            </KitItem>
          </div>
        </section>
      </div>
    </LayoutProvider>
  )
}

const KIT_STYLES = `
.kit-root {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
  padding: 40px 48px 80px;
  box-sizing: border-box;
}
.kit-head { margin-bottom: 40px; }
.kit-head__title { font-size: 28px; font-weight: 700; margin: 0 0 6px; letter-spacing: -0.01em; }
.kit-head__sub { margin: 0; color: var(--color-text-muted); font-size: 14px; }
.kit-section { margin-bottom: 48px; }
.kit-section__title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-dim);
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: 8px;
  margin: 0 0 24px;
}
.kit-row {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  align-items: flex-start;
}
.kit-row--panels { gap: 40px; }
.kit-item {
  display: inline-flex;
  flex-direction: column;
  gap: 10px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius);
  padding: 16px;
}
.kit-item__meta { display: flex; align-items: baseline; gap: 10px; }
.kit-item__name {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-primary);
}
.kit-item__note { font-size: 11px; color: var(--color-text-dim); }
.kit-item__stage { position: relative; }
`
