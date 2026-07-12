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
import { AccountRecordsSummaryPanel, AccountSnapshotAutomationPanel } from './MyPage'
import { BillingPanel } from './billing/BillingPanel'

/**
 * UI 키트 전시장 — 실제 컴포넌트를 채워진 샘플값으로 나열한다(개발/Figma export 전용).
 * 배경은 투명 + 섹션별 카드로 묶어 격자처럼 촘촘하게 배치(거대한 단일 검은 패널 제거).
 * onChange류는 시각 전용 no-op — 컴포넌트는 초기 prop값 그대로 렌더된다.
 * ?lang=en / ?lang=ko 쿼리로 언어 강제(EN/KO 두 벌 export 지원).
 */

const noop = () => {}

/** 컴포넌트 하나를 라벨과 함께 감싼다 — Figma에서 프레임으로 분리된다. */
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
    <div className="kit-item">
      <div className="kit-item__meta">
        <span className="kit-item__name">{name}</span>
        {note ? <span className="kit-item__note">{note}</span> : null}
      </div>
      <div className="kit-item__stage" style={width ? { width } : undefined}>
        {children}
      </div>
    </div>
  )
}

/** 관련 컴포넌트를 한 카드(섹션)로 묶는다. */
function KitSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="kit-section">
      <h2 className="kit-section__title">{title}</h2>
      <div className="kit-row">{children}</div>
    </section>
  )
}

export function KitGallery() {
  const { setLocale, locale, t } = useLanguage()
  const [inputs] = useState<CalculatorInputs>(() => ({
    ...sampleInputs,
    orderPrice: sampleInputs.currentPrice,
  }))

  // URL의 ?lang=en / ?lang=ko 로 언어를 강제.
  useEffect(() => {
    const lang = new URLSearchParams(window.location.search).get('lang')
    if (lang === 'en' || lang === 'ko') setLocale(lang)
  }, [setLocale])

  // 큰 배경 검은 패널 제거 — 페이지 배경을 투명으로. 각 섹션 카드가 자체 어두운 배경을 가진다.
  useEffect(() => {
    const prevBody = document.body.style.background
    const prevHtml = document.documentElement.style.background
    document.body.style.background = 'transparent'
    document.documentElement.style.background = 'transparent'
    return () => {
      document.body.style.background = prevBody
      document.documentElement.style.background = prevHtml
    }
  }, [])

  return (
    <LayoutProvider layoutMode="auto" fitScale={1}>
      <div className="kit-root" data-locale={locale}>
        <style>{KIT_STYLES}</style>

        <header className="kit-head">
          <h1 className="kit-head__title">LiqGuard UI Kit</h1>
          <p className="kit-head__sub">
            컴포넌트 전시장 · {locale.toUpperCase()} · 편집용 스냅샷
          </p>
        </header>

        <KitSection title="헤더 · 입력 컨트롤">
          <KitItem name="LanguageToggle">
            <LanguageToggle variant="default" />
          </KitItem>
          <KitItem name="PresetSelect">
            <PresetSelect variant="inline" />
          </KitItem>
          <KitItem name="HowToUseButton">
            <HowToUseButton />
          </KitItem>
          <KitItem name="AuthButton" note="header">
            <AuthButton variant="header" />
          </KitItem>
          <KitItem name="NumberInput" width={180}>
            <NumberInput value={350} onChange={noop} />
          </KitItem>
          <KitItem name="NumberStepper" width={200}>
            <NumberStepper value={2} onChange={noop} step={1} stepUpLabel="+1" stepDownLabel="-1" />
          </KitItem>
          <KitItem name="ClearAllInputsButton">
            <ClearAllInputsButton />
          </KitItem>
          <KitItem name="SaveDraftToggle">
            <SaveDraftToggle />
          </KitItem>
        </KitSection>

        <KitSection title="계산기 패널">
          <KitItem name="InputPanel" note="inputs·onChange" width={420}>
            <InputPanel inputs={inputs} onChange={noop} />
          </KitItem>
          <KitItem name="ResultPanel" note="inputs·onChange" width={460}>
            <ResultPanel inputs={inputs} onChange={noop} />
          </KitItem>
        </KitSection>

        <KitSection title="마이페이지 패널">
          <KitItem name="AccountRecordsSummaryPanel" width={520}>
            <AccountRecordsSummaryPanel
              copy={t.myPage}
              recordsCopy={t.accountRecords}
              loading={false}
              error={null}
              notice={null}
              latestSnapshot={null}
              recentOrders={[]}
              archiveHref="#"
              autoSaveEnabled
              autoSaveBusy={false}
              onAutoSaveChange={noop}
              onRetry={noop}
            />
          </KitItem>
          <KitItem name="AccountSnapshotAutomationPanel" width={520}>
            <AccountSnapshotAutomationPanel
              copy={t.myPage}
              isPro
              hasCloudInput
              settings={null}
              browserTimeZone="Asia/Seoul"
              onSave={noop}
              onDisable={noop}
            />
          </KitItem>
          <KitItem name="BillingPanel" width={520}>
            <BillingPanel embedded />
          </KitItem>
        </KitSection>

        <KitSection title="푸터">
          <KitItem name="SiteFooter" width={900}>
            <SiteFooter />
          </KitItem>
        </KitSection>
      </div>
    </LayoutProvider>
  )
}

const KIT_STYLES = `
.kit-root {
  background: transparent;
  padding: 32px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: flex-start;
}
.kit-head {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 16px 20px;
}
.kit-head__title { font-size: 22px; font-weight: 700; margin: 0 0 4px; color: var(--color-text); letter-spacing: -0.01em; }
.kit-head__sub { margin: 0; color: var(--color-text-muted); font-size: 13px; }
.kit-section {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 20px 24px;
}
.kit-section__title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-dim);
  margin: 0 0 16px;
}
.kit-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}
.kit-item { display: inline-flex; flex-direction: column; gap: 8px; }
.kit-item__meta { display: flex; align-items: baseline; gap: 8px; }
.kit-item__name { font-family: var(--font-mono); font-size: 11px; color: var(--color-primary); }
.kit-item__note { font-size: 10px; color: var(--color-text-dim); }
.kit-item__stage { position: relative; }
`
