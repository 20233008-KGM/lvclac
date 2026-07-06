import { describe, expect, it } from 'vitest'
import { isMyPagePath, MY_PAGE_PATH } from './routes'

describe('routes', () => {
  it('recognizes the my page route with optional trailing slash', () => {
    expect(MY_PAGE_PATH).toBe('/my')
    expect(isMyPagePath('/my')).toBe(true)
    expect(isMyPagePath('/my/')).toBe(true)
    expect(isMyPagePath('/my/settings')).toBe(false)
  })
})
