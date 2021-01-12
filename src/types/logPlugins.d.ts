import Vue from 'vue'

declare module 'vue/types/vue' {
  export interface VueConstructor<V extends Vue = Vue> {
    $log: {
      trace(message: string): void
      debug(message: string): void
      info(message: string): void
      warn(message: string): void
      error(message: string): void
      fatal(message: string): void
    }
  }
}
