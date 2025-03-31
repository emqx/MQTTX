/**
 * @description: Read and modify binary data
 * @param {object} params - The parameters object
 * @param {string} params.payload - Message payload string
 * @param {object} params.payloadRaw - Binary data in JSON serialized format {type: 'Buffer', data: number[]}
 * @param {string} params.messageType - Message type, value is 'received' or 'publish'
 * @return {object} - Return modified binary data
 */
function handlePayload(params) {
  const { payload, payloadRaw } = params
  
  try {
    // Check if we have binary data
    if (payloadRaw && payloadRaw.type === 'Buffer' && Array.isArray(payloadRaw.data)) {
      // Convert to Uint8Array for easier manipulation
      const uint8Array = new Uint8Array(payloadRaw.data)
      
      // Example: Read first 4 bytes as a message header
      const header = uint8Array.slice(0, 4)
      
      // Example: Modify the data - add 1 to each byte
      const modifiedData = uint8Array.map(byte => (byte + 1) % 256)
      
      // Create output object with metadata and modified binary data
      return {
        original_size: uint8Array.length,
        header: Array.from(header),
        modified: true,
        type: 'Buffer',
        data: Array.from(modifiedData)
      }
    }
    
    // If not binary data, try to parse as JSON
    const parsedPayload = JSON.parse(payload)
    return {
      message: 'No binary data detected',
      original: parsedPayload
    }
  } catch (error) {
    // If payload is not valid JSON, return basic info
    return {
      message: 'Unable to process data',
      error: error.message
    }
  }
}

return execute(handlePayload)
