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
  padding: 12px 0;
  text-align: center;
  border: 0;
  background: transparent;

  .value {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-title);
    line-height: 1.2;
  }

  .label {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-text-light);
  }
}
</style>
