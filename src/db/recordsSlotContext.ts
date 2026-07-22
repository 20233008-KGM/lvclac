import { fetchNumberSets, type NumberSetRecord } from './numberSets'
import { supabase } from './supabaseClient'

type RecordsSlotContextResult =
  | {
      data: { slots: NumberSetRecord[]; activeSlotId: string | null }
      error: null
    }
  | { data: null; error: string }

interface ActiveSlotPreferenceRow {
  active_cloud_number_set_id: string | null
}

/**
 * 장부 첫 렌더 전에 슬롯 목록과 서버의 활성 클라우드 슬롯을 함께 해석한다.
 * 활성 슬롯 환경설정이 아직 배포되지 않았거나 읽기에 실패해도 슬롯 목록은 유지해
 * 호출부가 첫 슬롯으로 안전하게 대체할 수 있게 한다.
 */
export async function fetchRecordsSlotContext(
  userId: string,
): Promise<RecordsSlotContextResult> {
  const slotsPromise = fetchNumberSets(userId)
  const preferencePromise = supabase
    ? supabase
        .from('profiles')
        .select('active_cloud_number_set_id')
        .eq('id', userId)
        .maybeSingle<ActiveSlotPreferenceRow>()
    : Promise.resolve({ data: null, error: null })

  const [slotsResult, preferenceResult] = await Promise.all([
    slotsPromise,
    preferencePromise,
  ])

  if (slotsResult.error !== null) return slotsResult

  return {
    data: {
      slots: slotsResult.data,
      activeSlotId: preferenceResult.error
        ? null
        : preferenceResult.data?.active_cloud_number_set_id ?? null,
    },
    error: null,
  }
}
