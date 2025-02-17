<script setup lang="ts">
const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
}>(), {
  mode: 'create',
})

const { mode } = toRefs(props)

function handleClickBack() {
  // TODO: implement back
  console.log('back')
}

function handleConnect() {
  // TODO: implement connect
  console.log('connect')
}

function handleCommand(command: string) {
  // TODO: implement action command
  console.log(command)
}
</script>

<template>
  <div class="h-16 px-4 flex gap-4 items-center justify-between bg-normal border-b border-border-default">
    <div>
      <ElButton
        link
        type="primary"
        @click="handleClickBack"
      >
        <ElIconArrowLeft width="16" height="16" />
        {{ $t('common.back') }}
      </ElButton>
    </div>
    <div>
      <h1 class="text-base text-title font-bold">
        {{ mode === 'create' ? $t('common.new') : $t('common.edit') }}
      </h1>
    </div>
    <div>
      <!-- FIXME: Eliminate text deprecation warning
      Issue: https://github.com/element-plus/element-plus/discussions/19883 -->
      <ElDropdown split-button type="text" trigger="click" @click="handleConnect" @command="handleCommand">
        <span class="px-[9px]">
          {{ $t('connections.connectBtn') }}
        </span>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem class="" command="save">
              <IconCustomSave class="mr-2" width="18" height="18" />
              {{ $t('common.saveOnly') }}
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>
  </div>
</template>
