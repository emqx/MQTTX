import { MessageModel } from '@/views/connections/types'

const topicMatch = (
  data: MessageModel[], currentTopic: string,
): Promise<MessageModel[]> => {
  return new Promise((resolve, reject) => {
    try {
      // Topic matching algorithm
      const match = (filter: string, topic: string) => {
        const filterArray = filter.split('/')
        const length = filterArray.length
        const topicArray = topic.split('/')
        for (let i = 0; i < length; i += 1 ) {
          const left = filterArray[i]
          const right = topicArray[i]
          if (left === '#') {
            return topicArray.length >= length - 1
          }
          if (left !== right && left !== '+') {
            return false
          }
        }
        return length === topicArray.length
      }
      const filterData = data.filter(
        (item) => match(currentTopic, item.topic),
      )
      return resolve(filterData)
    } catch (error) {
      return reject(error)
    }
  })
}

export default topicMatch
