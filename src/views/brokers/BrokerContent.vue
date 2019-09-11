<template>
  <div class="broker-content card-form">
    <div class="info-header">
      <h3>Broker info</h3>
      <a href="javascript:;">
        <i class="iconfont icon-edit"></i>
      </a>
    </div>
    <el-card
      shadow="never"
      class="info-body item-card">
      <div class="item-card__tag">EMQ X</div>
      <el-row>
        <el-form class="broker-form">
          <el-col :span="12">
            <el-form-item label="Broker Name:">
              <span>111111</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Broker Address:">
              <span>127.0.0.1</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Broker Port:">
              <span>18083</span>
            </el-form-item>
          </el-col>
        </el-form>
      </el-row>
    </el-card>

    <div class="info-header">
      <h3>Clients</h3>
      <router-link to="/clients?oper=create">
        <i class="iconfont icon-plus"></i>
      </router-link>
    </div>
    <el-row :gutter="10">
      <el-col :span="12">
        <el-card shadow="never" class="item-card">
          <el-form>
            <el-form-item label="Client Name:">
              <span>name Name</span>
            </el-form-item>
            <el-form-item label="Client ID:">
              <span>11111111</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="item-card">
          <el-form class="broker-form">
            <el-form-item label="Client Name:">
              <span>name Name</span>
            </el-form-item>
            <el-form-item label="Client ID:">
              <span>11111111</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class BrokerContent extends Vue {}
</script>


<style lang="scss" scope>
@import "~@/assets/scss/variable.scss";

.broker-content {
  height: 100%;
  .item-card__tag {
    position: absolute;
    right: 0;
    top: 0;
    background: var(--color-text-tips);
    color: #fff;
    padding: 0px 5px;
    font-size: $font-size--tips;
  }
}
</style>
