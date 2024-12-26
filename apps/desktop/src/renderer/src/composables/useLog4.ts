import useSettingsService from '@database/services/SettingsService'
import log4js, { type AppenderModule, type LayoutFunction } from 'log4js'
import { Subject } from 'rxjs'
import { bufferTime } from 'rxjs/operators'

const logMemory = ref('')

const MAX_LOG_LINES = 10000

const savedLogs = sessionStorage.getItem('sessionLogs')
if (savedLogs) {
  logMemory.value = savedLogs
}

const logSubject = new Subject<string>()
logSubject.pipe(bufferTime(500)).subscribe((messages) => {
  if (messages.length > 0) {
    const newText = `${messages.join('\n')}\n`
    logMemory.value += newText
    const lines = logMemory.value.split('\n')
    if (lines.length > MAX_LOG_LINES) {
      lines.splice(0, lines.length - MAX_LOG_LINES)
      logMemory.value = lines.join('\n')
      sessionStorage.setItem('sessionLogs', logMemory.value)
    }
  }
})

function createMemoryAppender(): AppenderModule {
  return {
    configure(config, layouts) {
      const layout = layouts!.patternLayout(config.layout.pattern) as unknown as LayoutFunction
      return (loggingEvent) => {
        const message = layout(loggingEvent)
        logSubject.next(message)
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
    default: { appenders: ['console', 'memory'], level: 'info' },
  },
})

const logger = log4js.getLogger()

export function useLog4() {
  const { settings } = useSettingsService()

  watch(() => settings.logLevel, (newLogLevel) => {
    if (logger.level !== newLogLevel) {
      logger.level = newLogLevel
    }
  }, { immediate: true })

  return { logger, logMemory }
}
