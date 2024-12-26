import log4js, { type AppenderModule, type LayoutFunction } from 'log4js'

const logMemory = ref('')

function createMemoryAppender(): AppenderModule {
  return {
    configure(config, layouts) {
      const layout = layouts!.patternLayout(config.layout.pattern) as unknown as LayoutFunction
      return (loggingEvent) => {
        const message = layout(loggingEvent)
        logMemory.value += `${message}\n`
      }
    },
  }
}

log4js.configure({
  appenders: {
    console: {
      type: 'console',
      layout: {
        type: 'pattern',
        pattern: '%[%d{yyyy-MM-dd hh:mm:ss.SSS} [%p]%] - %m',
      },
    },
    memory: {
      type: createMemoryAppender(),
      layout: {
        type: 'pattern',
        pattern: '[%d{yyyy-MM-dd hh:mm:ss}] [%p] %m',
      },
    },
  },
  categories: {
    default: { appenders: ['console', 'memory'], level: 'all' },
  },
})

const logger = log4js.getLogger()

export function useLog4() {
  return { logger, logMemory }
}
