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
 * UI 키트 전시장 — 실제 컴포넌트를 채워진 샘플값으로 나열(개발/Figma export 전용).
 * '납작한(flat)' 구조: 컴포넌트마다 라벨 붙은 카드 하나가 kit-root의 직속 자식.
 * → Figma import 후 겉프레임 하나만 벗기면(ungroup) 각 컴포넌트가 낱개 프레임으로 분리된다.
 * 페이지 배경은 밝은 회색(#f5f5f5, Figma 캔버스색) → import 시 '검은 패널'이 생기지 않는다.
 * onChange류는 시각 전용 no-op. ?lang=en / ?lang=ko 로 언어 강제.
 */

const noop = () => {}

/** 컴포넌트 하나 = 라벨 붙은 낱개 카드(Figma에서 프레임 하나로 분리). */
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

  // 밝은 배경 — Figma import 시 프레임이 캔버스색과 같아져 '검은 배경 패널'이 생기지 않는다.
  // 각 컴포넌트 카드는 자체 어두운 배경을 가지므로 컴포넌트는 정상적으로 보인다.
  useEffect(() => {
    const prevBody = document.body.style.background
    const prevHtml = document.documentElement.style.background
    document.body.style.background = '#f5f5f5'
    document.documentElement.style.background = '#f5f5f5'
    return () => {
      document.body.style.background = prevBody
      document.documentElement.style.background = prevHtml
    }
  }, [])

  return (
    <LayoutProvider layoutMode="auto" fitScale={1}>
      <div className="kit-root" data-locale={locale}>
        <style>{KIT_STYLES}</style>

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
        <KitItem name="NumberInput" width={200}>
          <NumberInput value={350} onChange={noop} />
        </KitItem>
        <KitItem name="NumberStepper" width={220}>
          <NumberStepper value={2} onChange={noop} step={1} stepUpLabel="+1" stepDownLabel="-1" />
        </KitItem>
        <KitItem name="ClearAllInputsButton">
          <ClearAllInputsButton />
        </KitItem>
        <KitItem name="SaveDraftToggle">
          <SaveDraftToggle />
        </KitItem>

        <KitItem name="InputPanel" note="inputs·onChange" width={440}>
          <InputPanel inputs={inputs} onChange={noop} />
        </KitItem>
        <KitItem name="ResultPanel" note="inputs·onChange" width={480}>
          <ResultPanel inputs={inputs} onChange={noop} />
        </KitItem>

        <KitItem name="AccountRecordsSummaryPanel" width={540}>
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
        <KitItem name="AccountSnapshotAutomationPanel" width={540}>
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
        <KitItem name="BillingPanel" width={540}>
          <BillingPanel embedded />
        </KitItem>

        <KitItem name="SiteFooter" width={900}>
          <SiteFooter />
        </KitItem>
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
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}
.kit-item {
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 16px;
}
.kit-item__meta { display: flex; align-items: baseline; gap: 8px; }
.kit-item__name { font-family: var(--font-mono); font-size: 11px; color: var(--color-primary); }
.kit-item__note { font-size: 10px; color: var(--color-text-dim); }
.kit-item__stage { position: relative; }
`
