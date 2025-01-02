<script setup lang="ts">
import type { FormInstance, InputInstance } from 'element-plus'
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    extension?: string
    list?: string[]
  }>(),
  {
    extension: 'js',
  },
)

const emit = defineEmits<{
  (e: 'save', value: string): void
}>()

const dialogVisible = defineModel<boolean>({ default: true })

const { extension, list } = toRefs(props)

const formRef = ref<FormInstance | null>(null)
const inputRef = ref<InputInstance | null>(null)
const record = reactive({
  name: '',
})

const { t } = useI18n()

function handleFormSubmit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return

    let name = record.name
    if (!name.endsWith(`.${extension.value}`)) {
      name = `${name}.${extension.value}`
    }
    if (list.value?.includes(name)) {
      ElMessage.error(t('script.scriptNameExists'))
      return
    }
    emit('save', name)
  })
}

function opened() {
  inputRef.value?.focus()
}

function closed() {
  formRef.value?.resetFields()
}
</script>

<template>
  <MyDialog
    v-model="dialogVisible"
    :title="$t('script.saveScript')"
    width="400px"
    @opened="opened"
    @closed="closed"
    @confirm="handleFormSubmit"
    @enter="handleFormSubmit"
  >
    <ElForm ref="formRef" label-position="left" label-width="120px" :model="record">
      <ElFormItem
        :label="$t('script.scriptName')"
        prop="name"
        required
      >
        <ElInput ref="inputRef" v-model.trim="record.name" />
      </ElFormItem>
    </ElForm>
  </MyDialog>
</template>
