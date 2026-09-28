export function isPaidLanding(search: string): boolean {
  const params = new URLSearchParams(search)
  return ['gclid', 'gbraid', 'wbraid'].some((key) => params.has(key))
    || ['cpc', 'ppc', 'paidsearch', 'paid_search'].includes(
      (params.get('utm_medium') ?? '').toLowerCase(),
    )
}
