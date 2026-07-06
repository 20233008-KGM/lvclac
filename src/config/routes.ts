export const FORMULAS_PATH = '/formulas'
export const GUIDE_PATH = '/guide'
export const ABOUT_PATH = '/about'
export const MY_PAGE_PATH = '/my'

export function isFormulasPath(pathname: string): boolean {
  return pathname === FORMULAS_PATH || pathname === `${FORMULAS_PATH}/`
}

export function isGuidePath(pathname: string): boolean {
  return pathname === GUIDE_PATH || pathname === `${GUIDE_PATH}/`
}

export function isAboutPath(pathname: string): boolean {
  return pathname === ABOUT_PATH || pathname === `${ABOUT_PATH}/`
}

export function isMyPagePath(pathname: string): boolean {
  return pathname === MY_PAGE_PATH || pathname === `${MY_PAGE_PATH}/`
}
