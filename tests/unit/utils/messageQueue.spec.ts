import { expect } from 'chai'
import { MessageQueue } from '@/utils/messageQueue'
import { take, toArray } from 'rxjs/operators'

describe('MessageQueue', () => {
  let messageQueue: MessageQueue<any>

  beforeEach(() => {
    messageQueue = new MessageQueue(100)
  })

  it('should buffer and emit batches of messages', (done) => {
    const messages = ['message1', 'message2', 'message3']

    messageQueue
      .getMessageObservable()
      .pipe(take(1))
      .subscribe({
        next: (results) => {
          expect(results).to.deep.equal(messages)
        },
        complete: () => {
          done()
        },
        error: (err) => {
          done(err)
        },
      })

    messages.forEach((msg) => messageQueue.queueMessage(msg))
  })

  it('should not emit when no messages are queued', (done) => {
    let emitted = false
    messageQueue.getMessageObservable().subscribe({
      next: () => {
        emitted = true
      },
    })

    setTimeout(() => {
      expect(emitted).to.be.false
      done()
    }, 200)
  })

  it('should use the specified buffer time', (done) => {
    const bufferTime = 300
    const customMessageQueue = new MessageQueue(bufferTime)
    const message = 'test message'

    const start = Date.now()
    customMessageQueue
      .getMessageObservable()
      .pipe(take(1))
      .subscribe({
        next: () => {
          const elapsed = Date.now() - start
          expect(elapsed).to.be.at.least(bufferTime)
          done()
        },
        error: (err) => {
          done(err)
        },
      })

    customMessageQueue.queueMessage(message)
  })

  it('should handle complex objects', (done) => {
    interface ComplexMessage {
      id: number
      data: string
    }

    const complexMessageQueue = new MessageQueue<ComplexMessage>()
    const messages: ComplexMessage[] = [
      { id: 1, data: 'first' },
      { id: 2, data: 'second' },
      { id: 3, data: 'third' },
    ]

    complexMessageQueue
      .getMessageObservable()
      .pipe(take(1))
      .subscribe({
        next: (results) => {
          expect(results).to.deep.equal(messages)
        },
        complete: () => {
          done()
        },
        error: (err) => {
          done(err)
        },
      })

    messages.forEach((msg) => complexMessageQueue.queueMessage(msg))
  })

  it('should emit multiple batches', (done) => {
    const batch1 = ['message1', 'message2']
    const batch2 = ['message3', 'message4']

    let batchCount = 0
    messageQueue
      .getMessageObservable()
      .pipe(take(2), toArray())
      .subscribe({
        next: (results) => {
          expect(results).to.deep.equal([batch1, batch2])
          batchCount = results.length
        },
        complete: () => {
          expect(batchCount).to.equal(2)
          done()
        },
        error: (err) => {
          done(err)
        },
      })

    batch1.forEach((msg) => messageQueue.queueMessage(msg))
    setTimeout(() => {
      batch2.forEach((msg) => messageQueue.queueMessage(msg))
    }, 150) // Ensure this is greater than the buffer time
  })
})
