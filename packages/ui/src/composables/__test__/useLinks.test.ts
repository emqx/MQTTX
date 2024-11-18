import { describe, expect, it } from 'vitest'

describe('useLinks', () => {
  it('should initialize linksMap correctly', () => {
    const { linksMap } = useLinks()

    const expectedLinksMap = ref({
      homepage: 'https://mqttx.app',
    })

    expect(linksMap.value).toEqual(expectedLinksMap.value)
  })
})
