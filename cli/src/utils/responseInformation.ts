import { IClientOptions, IConnackPacket } from 'mqtt'

export const logResponseInformation = (connOpts: IClientOptions, packet: IConnackPacket): void => {
  const responseInformation = packet.properties?.responseInformation
  if (connOpts.protocolVersion !== 5 || !connOpts.properties?.requestResponseInformation || !responseInformation) {
    return
  }

  // JSON escapes C0 controls; also escape C1 controls and Unicode line separators.
  const escaped = JSON.stringify(responseInformation).replace(
    /[\u007f-\u009f\u2028\u2029]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  )
  process.stderr.write(`Response Information: ${escaped}\n`)
}
