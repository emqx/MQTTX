<script setup lang="ts">
import type { ScriptSchema } from 'mqttx'
import { useScriptSchemaStore } from '../../../stores'

const modelCodec = defineModel<ScriptSchema['codec']>('codec', { default: 'protobuf' })
const modelSchemaContent = defineModel<ScriptSchema['content']>('content', { default: '' })

const { scriptSchemas } = storeToRefs(useScriptSchemaStore())
const scriptSchemaUpsert = inject<
  (data: Omit<ScriptSchema, 'id'> & { id?: string }) => Promise<ScriptSchema>
>('scriptSchemaUpsert')!
const scriptSchemaRemove = inject<
  (id: ScriptSchema['id']) => Promise<ScriptSchema | null>
>('scriptSchemaRemove')!

const codecOptions: { label: string, value: ScriptSchema['codec'], extension: string }[] = [
  { label: 'Protobuf', value: 'protobuf', extension: 'proto' },
  { label: 'Avro', value: 'avro', extension: 'avsc' },
]

const currentCodec = ref<ScriptSchema['codec']>(codecOptions[0].value)
const currentExtension = computed(() => codecOptions.find(item => item.value === currentCodec.value)!.extension)
const currentSchemas = computed(() => scriptSchemas.value.filter(item => item.codec === currentCodec.value))
const currentSchema = ref<ScriptSchema | undefined>(currentSchemas.value[currentSchemas.value.length - 1])

const { t } = useI18n()

const inUseScript = computed(() => {
  // TODO: implement inUseScript
  return false
})

const defaultSchema: Record<ScriptSchema['codec'], { editorLangugage: string, content: string }> = {
  protobuf: {
    editorLangugage: 'plaintext',
    content: `syntax = "proto3";

message Person {
  int32 id = 1;
  string name = 2;
}`,
  },
  avro: {
    editorLangugage: 'json',
    content: `{
  "type": "record",
  "name": "Person",
  "fields": [
    {"name": "id", "type": "int"},
    {"name": "name", "type": "string"}
  ]
}`,
  },
}
const schemaContent = ref('')
watch(currentCodec, () => {
  currentSchema.value = currentSchemas.value[currentSchemas.value.length - 1]
})
watch([currentCodec, currentSchema], () => {
  schemaContent.value = currentSchema.value ? currentSchema.value.content : defaultSchema[currentCodec.value].content
}, { immediate: true })
watch([currentCodec, schemaContent], () => {
  modelCodec.value = currentCodec.value
  modelSchemaContent.value = schemaContent.value
}, { immediate: true })

function handleClickNew() {
  currentSchema.value = undefined
  schemaContent.value = defaultSchema[currentCodec.value].content
}

const saveScriptDialogVisible = ref(false)

function validateSchema({ name, content }: { name?: string, content: string }) {
  if (content === '') {
    ElMessage({
      message: t('script.scriptContentEmpty'),
      type: 'error',
      plain: true,
    })
    return false
  }
  if (name) {
    const existSchema = currentSchemas.value.find(item => item.name === name)

    if (!existSchema) return true

    ElMessageBox.confirm(
      t('script.scriptNameExistConfirm', { name }),
      t('common.warning'),
      {
        type: 'warning',
      },
    )
      .then(async () => {
        currentSchema.value = existSchema
        await nextTick()
        // Must set schemaContent after currentSchema is updated to avoid conflict with the assignment in watch
        schemaContent.value = content
        updateSchema()
      })
    return false
  }

  return true
}

async function handleClickSave() {
  if (currentSchema.value) {
    updateSchema()
  } else {
    saveScriptDialogVisible.value = true
  }
}

async function updateSchema() {
  try {
    if (!validateSchema({ content: schemaContent.value })) return

    const data = await scriptSchemaUpsert({
      ...currentSchema.value!,
      content: schemaContent.value,
    })
    currentSchema.value = data
    saveScriptDialogVisible.value = false
    ElMessage({
      message: t('common.editSuccess'),
      type: 'success',
      plain: true,
    })
  } catch (error) {
    if (error instanceof Error) {
      ElMessage({
        message: error.toString(),
        type: 'error',
        plain: true,
      })
    }
  }
}

async function saveSchema(name: string) {
  try {
    if (!validateSchema({ name, content: schemaContent.value })) return

    const data = await scriptSchemaUpsert({
      name,
      content: schemaContent.value,
      codec: currentCodec.value,
    })
    currentSchema.value = data
    saveScriptDialogVisible.value = false
    ElMessage({
      message: t('common.saveSuccess'),
      type: 'success',
      plain: true,
    })
  } catch (error) {
    if (error instanceof Error) {
      ElMessage({
        message: error.toString(),
        type: 'error',
        plain: true,
      })
    }
  }
}

async function removeSchema() {
  if (!currentSchema.value) return

  ElMessageBox.confirm(
    t('common.confirmDelete', { name: currentSchema.value.name }),
    t('common.warning'),
    {
      type: 'warning',
    },
  )
    .then(async () => {
      scriptSchemaRemove(currentSchema.value!.id)
        .then(() => {
          currentSchema.value = currentSchemas.value[currentSchemas.value.length - 1]
          ElMessage({
            message: t('common.deleteSuccess'),
            type: 'success',
            plain: true,
          })
        })
        .catch((error) => {
          if (error instanceof Error) {
            ElMessage({
              message: error.toString(),
              type: 'error',
              plain: true,
            })
          }
        })
    })
}

async function uploadSchema(file: { name: string, content: string }) {
  currentSchema.value = undefined
  await nextTick()
  // Must set schemaContent after currentSchema is updated to avoid conflict with the assignment in watch
  schemaContent.value = file.content
}
</script>

<template>
  <div>
    <section class="mb-3 flex justify-between items-center gap-6">
      <div class="flex items-center gap-3">
        <ElSelect v-model="currentCodec" class="!w-32">
          <ElOption
            v-for="{ label, value } in codecOptions"
            :key="value"
            :value="value"
            :label="label"
          />
        </ElSelect>
        <ElSelect v-model="currentSchema" value-key="id" class="!w-64">
          <ElOption
            v-for="item in currentSchemas"
            :key="item.id"
            :value="item"
            :label="item.name"
          />
        </ElSelect>
        <div
          v-if="currentSchema"
          role="button"
          tabindex="0"
          @click="handleClickNew"
        >
          <IconCustomNew class="w-5 h-5 text-main-green" />
        </div>
      </div>
      <div class="flex items-center">
        <MyUpload
          class="mr-3"
          :accept="`.${currentExtension}`"
          @upload="uploadSchema"
        >
          <ElButton plain>
            {{ $t('script.uploadScript', { extension: `.${currentExtension}` }) }}
          </ElButton>
        </MyUpload>
        <ElButton type="primary" @click="handleClickSave">
          {{ $t('common.save') }}
        </ElButton>
        <ElTooltip
          placement="top"
          :disabled="!inUseScript"
          :content="$t('script.inUseScript')"
        >
          <ElButton
            v-if="currentSchema"
            :disabled="inUseScript"
            type="danger"
            @click="removeSchema"
          >
            {{ $t('common.delete') }}
          </ElButton>
        </ElTooltip>
      </div>
    </section>
    <section class="h-80 bg-normal border px-0.5 pb-0.5 pt-3 border-border-default rounded">
      <MonacoEditor
        :value="schemaContent"
        :language="defaultSchema[currentCodec].editorLangugage"
        :options="{ lineNumbers: 'on' }"
        @update="schemaContent = $event"
      />
    </section>
  </div>

  <ScriptSaveDialog
    v-model="saveScriptDialogVisible"
    :extension="currentExtension"
    @save="saveSchema"
  />
</template>
