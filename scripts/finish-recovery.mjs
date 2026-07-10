import fs from 'node:fs'
import path from 'node:path'

const repo = path.resolve('C:/Users/rlarb/김규민/code/lvclac')
const patchDir = path.join(repo, '.recovery/patches')

function readPatch(name) {
  return fs.readFileSync(path.join(patchDir, name), 'utf8')
}

function apply(content, oldFile, newFile) {
  const oldStr = readPatch(oldFile)
  const newStr = readPatch(newFile)
  if (!content.includes(oldStr)) {
    console.warn('MISS', oldFile)
    return content
  }
  console.log('OK', oldFile)
  return content.replace(oldStr, newStr)
}

// --- MyPage.tsx ---
let mypage = fs.readFileSync(path.join(repo, '.recovery/final/MyPage.tsx'), 'utf8')

const navBlock = readPatch('048-4ce2ad95-feaa-4e92-9604-7a16f26e9d3d-MyPage.tsx-NEW')

mypage = mypage.replace(
  `        ) : (
          <>
            <section className="my-page-identity-card" aria-label={copy.navAccount}>
              <span className="my-page-avatar" aria-hidden="true">
                {user.nickname.trim().charAt(0).toUpperCase() || '?'}
              </span>
              <div className="my-page-identity-info">
                <strong title={user.nickname}>{user.nickname}</strong>
                <span className="my-page-identity-meta" title={user.email}>
                  {user.email}
                </span>
              </div>
              <span className={\`my-page-badge\${isPro ? '' : ' my-page-badge--muted'}\`}>
                {isPro ? copy.billing.statusPro : copy.billing.statusFree}
              </span>
            </section>

            <main className="my-page-console">`,
  `        ) : (
          <div className="my-page-body">
              ${navBlock.trim()}
              <main className="my-page-console">`,
)

mypage = mypage.replace(
  `              {devResetPanel}
            </main>
          </>
        )}`,
  `              {devResetPanel}
            </main>
          </div>
        )}`,
)

mypage = apply(
  mypage,
  '095-b22d3cde-be78-40a3-9b9c-1434d6ae6ff7-MyPage.tsx-OLD',
  '095-b22d3cde-be78-40a3-9b9c-1434d6ae6ff7-MyPage.tsx-NEW',
)

const storagePrivacyOld = readPatch('004-508bc37a-fdca-41bb-a310-6e34e468343a-MyPage.tsx-OLD')
const storagePrivacyNew = `              {recordsSummaryPanel}

              {preferencesPanel}

`
if (mypage.includes(storagePrivacyOld)) {
  mypage = mypage.replace(storagePrivacyOld, storagePrivacyNew)
  console.log('OK storage->recordsSummary')
} else {
  // remove storage + duplicate billing + privacy manually
  mypage = mypage.replace(
    /\s*<section\s+id="my-page-storage"[\s\S]*?<\/section>\s*\{billingPanel\}\s*<section\s+id="my-page-privacy"[\s\S]*?<\/section>/,
    `\n              {recordsSummaryPanel}\n\n              {preferencesPanel}\n`,
  )
  console.log('OK storage regex removal')
}

const supportOld = `              <section
                id="my-page-support"
                className="my-page-panel"
                aria-labelledby="my-page-support-title"
              >
                <div className="my-page-support-grid">
                  <div>
                    <h2 id="my-page-support-title">{copy.supportTitle}</h2>
                    <p>{copy.supportBody}</p>
                    <div className="my-page-actions">
                      <a className="btn btn-ghost" href={suggestionsHref}>
                        {copy.suggestionsLink}
                      </a>
                      <a className="btn btn-ghost" href={supportHref}>
                        {copy.emailLink}
                      </a>
                    </div>
                  </div>
                  <div className="my-page-delete-note">
                    <h3>{copy.deleteAccountTitle}</h3>
                    <p>{copy.deleteAccountBody}</p>
                    <a className="link-btn" href={supportHref}>
                      {copy.contactSupport}
                    </a>
                  </div>
                </div>
              </section>`

if (mypage.includes(supportOld)) {
  mypage = mypage.replace(supportOld, readPatch('052-0b1dd0c6-f5b8-4cb4-8c3d-fb77525a66e3-MyPage.tsx-NEW').trim())
  console.log('OK support channels')
}

// props + destructuring fixes
mypage = mypage.replace(
  `  passwordFormOpen: boolean
  passwordDraft: string
  passwordConfirmationDraft: string
  storageLoading: boolean
  storageError: string | null
  hasCloudInput: boolean
  orderHistoryCount: number
  accountSnapshotCount: number
  supportHref: string
  suggestionsHref: string
  /** 구독 결제 패널. 로그인 사용자에게만 주입된다. */
  billingPanel?: ReactNode`,
  `  passwordFormOpen: boolean
  passwordDraft: string
  passwordConfirmationDraft: string
  supportHref: string
  suggestionsHref: string
  adminFeedbackHref?: string
  /** 구독 결제 패널. 로그인 사용자에게만 주입된다. */
  billingPanel?: ReactNode
  recordsSummaryPanel?: ReactNode
  preferencesPanel?: ReactNode`,
)

mypage = mypage.replace(
  `  identityMessage,
  storageLoading,
  storageError,
  hasCloudInput,
  orderHistoryCount,
  accountSnapshotCount,
  supportHref,
  suggestionsHref,
  billingPanel,
  devResetPanel,`,
  `  identityMessage,
  passwordFormOpen,
  passwordDraft,
  passwordConfirmationDraft,
  supportHref,
  suggestionsHref,
  adminFeedbackHref,
  billingPanel,
  recordsSummaryPanel,
  preferencesPanel,
  devResetPanel,`,
)

// remove unused helpers if still present
mypage = mypage.replace(/\nfunction countLabel[\s\S]*?\n}\n\n/, '\n')
mypage = mypage.replace(/\nfunction StorageRow[\s\S]*?\n}\n\n/, '\n')

fs.writeFileSync(path.join(repo, 'src/components/MyPage.tsx'), mypage)

// --- pages.css ---
let pages = fs.readFileSync(path.join(repo, '.recovery/final/pages.css'), 'utf8')
if (!pages.includes('.my-page-nav {')) {
  pages = pages.replace(
    '.my-page-header {',
    readPatch('045-4ce2ad95-feaa-4e92-9604-7a16f26e9d3d-pages.css-NEW') + '\n\n.my-page-header {',
  )
  console.log('OK inserted nav css')
}
pages = pages.replace('width: min(100%, 820px);', 'width: min(100%, 1080px);')
fs.writeFileSync(path.join(repo, 'src/styles/pages.css'), pages)

// --- BillingPanel ---
fs.copyFileSync(
  path.join(repo, '.recovery/final/BillingPanel.tsx'),
  path.join(repo, 'src/components/billing/BillingPanel.tsx'),
)

// --- MyPage.test.tsx: replay patches on final ---
let test = fs.readFileSync(path.join(repo, '.recovery/final/MyPage.test.tsx'), 'utf8')
for (const [oldF, newF] of [
  ['007-508bc37a-fdca-41bb-a310-6e34e468343a-MyPage.test.tsx-OLD', '007-508bc37a-fdca-41bb-a310-6e34e468343a-MyPage.test.tsx-NEW'],
  ['008-508bc37a-fdca-41bb-a310-6e34e468343a-MyPage.test.tsx-OLD', '008-508bc37a-fdca-41bb-a310-6e34e468343a-MyPage.test.tsx-NEW'],
  ['012-508bc37a-fdca-41bb-a310-6e34e468343a-MyPage.test.tsx-OLD', '012-508bc37a-fdca-41bb-a310-6e34e468343a-MyPage.test.tsx-NEW'],
  ['087-b22d3cde-be78-40a3-9b9c-1434d6ae6ff7-MyPage.test.tsx-OLD', '087-b22d3cde-be78-40a3-9b9c-1434d6ae6ff7-MyPage.test.tsx-NEW'],
  ['088-b22d3cde-be78-40a3-9b9c-1434d6ae6ff7-MyPage.test.tsx-OLD', '088-b22d3cde-be78-40a3-9b9c-1434d6ae6ff7-MyPage.test.tsx-NEW'],
  ['089-b22d3cde-be78-40a3-9b9c-1434d6ae6ff7-MyPage.test.tsx-OLD', '089-b22d3cde-be78-40a3-9b9c-1434d6ae6ff7-MyPage.test.tsx-NEW'],
  ['058-0b1dd0c6-f5b8-4cb4-8c3d-fb77525a66e3-MyPage.test.tsx-OLD', '058-0b1dd0c6-f5b8-4cb4-8c3d-fb77525a66e3-MyPage.test.tsx-NEW'],
]) {
  test = apply(test, oldF, newF)
}
fs.writeFileSync(path.join(repo, 'src/components/MyPage.test.tsx'), test)

console.log('\nDone. Markers:')
for (const m of ['my-page-nav', 'my-page-body', 'my-page-settings-list', 'recordsSummaryPanel', 'my-page-support-channel']) {
  console.log(m, mypage.includes(m))
}
