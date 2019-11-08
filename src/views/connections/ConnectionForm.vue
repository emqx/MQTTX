<template>
  <div class="connection-form">
    <el-form
      ref="form"
      label-position="top"
      :model="connection"
      :rules="rules">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item :label="$t('brokers.clientName')" prop="name">
            <el-input size="mini" v-model="connection.name"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Client ID" prop="clientId">
            <el-input size="mini" v-model="connection.clientId">
              <i
                slot="suffix"
                title="Refresh"
                class="el-icon-refresh"
                @click="refreshClientId">
              </i>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="$t('brokers.username')">
            <el-input size="mini" v-model="connection.username"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="$t('brokers.password')">
            <el-input size="mini" type="password" v-model="connection.password"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Keep Alive">
            <el-input size="mini" type="number" v-model.number="connection.keepalive"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-checkbox v-model="connection.clean">Clean Session</el-checkbox>
        </el-col>
        <el-col :span="8">
          <el-button 
            v-if="!client.connected" 
            icon="el-icon-caret-right"
            plain
            type="outline"
            size="mini"
            :loading="btnLoading"
            @click="confirm">
            {{ $t('connections.connectBtn') }}
          </el-button>
          <el-button 
            v-else
            class="disconnect"
            icon="el-icon-switch-button"
            plain
            type="outline"
            size="mini"
            :loading="btnLoading"
            @click="cancel">
            {{ $t('connections.disconnectedBtn') }}
          </el-button>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import getClientId from '@/utils/getClientId'
import { updateConnectionByClient } from '@/utils/api/connection'
import { ClientModel } from '../brokers/types'
import { ConnectionModel } from './types'

@Component
export default class ConnectionForm extends Vue {
  @Prop({ required: true }) public connection!: ConnectionModel
  @Prop({ required: true }) public btnLoading!: boolean
  @Prop({ required: true }) public client!: $TSFixed

  get rules() {
    return {
      name: [{ required: true, message: this.$t('common.inputRequired') }],
      clientId: [{ required: true, message: this.$t('common.inputRequired') }],
    }
  }

  private async confirm(): Promise<void> {
    const res: ConnectionModel | null = await updateConnectionByClient(this.connection.id as string, this.connection)
    if (res) {
      this.$emit('handleConfirm', this.connection)
    }
  }

  private cancel(): void {
    this.$emit('handleCancel', this.connection)
  }

  private refreshClientId(): void {
    this.connection.clientId = getClientId()
  }
}
</script>


<style lang="scss">
.connection-form {
  padding-bottom: 5px;
  .el-form {
    position: relative;
    top: -10px;
    .el-form-item {
      margin-bottom: 5px;
      .el-form-item__label {
        padding: 0;
        height: 35px;
      }
      .el-form-item__content {
        line-height: 35px;
        height: 35px;
      }
      .el-icon-refresh {
        cursor: pointer;
        color: var(--color-main-green);
      }
    }
    .el-checkbox {
      margin-top: 42px;
    }
    .el-button {
      margin-top: 25px;
      float: right;
      min-width: 100px;
    }
    .disconnect.el-button {
      color: var(--color-second-red);
      border-color: var(--color-second-red);
    }
  }
}
</style>
