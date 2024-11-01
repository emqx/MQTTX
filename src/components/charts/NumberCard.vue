<template>
  <el-card class="number-card" shadow="never">
    <div class="value">
      {{ value }}
      <i v-if="icon" :class="['ml-2', icon]"></i>
    </div>
    <div class="label">{{ label }}</div>
  </el-card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class NumberCard extends Vue {
  @Prop({ required: true }) public value!: number | string
  @Prop({ required: true }) public label!: string
  @Prop({ default: '' }) public icon!: string
}
</script>

<style lang="scss" scoped>
.number-card {
  padding: 16px 0px;
  text-align: center;
  border: 0px;

  .value {
    font-size: 24px;
    font-weight: bold;
    color: #fff;
  }

  .label {
    margin-top: 8px;
    font-size: 14px;
    color: #fff;
  }
}
</style>
