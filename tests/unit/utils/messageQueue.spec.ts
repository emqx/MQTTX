// import { expect } from 'chai'
// import { MessageQueue } from '@/utils/messageQueue'
// import { take, toArray } from 'rxjs/operators'

// describe('MessageQueue', () => {
//   let messageQueue: MessageQueue<any>

//   beforeEach(() => {
//     messageQueue = new MessageQueue(100)
//   })

//   it('should buffer and emit individual messages', (done) => {
//     const messages = ['message1', 'message2', 'message3']

//     messageQueue
//       .getMessageObservable()
//       .pipe(take(3), toArray())
//       .subscribe({
//         next: (results) => {
//           expect(results).to.deep.equal(messages)
//         },
//         complete: () => {
//           done()
//         },
//         error: (err) => {
//           done(err)
//         },
//       })

//     messages.forEach((msg) => messageQueue.queueMessage(msg))
//   })

//   it('should apply the handler function if provided', (done) => {
//     const handler = (msg: string) => msg.toUpperCase()
//     const customMessageQueue = new MessageQueue(100, handler)
//     const messages = ['hello', 'world']

//     customMessageQueue
//       .getMessageObservable()
//       .pipe(take(2), toArray())
//       .subscribe({
//         next: (results) => {
//           expect(results).to.deep.equal(['HELLO', 'WORLD'])
//         },
//         complete: () => {
//           done()
//         },
//         error: (err) => {
//           done(err)
//         },
//       })

//     messages.forEach((msg) => customMessageQueue.queueMessage(msg))
//   })

//   it('should not emit when no messages are queued', (done) => {
//     let emitted = false
//     messageQueue.getMessageObservable().subscribe({
//       next: () => {
//         emitted = true
//       },
//     })

//     setTimeout(() => {
//       expect(emitted).to.be.false
//       done()
//     }, 200)
//   })

//   it('should use the specified buffer time', (done) => {
//     const bufferTime = 300
//     const customMessageQueue = new MessageQueue(bufferTime)
//     const message = 'test message'

//     const start = Date.now()
//     customMessageQueue
//       .getMessageObservable()
//       .pipe(take(1))
//       .subscribe({
//         next: () => {
//           const elapsed = Date.now() - start
//           expect(elapsed).to.be.at.least(bufferTime)
//           done()
//         },
//         error: (err) => {
//           done(err)
//         },
//       })

//     customMessageQueue.queueMessage(message)
//   })

//   it('should handle complex objects', (done) => {
//     interface ComplexMessage {
//       id: number
//       data: string
//     }

//     const complexMessageQueue = new MessageQueue<ComplexMessage>()
//     const messages: ComplexMessage[] = [
//       { id: 1, data: 'first' },
//       { id: 2, data: 'second' },
//       { id: 3, data: 'third' },
//     ]

//     complexMessageQueue
//       .getMessageObservable()
//       .pipe(take(3), toArray())
//       .subscribe({
//         next: (results) => {
//           expect(results).to.deep.equal(messages)
//         },
//         complete: () => {
//           done()
//         },
//         error: (err) => {
//           done(err)
//         },
//       })

//     messages.forEach((msg) => complexMessageQueue.queueMessage(msg))
//   })
// })
