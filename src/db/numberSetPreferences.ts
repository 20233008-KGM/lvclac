import { supabase } from './supabaseClient'

export type ActiveCloudNumberSetResult =
  | { data: string | null; error: null }
  | { data: null; error: string }

interface PreferenceRow {
  active_cloud_number_set_id: string | null
}

type PreferenceClient = NonNullable<typeof supabase>

function unavailable(): ActiveCloudNumberSetResult {
  return { data: null, error: 'supabase_not_configured' }
}

function mapError(error: { message?: string } | null | undefined): string {
  return error?.message || 'active_cloud_number_set_error'
}

export function createNumberSetPreferencesRepository(
  client: PreferenceClient | null = supabase,
) {
  return {
    async fetchActive(userId: string): Promise<ActiveCloudNumberSetResult> {
      if (!client) return unavailable()
      const { data, error } = await client
        .from('profiles')
        .select('active_cloud_number_set_id')
        .eq('id', userId)
        .maybeSingle<PreferenceRow>()

      if (error) return { data: null, error: mapError(error) }
      return { data: data?.active_cloud_number_set_id ?? null, error: null }
    },

    async saveActive(
      userId: string,
      setId: string | null,
    ): Promise<ActiveCloudNumberSetResult> {
      if (!client) return unavailable()
      const { data, error } = await client
        .from('profiles')
        .update({ active_cloud_number_set_id: setId })
        .eq('id', userId)
        .select('active_cloud_number_set_id')
        .maybeSingle<PreferenceRow>()

      if (error) return { data: null, error: mapError(error) }
      if (!data) return { data: null, error: 'profile_not_found' }
      return { data: data.active_cloud_number_set_id, error: null }
    },
  }
}

export async function fetchActiveCloudNumberSetId(
  userId: string,
): Promise<ActiveCloudNumberSetResult> {
  return createNumberSetPreferencesRepository().fetchActive(userId)
}

export async function saveActiveCloudNumberSetId(
  userId: string,
  setId: string | null,
): Promise<ActiveCloudNumberSetResult> {
  return createNumberSetPreferencesRepository().saveActive(userId, setId)
}
