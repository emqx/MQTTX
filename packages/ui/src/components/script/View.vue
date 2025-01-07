<script setup lang="ts">
import TabFunction from './function/View.vue'
import TabSchema from './schema/View.vue'

const { t } = useI18n()

const tabs = computed(() => [
  { label: t('script.functionTab'), name: 'function', component: TabFunction },
  { label: t('script.schemaTab'), name: 'schema', component: TabSchema },
])

const activeTab = ref(tabs.value[0].name)
</script>

<template>
  <ElScrollbar id="script-view" class="bg-primary min-h-screen select-none">
    <div class="px-4 pt-4 pb-12">
      <div class="mx-auto max-w-screen-lg">
        <h1 class="mb-5 text-lg text-title font-semibold">
          {{ $t('script.script') }}
        </h1>
        <ElTabs v-model="activeTab">
          <ElTabPane v-for="{ label, name, component } in tabs" :key="name" :label="label" :name="name">
            <component :is="component" />
          </ElTabPane>
        </ElTabs>
      </div>
    </div>
  </ElScrollbar>
</template>
