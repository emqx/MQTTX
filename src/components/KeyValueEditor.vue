<template>
  <div class="key-value-editor">
    <div class="editor-header">
      <span class="editor-title">{{ title }}</span>
      <el-button v-if="!disabled" icon="el-icon-plus" class="btn-props-plus" type="text" @click="addItem" />
    </div>
    <div class="editor-row" :style="{ 'max-height': maxHeight }">
      <div v-for="(item, index) in dataList" class="editor-row" :key="index">
        <el-input
          :ref="`KeyRef${index}`"
          placeholder="Key"
          size="mini"
          type="textarea"
          resize="none"
          :autosize="{ minRows: 1, maxRows: 3 }"
          :disabled="disabled"
          v-model="item.key"
          class="input-prop user-prop-key"
          @input="handleInputChange"
        />
        <el-input
          :ref="`ValueRef${index}`"
          placeholder="Value"
          size="mini"
          type="textarea"
          resize="none"
          :autosize="{ minRows: 1, maxRows: 3 }"
          :disabled="disabled"
          v-model="item.value"
          class="input-prop user-prop-value"
          @input="handleInputChange"
        />
        <el-button v-if="!disabled" icon="el-icon-delete" class="btn-delete" type="text" @click="deleteItem(index)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Model, Prop, Vue, Watch } from 'vue-property-decorator'
import _ from 'lodash'

interface KeyValueObj {
  key: string
  value: string
}

@Component
export default class KeyValueEditor extends Vue {
  @Prop({ required: false, default: '' }) private title!: string
  @Prop({ required: false, default: '100%' }) private maxHeight!: string
  @Prop({ required: false, default: false }) private disabled!: boolean
  @Model('change', { type: Object }) private readonly value!: ClientPropertiesModel['userProperties'] | null

  private dataList: KeyValueObj[] = []

  @Watch('value')
  private handleValueChanged(
    val: ClientPropertiesModel['userProperties'],
    oldVal: ClientPropertiesModel['userProperties'],
  ) {
    if (oldVal === undefined && val) {
      this.processObjToArry()
    }
  }

  private handleInputChange() {
    if (this.dataList.length === 0) {
      this.$emit('change', null)
      return
    }
    const objData: ClientPropertiesModel['userProperties'] = {}
    this.dataList.forEach(({ key, value }) => {
      if (key === '') return
      const objValue = objData[key]
      if (objValue) {
        const _value = value as string
        if (Array.isArray(objValue)) {
          objData[key] = [...objValue, _value]
        } else {
          objData[key] = [objValue, _value]
        }
      } else {
        objData[key] = value
      }
    })
    this.$emit('change', objData)
  }

  private addItem() {
    this.dataList.push({ key: '', value: '' })
  }
  private deleteItem(index: number) {
    if (this.dataList.length > 1) {
      this.dataList.splice(index, 1)
      this.handleInputChange()
    } else if (this.dataList.length === 1) {
      this.dataList = [{ key: '', value: '' }]
      this.$emit('change', null)
    }
  }

  private processObjToArry() {
    if (_.isEmpty(this.value)) {
      this.dataList = [{ key: '', value: '' }]
      return
    }
    this.dataList = []
    Object.entries(this.value as { [key: string]: string | string[] }).forEach(([key, value]) => {
      if (typeof value === 'string') {
        this.dataList.push({ key, value })
      } else {
        value.forEach((item) => {
          this.dataList.push({ key, value: item })
        })
      }
    })
  }

  private resizeInput() {
    interface ResizeTextarea {
      resizeTextarea: () => void
    }
    this.dataList.forEach((_, i) => {
      if (this.$refs[`ValueRef${i}`]) {
        const valueRef = this.$refs[`ValueRef${i}`]
        if (Array.isArray(valueRef)) {
          ;(valueRef[0] as unknown as ResizeTextarea).resizeTextarea()
        }
      }
      if (this.$refs[`KeyRef${i}`]) {
        const keyRef = this.$refs[`KeyRef${i}`]
        if (Array.isArray(keyRef)) {
          ;(keyRef[0] as unknown as ResizeTextarea).resizeTextarea()
        }
      }
    })
  }

  private created() {
    this.processObjToArry()
    window.addEventListener('resize', this.resizeInput)
  }

  private beforeDestroy() {
    window.removeEventListener('resize', this.resizeInput)
  }
}
</script>

<style lang="scss">
.key-value-editor {
  .editor-header {
    .editor-title {
      color: var(--color-text-default);
    }
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .editor-row {
    overflow-y: scroll;
    white-space: nowrap;
    .editor-row {
      overflow: hidden;
      display: flex;
      align-items: center;
      &:not(:last-child) {
        margin-bottom: 10px;
      }
      .input-prop {
        padding: 0px;
        margin-right: 10px;
        textarea {
          padding: 4px 15px;
          background: transparent;
          border-radius: 4px;
          overflow-y: hidden;
          &:hover {
            overflow-y: overlay;
          }
        }
      }
    }
  }
}
</style>
