import { createRoot } from 'react-dom/client'
import { LanguageProvider } from '../../src/i18n'
import { BillingPage } from '../../src/components/billing/BillingPage'
import '../../src/App.css'

// Playwright replaces authentication and billing requests before loading the real page.
createRoot(document.getElementById('root')!).render(<LanguageProvider><BillingPage /></LanguageProvider>)
