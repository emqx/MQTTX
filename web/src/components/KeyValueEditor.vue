<template>
  <div class="key-value-editor">
    <div class="editor-header">
      <span class="editor-title">{{ title }}</span>
      <el-button v-if="!disabled" icon="el-icon-plus" class="btn-props-plus" type="text" @click="addItem" />
    </div>
    <div class="editor-row" :style="{ 'max-height': maxHeight }">
      <div v-for="(item, index) in dataList" class="editor-row" :key="index">
        <a v-if="!disabled" class="btn-check" @click="checkItem(index)">
          <i v-if="item.checked" class="iconfont el-icon-check"></i>
          <i v-else class="iconfont el-icon-check disable-icon"></i>
        </a>
        <el-input
          placeholder="Key"
          size="mini"
          :disabled="disabled"
          v-model="item.key"
          class="input-prop user-prop-key"
          @input="handleInputChange"
        />
        <el-input
          placeholder="Value"
          size="mini"
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
  checked: boolean
}

@Component
export default class KeyValueEditor extends Vue {
  @Prop({ required: false, default: '' }) private title!: string
  @Prop({ required: false, default: '100%' }) private maxHeight!: string
  @Prop({ required: false, default: false }) private disabled!: boolean
  @Model('change', { type: Object }) private readonly value!: ClientPropertiesModel['userProperties'] | null

  private dataList: KeyValueObj[] = []

  @Watch('value')
  private handleValueChanged(val: ClientPropertiesModel['userProperties'] | null) {
    // Rebuild rows only when the value was changed externally (e.g. switching between
    // subscription records); changes emitted by this editor itself already match the
    // current rows, rebuilding then would drop unchecked or half-typed rows.
    const current: NonNullable<ClientPropertiesModel['userProperties']> = {}
    this.dataList.forEach(({ key, value, checked }) => {
      if (!checked || key === '') return
      const existing = current[key]
      current[key] = existing === undefined ? value : [...(Array.isArray(existing) ? existing : [existing]), value]
    })
    const incoming = val && Object.keys(val).length > 0 ? val : null
    if (_.isEqual(incoming, Object.keys(current).length > 0 ? current : null)) return
    this.processObjToArry()
  }

  private handleInputChange() {
    const checkedList = this.dataList.filter((pair) => pair.checked)
    const objData: NonNullable<ClientPropertiesModel['userProperties']> = Object.create(null)
    checkedList.forEach(({ key, value }) => {
      if (key === '') return
      const objValue = objData[key]
      objData[key] = objValue === undefined ? value : [...(Array.isArray(objValue) ? objValue : [objValue]), value]
    })
    this.$emit('change', objData)
  }

  private addItem() {
    this.dataList.push({ key: '', value: '', checked: true })
  }
  private deleteItem(index: number) {
    if (this.dataList.length > 1) {
      this.dataList.splice(index, 1)
      this.handleInputChange()
    } else if (this.dataList.length === 1) {
      this.dataList = [{ key: '', value: '', checked: true }]
      this.$emit('change', null)
    }
  }
  private checkItem(index: number) {
    this.dataList[index].checked = !this.dataList[index].checked
    this.handleInputChange()
  }

  private processObjToArry() {
    if (!this.value || _.isEmpty(this.value)) {
      this.dataList = [{ key: '', value: '', checked: true }]
      return
    }
    this.dataList = []
    Object.entries(this.value).forEach(([key, value]) => {
      if (typeof value === 'string') {
        this.dataList.push({ key, value, checked: true })
      } else {
        value.forEach((item) => {
          this.dataList.push({ key, value: item, checked: true })
        })
      }
    })
  }

  private created() {
    this.processObjToArry()
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      &:not(:last-child) {
        margin-bottom: 10px;
      }
      .input-prop {
        padding: 0px;
        margin-right: 10px;
      }
      .btn-check {
        cursor: pointer;
        .el-icon-check {
          font-size: 14px;
          margin-right: 10px;
        }
        .disable-icon {
          color: dimgray;
        }
      }
    }
  }
}
</style>
