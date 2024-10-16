import { Subject, timer, Observable } from 'rxjs'
import { buffer, filter, mergeMap, share } from 'rxjs/operators'
import { IPublishPacket } from 'mqtt-packet/types'
import { getNowDate } from '@/utils/time'
import { getMessageId } from '@/utils/idGenerator'

export class MessageQueue {
  private messageSubject = new Subject<{ packet: IPublishPacket; id: string }>()
  private messageObservable: Observable<{ messages: MessageModel[]; connectionId: string }>
  private processedMessages = new Set<string>()

  constructor(private bufferTime: number = 1000, private maxBufferSize: number = 100) {
    this.messageObservable = this.initMessageProcessing()
  }

  queueMessage(packet: IPublishPacket, id: string) {
    this.messageSubject.next({ packet, id })
  }

  public getMessageObservable(): Observable<{ messages: MessageModel[]; connectionId: string }> {
    return this.messageObservable
  }

  private initMessageProcessing(): Observable<{ messages: MessageModel[]; connectionId: string }> {
    return this.messageSubject.pipe(
      buffer(timer(0, this.bufferTime)),
      filter((messages) => messages.length > 0),
      mergeMap((messages) => {
        const groupedMessages = new Map<string, MessageModel[]>()

        messages.slice(0, this.maxBufferSize).forEach(({ packet, id }) => {
          const messageKey = `${id}-${packet.topic}-${packet.payload}`
          if (!this.processedMessages.has(messageKey)) {
            if (!groupedMessages.has(id)) {
              groupedMessages.set(id, [])
            }
            groupedMessages.get(id)!.push({
              id: getMessageId(),
              topic: packet.topic,
              payload: packet.payload.toString(),
              qos: packet.qos,
              retain: packet.retain,
              out: false,
              createAt: getNowDate(),
              properties: packet.properties,
            })
            this.processedMessages.add(messageKey)
          }
        })

        if (this.processedMessages.size > 10000) {
          const oldestEntries = Array.from(this.processedMessages).slice(0, 5000)
          oldestEntries.forEach((entry) => this.processedMessages.delete(entry))
        }

        return Array.from(groupedMessages.entries()).map(([connectionId, messages]) => ({
          messages,
          connectionId,
        }))
      }),
      share(),
    )
  }
}

export const messageQueue = new MessageQueue()
