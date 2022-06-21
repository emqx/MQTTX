<template>
  <div class="empty-page right-content">
    <div class="empty-page__block">
      <div>
        <img :src="imageSrc" alt="new connection" />
      </div>
      <el-button class="primary-btn" icon="el-icon-plus" @click="clickMethod(false)">
        {{ btnTitle }}
      </el-button>
      <p v-html="$t('common.cloud')"></p>
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
    return require(`../assets/images/${this.name}.svg`)
  }
}
</script>

<style lang="scss" scoped>
.empty-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  .empty-page__block {
    text-align: center;
    img {
      width: 397px;
      height: 177px;
      margin-bottom: 20px;
    }
    .primary-btn {
      background: linear-gradient(134deg, #37dc85 0%, #35ca8d 100%);
      color: #fff;
      border: 1px solid #37dc85;
    }
    p {
      margin: 32px auto;
      max-width: 650px;
    }
  }
}
</style>
