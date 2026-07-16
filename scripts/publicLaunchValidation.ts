export const REQUIRED_PUBLIC_OPERATOR_ENV = [
  'VITE_PUBLIC_OPERATOR_LEGAL_NAME',
  'VITE_PUBLIC_OPERATOR_REPRESENTATIVE',
  'VITE_PUBLIC_OPERATOR_ADDRESS',
  'VITE_PUBLIC_OPERATOR_BUSINESS_REGISTRATION_NUMBER',
  'VITE_PUBLIC_OPERATOR_PRIVACY_OFFICER',
] as const

export function missingPublicOperatorEnv(
  env: Record<string, string | undefined>,
): string[] {
  return REQUIRED_PUBLIC_OPERATOR_ENV.filter((key) => !env[key]?.trim())
}

export function assertPublicLaunchReady(
  env: Record<string, string | undefined>,
): void {
  const launchEnabled =
    env.ALLOW_INDEXING === 'true' || Boolean(env.VITE_ADSENSE_CLIENT?.trim())
  if (!launchEnabled) return

  const missing = missingPublicOperatorEnv(env)
  if (missing.length === 0) return

  throw new Error(
    [
      'Public launch is enabled, but required operator information is missing:',
      ...missing.map((key) => `- ${key}`),
      'Set the verified legal values before enabling indexing or AdSense.',
    ].join('\n'),
  )
}
