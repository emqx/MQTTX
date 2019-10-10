<template>
  <div class="broker-content card-form">
    <div class="broker-topbar right-topbar">
      <div class="broker-info topbar">
        <div class="broker-head">
          <h2>{{ record.brokerName }}</h2>
        </div>
        <div class="broker-tail">
          <el-dropdown trigger="click">
            <a href="javascript:;">
              <i class="el-icon-more"></i>
            </a>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item>
                <i class="iconfont icon-client"></i>oper
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
    </div>

    <div class="info-header">
      <h3>{{ $t('brokers.brokerInfo') }}</h3>
      <a href="javascript:;" @click="handleEdit">
        <i class="iconfont icon-edit"></i>
      </a>
    </div>
    <el-card
      shadow="never"
      class="info-body item-card">
      <div class="item-card__tag">EMQ X</div>
      <el-row>
        <el-form class="broker-form" label-suffix=":">
          <el-col :span="12">
            <el-form-item :label="$t('brokers.brokerName')">
              <span>{{ record.brokerName }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('brokers.brokerAddress')">
              <span>{{ record.brokerAddress }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('brokers.brokerPort')">
              <span>{{ record.brokerPort }}</span>
            </el-form-item>
          </el-col>
        </el-form>
      </el-row>
    </el-card>
    <div class="info-header">
      <h3>{{ $t('brokers.clients') }}</h3>
      <router-link :to="`/clients/${record.id}?oper=create`">
        <i class="iconfont icon-plus"></i>
      </router-link>
    </div>
    <el-row :gutter="10">
      <el-col :span="12">
        <el-card shadow="never" class="item-card">
          <el-form label-suffix=":">
            <el-form-item :label="$t('brokers.clientName')">
              <span>name Name</span>
            </el-form-item>
            <el-form-item label="Client ID">
              <span>11111111</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { BrokerModel } from './types'

@Component
export default class BrokerContent extends Vue {
  @Prop({ required: true }) public record!: BrokerModel

  private handleEdit(): void {
    console.log(1)
    this.$emit('edit')
  }
}
</script>


<style lang="scss" scope>
@import "~@/assets/scss/variable.scss";

.broker-content {
  .broker-topbar {
    .broker-info {
      padding: 0 16px;
    }
  }
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
