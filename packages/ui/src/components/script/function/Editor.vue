<script setup lang="ts">
import type { ScriptFunction } from 'mqttx'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { useScriptFunctionStore } from '../../../stores'

const modelLang = defineModel<ScriptFunction['lang']>('lang', { default: 'javascript' })
const modelFunctionContent = defineModel<ScriptFunction['content']>('content', { default: '' })

const { scriptFunctions } = storeToRefs(useScriptFunctionStore())
const scriptFunctionUpsert = inject<
  (data: Omit<ScriptFunction, 'id'> & { id?: string }) => Promise<ScriptFunction>
>('scriptFunctionUpsert')!
const scriptFunctionRemove = inject<
  (id: ScriptFunction['id']) => Promise<ScriptFunction | null>
>('scriptFunctionRemove')!

const langOptions: { label: string, value: ScriptFunction['lang'], extension: string }[] = [
  { label: 'JavaScript', value: 'javascript', extension: 'js' },
]

const currentLang = ref<ScriptFunction['lang']>(langOptions[0].value)
const currentExtension = computed(() => langOptions.find(item => item.value === currentLang.value)!.extension)
const currentFunctions = computed(() => scriptFunctions.value.filter(item => item.lang === currentLang.value))
const currentFunction = ref<ScriptFunction | undefined>(currentFunctions.value[currentFunctions.value.length - 1])

const { t } = useI18n()

const inUseScript = computed(() => {
  // TODO: implement inUseScript
  return false
})

const defaultFunction: Record<string, { content: string }> = {
  javascript: {
    content: `/**
 * @description: Default custom function template
 * @param {string} message - Message payload
 * @param {string} messageType - Message type, value is 'received' or 'publish'
 * @param {number} index - Index of the message, valid only when script is used in the publish message and timed message is enabled
 * @return {string | object} - Returns a string or an object that can be JSON.stringify
 */
function handlePayload(message, messageType, index) {
  const payload = JSON.parse(message)
  return payload.msg
}

return execute(handlePayload)`,
  },
}
const functionContent = ref('')
watch(currentLang, () => {
  currentFunction.value = currentFunctions.value[currentFunctions.value.length - 1]
})
watch([currentLang, currentFunction], () => {
  functionContent.value = currentFunction.value ? currentFunction.value.content : defaultFunction[currentLang.value].content
}, { immediate: true })
watch([currentLang, functionContent], () => {
  modelLang.value = currentLang.value
  modelFunctionContent.value = functionContent.value
}, { immediate: true })

function handleClickNew() {
  currentFunction.value = undefined
  functionContent.value = defaultFunction[currentLang.value].content
}

const saveScriptDialogVisible = ref(false)

function validateFunction({ name, content }: { name?: string, content: string }) {
  if (content === '') {
    ElMessage({
      message: t('script.scriptContentEmpty'),
      type: 'error',
      plain: true,
    })
    return false
  }
  if (name) {
    const existFunction = currentFunctions.value.find(item => item.name === name)

    if (!existFunction) return true

    ElMessageBox.confirm(
      t('script.scriptNameExistConfirm', { name }),
      t('common.warning'),
      {
        type: 'warning',
      },
    )
      .then(async () => {
        currentFunction.value = existFunction
        await nextTick()
        // Must set functionContent after currentFunction is updated to avoid conflict with the assignment in watch
        functionContent.value = content
        updateFunction()
      })
    return false
  }

  return true
}

async function handleClickSave() {
  if (currentFunction.value) {
    updateFunction()
  } else {
    saveScriptDialogVisible.value = true
  }
}

async function updateFunction() {
  try {
    if (!validateFunction({ content: functionContent.value })) return

    const data = await scriptFunctionUpsert({
      ...currentFunction.value!,
      content: functionContent.value,
    })
    currentFunction.value = data
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

async function saveFunction(name: string) {
  try {
    if (!validateFunction({ name, content: functionContent.value })) return

    const data = await scriptFunctionUpsert({
      name,
      content: functionContent.value,
      lang: currentLang.value,
    })
    currentFunction.value = data
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

async function removeFunction() {
  if (!currentFunction.value) return

  ElMessageBox.confirm(
    t('common.confirmDelete', { name: currentFunction.value.name }),
    t('common.warning'),
    {
      type: 'warning',
    },
  )
    .then(async () => {
      scriptFunctionRemove(currentFunction.value!.id)
        .then(() => {
          currentFunction.value = currentFunctions.value[currentFunctions.value.length - 1]
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

async function uploadFunction(file: { name: string, content: string }) {
  currentFunction.value = undefined
  await nextTick()
  // Must set functionContent after currentFunction is updated to avoid conflict with the assignment in watch
  functionContent.value = file.content
}

const editorActions: monaco.editor.IActionDescriptor[] = [
  {
    id: 'save',
    label: t('common.save'),
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    run: () => handleClickSave(),
    contextMenuGroupId: 'navigation',
  },
]
</script>

<template>
  <div>
    <section class="mb-3 flex justify-between items-center gap-6">
      <div class="flex items-center gap-3">
        <ElSelect v-model="currentLang" class="!w-32">
          <ElOption
            v-for="{ label, value } in langOptions"
            :key="value"
            :value="value"
            :label="label"
          />
        </ElSelect>
        <ElSelect v-model="currentFunction" value-key="id" class="!w-64">
          <ElOption
            v-for="item in currentFunctions"
            :key="item.id"
            :value="item"
            :label="item.name"
          />
        </ElSelect>
        <div
          v-if="currentFunction"
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
          @upload="uploadFunction"
        >
          <ElButton plain>
            {{ $t('script.uploadScript', { extension: `.${currentExtension}` }) }}
          </ElButton>
        </MyUpload>
        <ElButton type="primary" @click="handleClickSave">
          {{ $t('common.save') }}
        </ElButton>
        <ElTooltip
          v-if="currentFunction"
          placement="top"
          :disabled="!inUseScript"
          :content="$t('script.inUseScript')"
        >
          <ElButton
            :disabled="inUseScript"
            type="danger"
            @click="removeFunction"
          >
            {{ $t('common.delete') }}
          </ElButton>
        </ElTooltip>
      </div>
    </section>
    <section class="h-80 bg-normal border px-0.5 pb-0.5 pt-3 border-border-default rounded">
      <MonacoEditor
        :value="functionContent"
        :language="currentLang"
        :options="{ lineNumbers: 'on' }"
        :actions="editorActions"
        @update="functionContent = $event"
      />
    </section>
  </div>

  <ScriptSaveDialog
    v-model="saveScriptDialogVisible"
    :extension="currentExtension"
    @save="saveFunction"
  />
</template>
