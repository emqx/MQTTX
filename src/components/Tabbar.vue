<template>
  <div class="tabbar">
    <el-row>
      <el-col :span="8">
        <router-link to="/recent_connections">Connections</router-link>
      </el-col>
      <el-col :span="8">
        <router-link to="/brokers">Brokers</router-link>
      </el-col>
      <el-col :span="8">
        <router-link to="/settings">Settings</router-link>
      </el-col>
    </el-row>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Leftbar extends Vue {}
</script>


<style lang="scss">
.tabbar {
  position: fixed;
  width: 298px;
  height: 52px;
  bottom: 0;
  overflow-x: hidden;
  z-index: 1001;
  border-top: 2px solid rgba(230,232,241,1);
  height: 56px;
  line-height: 56px;
  text-align: center;
}
</style>
