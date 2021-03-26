export default (): string => {
  return `collection_${Math.random().toString(16).substr(1, 7)}` as string
}
