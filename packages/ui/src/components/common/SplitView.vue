<script setup lang="ts">
import { computed, onMounted, type PropType, ref } from 'vue'

const props = defineProps({
  fixedPanelSize: {
    type: [Number, String],
    default: '260px',
  },
  minSize: {
    type: [Number, String],
    default: '0%',
  },
  maxSize: {
    type: [Number, String],
    default: '100%',
  },
  vertical: {
    type: Boolean,
    default: false,
  },
  hidePanelName: {
    type: String as PropType<'panel-1' | 'panel-2'>,
    default: '',
  },
  // TainwindCSS backgroud color class
  handleColor: {
    type: String,
    default: '',
  },
})

const resizePanel = ref<HTMLElement | null>(null)
const panelSize = ref(props.fixedPanelSize)
const isResizing = ref(false)
let startValue = 0
let startSize = 0

function parseSize(size: string | number, containerSize: number): number {
  if (typeof size === 'string') {
    // Assuming you want to handle percentage values in the string
    if (size.endsWith('%')) {
      const percentage = Number.parseFloat(size) / 100
      return containerSize * percentage
    }
    else {
      return Number.parseFloat(size)
    }
  }
  return size
}

const containerStyles = computed(() => {
  const base = 'split-view relative h-full flex'
  if (props.vertical)
    return `${base} flex-col`
  return base
})
const resizeHandleStyles = computed(() => {
  const base = 'resize-handle relative'
  if (props.vertical) {
    return `${base} w-full h-[1px] cursor-row-resize`
  }
  else {
    return `${base} w-[1px] h-full cursor-col-resize`
  }
})
const resizeHandleHoverStyles = computed(() => [
  'resize-handle-hover',
  'absolute',
  'transition-all',
  props.handleColor,
  props.vertical ? 'w-full top-1/2 -translate-y-1/2' : 'h-full left-1/2 -translate-x-1/2',
  !isResizing.value
    ? [props.vertical ? 'h-[1px] hover:h-[4px] hover:bg-main-green' : 'w-[1px] hover:w-[4px] hover:bg-main-green']
    : [props.vertical ? 'h-[4px] bg-main-green' : 'w-[4px] bg-main-green'],
])

function getPanelStyles() {
  if (props.vertical) {
    return { height: `${panelSize.value}px` }
  }
  else {
    return { width: `${panelSize.value}px` }
  }
}

function startResizing(event: MouseEvent) {
  event.preventDefault()
  isResizing.value = true
  startValue = props.vertical ? event.clientY : event.clientX
  startSize = parseSize(
    panelSize.value,
    props.vertical
      ? resizePanel.value?.parentElement?.offsetHeight ?? 0
      : resizePanel.value?.parentElement?.offsetWidth ?? 0,
  )
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResizing)
}

function handleMouseMove(event: MouseEvent) {
  if (!isResizing.value || !resizePanel.value?.parentElement)
    return

  const { offsetHeight, offsetWidth } = resizePanel.value.parentElement
  const containerSize = props.vertical ? offsetHeight : offsetWidth
  const minSize = parseSize(props.minSize, containerSize)
  const maxSize = parseSize(props.maxSize, containerSize)
  const movement = props.vertical ? event.clientY : event.clientX
  const delta = movement - startValue

  let newSize = startSize + delta
  if (props.vertical) {
    const maxPanelSize = containerSize - minSize
    const minPanelSize = containerSize - maxSize
    newSize = Math.max(minPanelSize, Math.min(newSize, maxPanelSize))
  }
  else {
    newSize = Math.max(minSize, Math.min(newSize, maxSize))
  }

  requestAnimationFrame(() => {
    if (panelSize.value !== newSize) {
      panelSize.value = newSize
    }
  })
}

function stopResizing() {
  if (!isResizing.value)
    return
  isResizing.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResizing)
}

onMounted(() => {
  if (resizePanel.value) {
    const containerSize = props.vertical
      ? resizePanel.value.parentElement?.offsetHeight ?? 0
      : resizePanel.value.parentElement?.offsetWidth ?? 0
    const fixedPanelSize = parseSize(props.fixedPanelSize, containerSize)
    const initialSize = props.vertical ? containerSize - fixedPanelSize : fixedPanelSize
    panelSize.value = initialSize
  }
})
</script>

<template>
  <div :class="containerStyles">
    <div v-if="hidePanelName !== 'panel-1'" ref="resizePanel" class="panel-1" :style="getPanelStyles()">
      <slot name="panel-1" />
    </div>
    <div :class="resizeHandleStyles" @mousedown="startResizing">
      <div :class="resizeHandleHoverStyles" />
    </div>
    <div v-if="hidePanelName !== 'panel-2'" class="panel-2 flex-1">
      <slot name="panel-2" />
    </div>
  </div>
</template>
