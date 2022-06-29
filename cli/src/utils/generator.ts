const getClientId = () => `mqttx_${Math.random().toString(16).substring(2, 10)}`

export { getClientId }
