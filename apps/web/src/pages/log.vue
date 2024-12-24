<script setup lang="ts">
const { logger, logMemory } = useLog4()

logger.trace('trace')
logger.debug('debug')
logger.info('info')
logger.warn('warn')
logger.error('error')
logger.fatal('fatal')
logger.mark('mark')
</script>

<template>
  <pre v-html="logMemory" />
</template>
