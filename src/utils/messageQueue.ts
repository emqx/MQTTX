import { Subject, Observable } from 'rxjs'
import { bufferTime, filter, mergeMap, map, share } from 'rxjs/operators'

/**
 * A generic MessageQueue class for buffering and processing messages.
 *
 * @typeparam T The type of message to be queued.
 */
export class MessageQueue<T extends any> {
  private messageSubject = new Subject<T>()
  private messageObservable: Observable<T[]>

  /**
   * Creates a new MessageQueue instance.
   * @param bufferTime The time in milliseconds to buffer messages before processing. Default is 500ms.
   */
  constructor(private bufferTime: number = 500) {
    this.messageObservable = this.initMessageProcessing()
  }

  /**
   * Queues a new message.
   * @param message The message to queue.
   */
  queueMessage(message: T) {
    this.messageSubject.next(message)
  }

  /**
   * Returns the observable for processed message batches.
   * @returns An Observable that emits batches of messages.
   */
  getMessageObservable(): Observable<T[]> {
    return this.messageObservable
  }

  /**
   * Initializes the message processing pipeline.
   * @returns An Observable that emits batches of messages.
   */
  private initMessageProcessing(): Observable<T[]> {
    return this.messageSubject.pipe(
      bufferTime(this.bufferTime),
      filter((messages) => messages.length > 0),
      share(),
    )
  }
}
