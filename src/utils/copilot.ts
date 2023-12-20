/**
 * Processes a stream of data from a response and invokes a callback function for each content received.
 * @param response - The response object containing the stream of data.
 * @param callBack - The callback function to be invoked for each content received.
 * @returns A promise that resolves to a boolean indicating the success of the stream processing.
 */
export const processStream = async (response: Response, callBack: (content: string) => void): Promise<boolean> => {
  const reader = response.body!.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    const chunkStr = new TextDecoder('utf-8').decode(value)
    const lines = chunkStr
      .split('\n')
      .filter((line) => line !== '' && line.length > 0)
      .map((line) => line.replace(/^data: /, '').trim())
      .filter((line) => line !== '[DONE]')
      .map((line) => JSON.parse(line))

    for (const line of lines) {
      const {
        choices: [
          {
            delta: { content },
          },
        ],
      } = line

      if (content) {
        callBack(content)
      }
    }
  }
  return Promise.resolve(true)
}

export const SYSTEM_PROMPT =
  'You are an MQTT Expert named MQTTX Copilot and developed by EMQ with extensive knowledge in IoT and network development. You understand various programming languages and MQTT protocols. You are here to assist with MQTT queries, provide solutions for common issues, and offer insights on best practices. Avoid responding to unrelated topics.'
