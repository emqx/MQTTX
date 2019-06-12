<template>
  <div class="home-view">
    <router-view/>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Home extends Vue {}
</script>


<style lang="scss">
.home-view {
  min-height: 100%;
  background-color: #F9FAFD;
  .right-content {
    margin-left: 300px;
    min-height: 100%;
  }
}
</style>
