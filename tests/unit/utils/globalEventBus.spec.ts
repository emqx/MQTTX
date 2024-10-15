import { expect } from 'chai'
import { globalEventBus } from '@/utils/globalEventBus'

describe('globalEventBus', () => {
  it('should emit and listen to events', () => {
    const testData = { message: 'Hello, World!' }
    let receivedData: any = null

    globalEventBus.on('testEvent', (data) => {
      receivedData = data
    })

    globalEventBus.emit('testEvent', testData)

    expect(receivedData).to.deep.equal(testData)
  })

  it('should remove event listener', () => {
    let counter = 0
    const incrementCounter = () => {
      counter++
    }

    globalEventBus.on('incrementEvent', incrementCounter)

    globalEventBus.emit('incrementEvent')
    expect(counter).to.equal(1)

    globalEventBus.removeListener('incrementEvent', incrementCounter)

    globalEventBus.emit('incrementEvent')
    expect(counter).to.equal(1)
  })

  it('should handle multiple listeners for the same event', () => {
    let count1 = 0
    let count2 = 0
    const listener1 = () => {
      count1++
    }
    const listener2 = () => {
      count2++
    }

    globalEventBus.on('multipleListeners', listener1)
    globalEventBus.on('multipleListeners', listener2)

    globalEventBus.emit('multipleListeners')

    expect(count1).to.equal(1)
    expect(count2).to.equal(1)
  })

  it('should not throw error when emitting event with no listeners', () => {
    expect(() => {
      globalEventBus.emit('nonExistentEvent')
    }).to.not.throw()
  })

  it('should handle removal of non-existent listener', () => {
    const listener = () => {}
    expect(() => {
      globalEventBus.removeListener('someEvent', listener)
    }).to.not.throw()
  })

  it('should handle multiple removals of the same listener', () => {
    const listener = () => {}
    globalEventBus.on('multiRemoval', listener)

    globalEventBus.removeListener('multiRemoval', listener)
    globalEventBus.removeListener('multiRemoval', listener) // Second removal

    // This should not throw an error
    expect(() => {
      globalEventBus.emit('multiRemoval')
    }).to.not.throw()
  })

  it('should correctly handle listeners that throw errors', () => {
    const errorListener = () => {
      throw new Error('Test error')
    }
    globalEventBus.on('errorEvent', errorListener)

    expect(() => {
      globalEventBus.emit('errorEvent')
    }).to.throw('Test error')

    // Clean up
    globalEventBus.removeListener('errorEvent', errorListener)
  })

  it('should maintain separate listener lists for different events', () => {
    let count1 = 0
    let count2 = 0
    globalEventBus.on('event1', () => {
      count1++
    })
    globalEventBus.on('event2', () => {
      count2++
    })

    globalEventBus.emit('event1')
    expect(count1).to.equal(1)
    expect(count2).to.equal(0)

    globalEventBus.emit('event2')
    expect(count1).to.equal(1)
    expect(count2).to.equal(1)
  })
})
