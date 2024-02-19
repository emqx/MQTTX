import { getLogger } from 'log4js'
declare module 'vue/types/vue' {
  interface Vue {
    $log: {
      trace(message: string): void
      debug(message: string): void
      info(message: string): void
      warn(message: string): void
      error(message: string): void
      fatal(message: string): void
    }
    $logRegsity: typeof getLogger
  }
}
