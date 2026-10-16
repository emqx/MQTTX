/**
 * Topic matching algorithm
 * @return Return matched result, true or false
 * @param filter - type: topic string, subscription list topics
 * @param topic - type: topic string, real send-receive topics
 */
export const matchTopicMethod = (filter: string, topic: string): boolean => {
  let _filter = filter
  if (filter.startsWith('$share/')) {
    // shared subscription format: $share/{ShareName}/{filter}
    _filter = filter.split('/').slice(2).join('/')
  }
  const filterArray: string[] = _filter.split('/')
  const length: number = filterArray.length
  if (topic.startsWith('$') && (filterArray[0] === '+' || filterArray[0] === '#')) return false
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
