import type { MessageType } from 'mqttx'
// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from 'buffer'
import uvm from 'uvm'
import { jsonStringify } from './jsonUtils'

export function executeScript(opts: {
  script: string
  payload: string
  messageType: MessageType
  index?: number
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    uvm.spawn(
      {
        bootCode: `
          bridge.on('runScript', function ({ script, payload, messageType, index }) {
            try {
              function execute(callback) {
                return callback(payload, messageType, index);
              };
              bridge.dispatch(
                'scriptResult', 
                Function('execute', 'payload', 'messageType', 'index', script)(execute, payload, messageType, index)
              );
            } catch (error) {
              bridge.dispatch('scriptError', error.message);
            }
          });
        `,
        bootTimeout: 1000,
        dispatchTimeout: 1000,
      },
      (err: any, context: any) => {
        if (err) reject(err)

        context.on('scriptResult', (result: any) => {
          let resultStr: string
          if (typeof result === 'object') {
            resultStr = jsonStringify(result, null, 2)
          } else {
            resultStr = String(result)
          }
          resolve(Buffer.from(resultStr))
        })

        context.on('scriptError', (error?: string) => {
          reject(new Error(error))
        })

        context.dispatch('runScript', opts)
      },
    )
  })
}
