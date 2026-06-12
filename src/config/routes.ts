export const FORMULAS_PATH = '/formulas'
export const GUIDE_PATH = '/guide'

export function isFormulasPath(pathname: string): boolean {
  return pathname === FORMULAS_PATH || pathname === `${FORMULAS_PATH}/`
}

export function isGuidePath(pathname: string): boolean {
  return pathname === GUIDE_PATH || pathname === `${GUIDE_PATH}/`
}
