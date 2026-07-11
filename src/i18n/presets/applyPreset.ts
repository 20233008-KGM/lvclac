import type { Messages } from '../types'
import type { PresetOverride } from './types'

/**
 * 두 오버라이드를 1레벨 병합한다(공통 베이스 + 상품별 차이 합성용).
 * `fields`는 필드 키 단위로 한 겹 더 스프레드해서, 부분 지정한 patch가
 * base의 다른 속성을 날리지 않도록 한다.
 */
export function mergeOverride(base: PresetOverride, patch: PresetOverride): PresetOverride {
  const fields: NonNullable<PresetOverride['fields']> = { ...base.fields }
  if (patch.fields) {
    for (const key of Object.keys(patch.fields) as (keyof Messages['fields'])[]) {
      fields[key] = { ...base.fields?.[key], ...patch.fields[key] }
    }
  }
  const results = { ...base.results, ...patch.results }
  return { fields, results }
}

/**
 * 로드된 로케일 `Messages` 위에 프리셋 오버라이드를 얕게 병합한 새 객체를 반환한다.
 * - base는 절대 변형하지 않는다(항상 새 객체 생성).
 * - override가 null이면(=`'default'` 프리셋) base를 그대로 반환한다.
 * - 반환 타입이 `Messages`라 fields의 14개 키 형상이 컴파일 타임에 보장된다.
 */
export function applyPreset(base: Messages, override: PresetOverride | null): Messages {
  if (!override) return base

  const fields = { ...base.fields }
  if (override.fields) {
    for (const key of Object.keys(override.fields) as (keyof Messages['fields'])[]) {
      const patch = override.fields[key]
      if (patch) fields[key] = { ...base.fields[key], ...patch }
    }
  }

  const results = override.results ? { ...base.results, ...override.results } : base.results

  return { ...base, fields, results }
}
