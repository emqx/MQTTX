<script setup lang="ts">
import type { Lang } from 'mqttx'

const dialogVisible = defineModel<boolean>({ default: false })

function loadMarkdown(lang: Lang): string {
  const docs = import.meta.glob<string>('../../assets/docs/policy/data-collection-*.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  })
  return docs[`../../assets/docs/policy/data-collection-${lang}.md`]
}

const { locale } = useI18n()
const dataCollectionPolicy = computed(() => markdown2Html(loadMarkdown(locale.value as Lang)))
</script>

<template>
  <MyDialog
    v-model="dialogVisible"
    :cancel-visible="false"
    @confirm="dialogVisible = false"
  >
    <div class="prose prose-sm" v-html="dataCollectionPolicy" />
  </MyDialog>
</template>
