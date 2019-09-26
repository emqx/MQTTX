<template>
  <div class="empty-page right-content">
    <div class="empty-page__block">
      <div>
        <img :src="imageSrc" alt="new connection">
      </div>
      <el-button type="outline" icon="el-icon-plus">{{ btnTitle }}</el-button>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class EmptyPage extends Vue {
  @Prop({ required: true }) public btnTitle!: 'connections' | 'brokers'
  @Prop({ required: true }) public name!: string

  get imageSrc(): string {
    return require(`../assets/images/${this.name}.png`)
  }
}
</script>


<style lang="scss" scoped>
.empty-page {
  .empty-page__block {
    img {
      width: 220px;
      height: 135px;
      margin-bottom: 20px;
    }
    text-align: center;
    padding-top: 30%;
  }
}
</style>
