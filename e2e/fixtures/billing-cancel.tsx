import { createRoot } from 'react-dom/client'
import { LanguageProvider } from '../../src/i18n'
import { BillingCancelPage } from '../../src/components/billing/BillingCancelPage'
import '../../src/App.css'

// Auth and billing modules are replaced by Playwright before this fixture loads.
createRoot(document.getElementById('root')!).render(
  <LanguageProvider><BillingCancelPage /></LanguageProvider>,
)
