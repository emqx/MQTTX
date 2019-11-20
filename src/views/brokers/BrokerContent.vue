<template>
  <div class="broker-content card-form">
    <div class="broker-topbar right-topbar" :style="{ top: $store.state.app.MacOSTop }">
      <div class="broker-info topbar">
        <div class="broker-head">
          <h2>{{ record.brokerName }}</h2>
        </div>
        <div class="broker-tail">
          <el-dropdown trigger="click" @command="handleCommand">
            <a href="javascript:;">
              <i class="el-icon-more"></i>
            </a>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="deleteBroker">
                <i class="iconfont icon-delete"></i>
                {{ $t('brokers.deleteBroker') }}
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
          <!-- <el-col :span="12">
            <el-form-item label="Path">
              <span>{{ record.path }}</span>
            </el-form-item>
          </el-col> -->
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
      <el-col v-for="client in clients" :key="client.id" :span="12">
        <el-card shadow="hover" class="item-card client-card">
          <el-dropdown class="oper-dropdown" trigger="click" @command="handleCommand">
            <a class="oper-icon" href="javascript:;">
              <i class="el-icon-more"></i>
            </a>
            <el-dropdown-menu slot="dropdown">
              <a class="dropdown-clients-item" href="javascript:;" @click="editClient(client)">
                <i class="el-icon-edit"></i>
                {{ $t('common.edit') }}
              </a>
              <a class="dropdown-clients-item" href="javascript:;" @click="removeClient(client)">
                <i class="el-icon-delete"></i>
                {{ $t('common.delete') }}
              </a>
            </el-dropdown-menu>
          </el-dropdown>
          <el-form label-suffix=":">
            <el-form-item :label="$t('brokers.clientName')">
              <span>{{ client.clientName }}</span>
            </el-form-item>
            <el-form-item label="Client ID">
              <span>{{ client.clientId }}</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { deleteClient } from '@/utils/api/broker'
import { BrokerModel, ClientModel } from './types'

@Component
export default class BrokerContent extends Vue {
  @Prop({ required: true }) public record!: BrokerModel
  @Prop({ required: true }) public clients!: ClientModel[]

  private handleEdit(): void {
    this.$emit('edit')
  }

  private handleCommand(command: 'deleteBroker'): void {
    if (command === 'deleteBroker') {
      this.$emit('deleteBroker', this.record)
    }
  }

  private editClient(row: ClientModel): void {
    this.$router.push({
      path: `/clients/${this.record.id}`,
      query: { oper: 'edit', clientId: row.id },
    })
  }

  private removeClient(row: ClientModel): void {
    const confirmDelete: string = this.$t('common.confirmDelete', { name: row.clientName }) as string
    this.$confirm(confirmDelete, this.$t('common.warning') as string, {
      type: 'warning',
    }).then(async () => {
      const res: ClientModel | null = await deleteClient(row.id as string)
      if (res) {
        this.$emit('deleteClient')
        this.$message({
          type: 'success',
          message: this.$t('common.deleteSuccess') as string,
        })
      }
    }).catch((error) => {
      // ignore(error)
    })
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
  .client-card {
    margin: 10px 5px 10px 0px;
    cursor: pointer;
    .oper-dropdown {
      position: absolute;
      right: 10px;
      top: 8px;
      .oper-icon {
        display: inline-block;
        transform: rotate(90deg);
      }
    }
  }
}
.dropdown-clients-item {
  display: block;
  text-align: left;
  padding: 5px 16px;
  min-width: 85px;
  i {
    margin-right: 8px;
  }
}
</style>
