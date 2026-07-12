import { useEffect, useState, type ReactNode } from 'react'
import { LayoutProvider } from '../context/LayoutContext'
import { useLanguage } from '../i18n'
import { sampleInputs, type CalculatorInputs } from '../types'
import type { CalculatorNumberSet } from '../context/CalculatorContext'
import type { AuthUser } from '../db/profile'
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
import {
  MyPageView,
  AccountRecordsSummaryPanel,
  AccountSnapshotAutomationPanel,
  RegionPreferenceBlock,
  NumberSetPreferencesPanel,
} from './MyPage'
import { BillingPanel } from './billing/BillingPanel'

/**
 * UI 키트 전시장 — 실제 컴포넌트를 채워진 샘플값으로 나열(개발/Figma export 전용).
 * '납작한(flat)' 구조: 컴포넌트마다 라벨 붙은 카드 하나가 kit-root의 직속 자식.
 * 페이지 배경은 밝은 회색(#f5f5f5) → import 시 '검은 패널'이 생기지 않는다.
 * onChange류는 시각 전용 no-op. ?lang은 detectInitialLocale에서 최우선 처리.
 */

const noop = () => {}
const noopAsyncFalse = async () => false

/** 마이페이지 전시용 가짜 로그인 사용자(Pro). */
const mockUser: AuthUser = {
  id: 'kit-demo',
  email: 'demo@liqguard.com',
  nickname: '데모 사용자',
  autoSaveOrderHistory: true,
  isAdmin: false,
}

/** 숫자세트 전시용 목 클라우드 세트(캡처처럼 3개). */
const mockCloudSets: CalculatorNumberSet[] = [
  { id: 'set-2', title: '슬롯 2', inputs: sampleInputs, updatedAt: null, storageMode: 'cloud' },
  { id: 'set-3', title: '슬롯 3', inputs: sampleInputs, updatedAt: null, storageMode: 'cloud' },
  { id: 'set-default', title: '기본 세트', inputs: sampleInputs, updatedAt: null, storageMode: 'cloud' },
]
const numberSetLimits: Record<'local' | 'cloud', number> = { local: 10, cloud: 10 }

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

/** 지역/거래종목/숫자세트/자동스냅샷을 실제 마이페이지처럼 조립한 환경설정 패널. */
function PreferencesPanelDemo() {
  const { t } = useLanguage()
  return (
    <section className="my-page-panel" aria-labelledby="kit-prefs-title">
      <h2 id="kit-prefs-title">{t.myPage.preferencesTitle}</h2>
      <RegionPreferenceBlock copy={t.myPage} regions={t.welcome.regions} region="KR" onChange={noop} />
      <div className="my-page-preference-block">
        <h3>{t.myPage.glossaryPresetTitle}</h3>
        <p>{t.myPage.glossaryPresetBody}</p>
        <PresetSelect variant="inline" />
      </div>
      <NumberSetPreferencesPanel
        copy={t.myPage}
        localNumberSets={[]}
        cloudNumberSets={mockCloudSets}
        activeNumberSetId="set-2"
        numberSetLimits={numberSetLimits}
        busy={false}
        notice={null}
        onCreateNumberSet={noop}
        onRenameNumberSet={noop}
        onDeleteNumberSet={noop}
        onSelectNumberSet={noop}
      />
      <AccountSnapshotAutomationPanel
        copy={t.myPage}
        isPro
        hasCloudInput
        settings={null}
        browserTimeZone="Asia/Seoul"
        onSave={noop}
        onDisable={noop}
      />
    </section>
  )
}

/** MyPageView(순수 표현) 전체 — 계정 허브·연동 로그인·구독·기록·환경설정 조립본. */
function MyPageDemo() {
  const { t } = useLanguage()
  return (
    <MyPageView
      copy={t.myPage}
      authLoading={false}
      configured
      user={mockUser}
      isPro
      nicknameDraft={mockUser.nickname}
      nicknameBusy={false}
      nicknameMessage={null}
      linkedProviders={['email', 'google']}
      identityBusy={null}
      identityMessage={null}
      passwordFormOpen={false}
      passwordDraft=""
      passwordConfirmationDraft=""
      supportHref="mailto:support@liqguard.com"
      recordsSummaryPanel={
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
      }
      preferencesPanel={<PreferencesPanelDemo />}
      billingPanel={<BillingPanel embedded />}
      devResetPanel={null}
      onNicknameChange={noop}
      onNicknameSubmit={noopAsyncFalse}
      onLinkGoogle={noop}
      onUnlinkGoogle={noop}
      onPasswordFormToggle={noop}
      onPasswordDraftChange={noop}
      onPasswordConfirmationDraftChange={noop}
      onSetPasswordSubmit={noop}
      onLoginClick={noop}
      onSignOut={noop}
    />
  )
}

export function KitGallery() {
  const { locale, t } = useLanguage()
  const [inputs] = useState<CalculatorInputs>(() => ({
    ...sampleInputs,
    orderPrice: sampleInputs.currentPrice,
  }))

  // 언어는 detectInitialLocale()이 URL의 ?lang=en|ko 를 최우선(동기)으로 확정한다.

  // 밝은 배경 — Figma import 시 프레임이 캔버스색과 같아져 '검은 배경 패널'이 안 생긴다.
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

        <KitItem name="AccountRecordsSummaryPanel" note="마이페이지" width={540}>
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
        <KitItem name="RegionPreferenceBlock" note="환경설정·지역" width={420}>
          <RegionPreferenceBlock copy={t.myPage} regions={t.welcome.regions} region="KR" onChange={noop} />
        </KitItem>
        <KitItem name="NumberSetPreferencesPanel" note="환경설정·숫자세트" width={560}>
          <NumberSetPreferencesPanel
            copy={t.myPage}
            localNumberSets={[]}
            cloudNumberSets={mockCloudSets}
            activeNumberSetId="set-2"
            numberSetLimits={numberSetLimits}
            busy={false}
            notice={null}
            onCreateNumberSet={noop}
            onRenameNumberSet={noop}
            onDeleteNumberSet={noop}
            onSelectNumberSet={noop}
          />
        </KitItem>
        <KitItem name="AccountSnapshotAutomationPanel" note="마이페이지" width={540}>
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
        <KitItem name="BillingPanel" note="구독 결제" width={540}>
          <BillingPanel embedded />
        </KitItem>
        <KitItem name="MyPageView" note="계정 허브·연동 로그인 포함 전체" width={1080}>
          <MyPageDemo />
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
