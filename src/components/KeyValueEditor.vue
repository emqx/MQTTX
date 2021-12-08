<template>
  <div class="key-value-editor">
    <div class="editor-header">
      <span class="editor-title">{{ title }}</span>
      <el-button icon="el-icon-plus" class="btn-props-plus" type="text" @click="addItem" />
    </div>
    <div class="editor-row" :style="{ 'max-height': maxHeight }">
      <div v-for="(item, index) in dataList" class="editor-row" :key="index">
        <a class="btn-check" @click="checkItem(index)">
          <i v-if="item.checked" class="iconfont el-icon-check"></i>
          <i v-else class="iconfont el-icon-check disable-icon"></i>
        </a>
        <el-input
          placeholder="Key"
          size="mini"
          v-model="item.key"
          class="input-prop user-prop-key"
          @input="handleInputChange"
        />
        <el-input
          placeholder="Value"
          size="mini"
          v-model="item.value"
          class="input-prop user-prop-value"
          @input="handleInputChange"
        />
        <el-button icon="el-icon-delete" class="btn-delete" type="text" @click="deleteItem(index)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Model, Prop, Vue } from 'vue-property-decorator'
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
  @Model('change', { type: Object }) private readonly value!: { [key: string]: string }

  private dataList: KeyValueObj[] = []

  private handleInputChange() {
    const checkedList = this.dataList.filter((pair) => pair.checked)
    const objData: {
      [key: string]: string
    } = {}
    checkedList.forEach(({ key, value }) => {
      if (key !== '') {
        objData[key] = value
      }
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
      this.$emit('change', undefined)
    }
  }
  private checkItem(index: number) {
    this.dataList[index].checked = !this.dataList[index].checked
    this.handleInputChange()
  }

  private processObjToArry() {
    if (this.value === undefined) {
      this.dataList = [{ key: '', value: '', checked: true }]
      return
    }
    this.dataList = Object.entries(this.value).map(([key, value]) => {
      return {
        key,
        value,
        checked: true,
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
