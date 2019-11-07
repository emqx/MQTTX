export default (): string => {
  return `mqttx_${Math.random().toString(16).substr(2, 8)}` as string
}
