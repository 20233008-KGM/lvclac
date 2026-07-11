import type { FieldCopy, Messages, PresetId } from '../types'

export type { PresetId }

/**
 * 용어 프리셋 오버라이드. 계산 로직·기본값은 절대 건드리지 않고
 * 화면 라벨(fields.label / results 값)만 상품군 어휘로 덮어쓴다.
 *
 * - `fields`: 각 필드의 `label`(+예시가 바뀌는 곳은 placeholder)만 부분 지정.
 *   `hint`는 마크다운/단축키가 섞인 긴 문자열이라 프리셋별로 분기하지 않는다.
 * - `results`: 개방형 `Record<string,string>`라 타입이 오타를 못 잡으므로
 *   무결성 테스트(presetOverrides.test.ts)로 "베이스에 존재하는 키"만 덮는지 검증한다.
 */
export interface PresetOverride {
  fields?: Partial<Record<keyof Messages['fields'], Partial<FieldCopy>>>
  results?: Record<string, string>
}
