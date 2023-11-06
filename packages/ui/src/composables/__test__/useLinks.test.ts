import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import useLinks from '../useLinks'

describe('useLinks', () => {
  it('should initialize linksMap correctly', () => {
    const { linksMap } = useLinks()

    const expectedLinksMap = ref({
      homepage: 'https://mqttx.app',
    })

    expect(linksMap.value).toEqual(expectedLinksMap.value)
  })
})
