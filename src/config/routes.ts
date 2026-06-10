export const FORMULAS_PATH = '/formulas'

export function isFormulasPath(pathname: string): boolean {
  return pathname === FORMULAS_PATH || pathname === `${FORMULAS_PATH}/`
}
