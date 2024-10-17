import { expect } from 'chai'
import { MessageQueue } from '@/utils/mqttMessageQueue'
import { IPublishPacket } from 'mqtt-packet'
import { take, toArray } from 'rxjs/operators'

describe('MessageQueue', () => {
  let messageQueue: MessageQueue

  beforeEach(() => {
    messageQueue = new MessageQueue(100)
  })

  it('should buffer and group messages by connectionId', (done) => {
    const mockPacket1: IPublishPacket = {
      cmd: 'publish',
      topic: 'test/topic1',
      payload: Buffer.from('message1'),
      qos: 0,
      dup: false,
      retain: false,
    }
    const mockPacket2: IPublishPacket = {
      cmd: 'publish',
      topic: 'test/topic2',
      payload: Buffer.from('message2'),
      qos: 0,
      dup: false,
      retain: false,
    }
    const mockPacket3: IPublishPacket = {
      cmd: 'publish',
      topic: 'test/topic3',
      payload: Buffer.from('message3'),
      qos: 0,
      dup: false,
      retain: false,
    }
    messageQueue
      .getMessageObservable()
      .pipe(take(2), toArray())
      .subscribe({
        next: (results) => {
          expect(results).to.have.length(2)

          expect(results[0].connectionId).to.equal('connection1')
          expect(results[0].messages).to.have.length(2)
          expect(results[0].messages[0].packet).to.deep.equal(mockPacket1)
          expect(results[0].messages[1].packet).to.deep.equal(mockPacket2)

          expect(results[1].connectionId).to.equal('connection2')
          expect(results[1].messages).to.have.length(1)
          expect(results[1].messages[0].packet).to.deep.equal(mockPacket3)
        },
        complete: () => {
          done()
        },
        error: (err) => {
          done(err)
        },
      })

    messageQueue.queueMessage(mockPacket1, 'connection1')
    messageQueue.queueMessage(mockPacket2, 'connection1')
    messageQueue.queueMessage(mockPacket3, 'connection2')
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
    const mockPacket: IPublishPacket = {
      cmd: 'publish',
      topic: 'test/topic',
      payload: Buffer.from('message'),
      qos: 0,
      dup: false,
      retain: false,
    }

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

    customMessageQueue.queueMessage(mockPacket, 'connection1')
  })
})
