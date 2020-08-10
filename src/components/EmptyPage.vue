<template>
  <div class="empty-page right-content">
    <div class="empty-page__block">
      <div>
        <img :src="imageSrc" alt="new connection" />
      </div>
      <el-button type="outline" icon="el-icon-plus" @click="clickMethod(false)">
        {{ btnTitle }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class EmptyPage extends Vue {
  @Prop({ required: true }) public btnTitle!: 'connections'
  @Prop({ required: true }) public name!: string
  @Prop() public clickMethod!: <T>() => T | void

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
