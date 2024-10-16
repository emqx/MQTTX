import { Subject, Observable } from 'rxjs'
import { bufferTime, filter, mergeMap, share } from 'rxjs/operators'
import { IPublishPacket } from 'mqtt-packet/types'

/**
 * MessageQueue class for handling MQTT message buffering and processing.
 *
 * This class provides functionality to queue MQTT messages, buffer them for a specified time,
 * and process them in batches. It uses RxJS observables for efficient message handling.
 */
export class MessageQueue {
  private messageSubject = new Subject<QueuedMessage>()
  private messageObservable: Observable<{ messages: QueuedMessage[]; connectionId: string }>

  /**
   * Creates a new MessageQueue instance.
   * @param bufferTime The time in milliseconds to buffer messages before processing. Default is 500ms.
   */
  constructor(private bufferTime: number = 500) {
    this.messageObservable = this.initMessageProcessing()
  }

  /**
   * Queues a new MQTT message.
   * @param packet The MQTT publish packet to queue.
   * @param connectionId The ID of the connection associated with this message.
   */
  queueMessage(packet: IPublishPacket, connectionId: string) {
    this.messageSubject.next({
      connectionId,
      packet,
      timestamp: Date.now(),
    })
  }

  /**
   * Returns the observable for processed message batches.
   * @returns An Observable that emits batches of messages grouped by connectionId.
   */
  getMessageObservable(): Observable<{ messages: QueuedMessage[]; connectionId: string }> {
    return this.messageObservable
  }

  /**
   * Initializes the message processing pipeline.
   * @returns An Observable that emits batches of messages grouped by connectionId.
   */
  private initMessageProcessing(): Observable<{ messages: QueuedMessage[]; connectionId: string }> {
    return this.messageSubject.pipe(
      bufferTime(this.bufferTime),
      filter((messages) => messages.length > 0),
      mergeMap((messages) => {
        const groupedMessages = messages.reduce((acc, message) => {
          if (!acc[message.connectionId]) {
            acc[message.connectionId] = []
          }
          acc[message.connectionId].push(message)
          return acc
        }, {} as Record<string, QueuedMessage[]>)

        return Object.entries(groupedMessages).map(([connectionId, messages]) => ({
          messages,
          connectionId,
        }))
      }),
      share(),
    )
  }
}

export const messageQueue = new MessageQueue()
