import { MessageModel } from '@/views/connections/types'

export const matchTopicMethod = (filter: string, topic: string): boolean => {
  // Topic matching algorithm
  const filterArray: string[] = filter.split('/')
  const length: number = filterArray.length
  const topicArray: string[] = topic.split('/')
  for (let i = 0; i < length; i += 1) {
    const left: string = filterArray[i]
    const right: string = topicArray[i]
    if (left === '#') {
      return topicArray.length >= length - 1
    }
    if (left !== right && left !== '+') {
      return false
    }
  }
  return length === topicArray.length
}

const topicMatch = (data: MessageModel[], currentTopic: string): Promise<MessageModel[]> => {
  return new Promise((resolve, reject) => {
    try {
      const filterData = data.filter((item) => matchTopicMethod(currentTopic, item.topic))
      return resolve(filterData)
    } catch (error) {
      return reject(error)
    }
  })
}

export default topicMatch
