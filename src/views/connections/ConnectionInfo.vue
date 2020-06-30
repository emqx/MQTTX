<template>
  <div class="connection-info">
    <el-form
      ref="form"
      label-position="top"
      :model="connection"
      :rules="rules">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item :label="$t('connections.name')" prop="name">
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
          <el-form-item :label="$t('connections.username')">
            <el-input size="mini" v-model="connection.username"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="$t('connections.password')">
            <el-input size="mini" type="password" v-model="connection.password"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Keep Alive">
            <el-input size="mini" type="number" v-model.number="connection.keepalive"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8" class="connection.ssl">
          <el-checkbox v-model="connection.clean">Clean Session</el-checkbox>
        </el-col>
        <el-col :span="24">
          <el-button
            v-if="!client.connected"
            class="btn"
            icon="el-icon-caret-right"
            plain
            type="outline"
            size="mini"
            :loading="btnLoading"
            @click="connect">
            {{ $t('connections.connectBtn') }}
          </el-button>
          <el-button
            v-else
            class="btn disconnect"
            icon="el-icon-switch-button"
            plain
            type="outline"
            size="mini"
            :loading="btnLoading"
            @click="disconnect">
            {{ $t('connections.disconnectedBtn') }}
          </el-button>
          <el-button
            v-if="!client.connected && btnLoading"
            class="disconnect cancel btn"
            icon="el-icon-close"
            plain
            type="outline"
            size="mini"
            @click="cancel">
            {{ $t('common.cancel') }}
          </el-button>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import getClientId from '@/utils/getClientId'
import { updateConnection } from '@/utils/api/connection'
import { ConnectionModel, FormRule, NameCallBack } from './types'
import { MqttClient } from 'mqtt'
import { Getter } from 'vuex-class'

@Component
export default class ConnectionInfo extends Vue {
  @Prop({ required: true }) public connection!: ConnectionModel
  @Prop({ required: true }) public btnLoading!: boolean
  @Prop({ required: true }) public client!: MqttClient | {}
  @Prop({ required: true }) public titleName!: string

  @Getter('allConnections') private allConnections!: ConnectionModel[] | []

  private oldName = ''

  @Watch('titleName', { immediate: true, deep: true })
  private handleNameChange(titleName: string) {
    this.oldName = titleName
  }

  get rules() {
    return {
      name: [
        { required: true, message: this.$t('common.inputRequired') },
        { validator: this.validateName, trigger: 'blur' },
      ],
      clientId: [{ required: true, message: this.$t('common.inputRequired') }],
    }
  }

  get vueForm(): VueForm {
    return this.$refs.form as VueForm
  }

  private async validateName(rule: FormRule, name: string, callBack: NameCallBack['callBack']) {
    for (const oneConnection of this.allConnections) {
      if (name !== this.oldName && oneConnection.name === name) {
        callBack(`${this.$t('connections.duplicateName')}`)
      }
    }
  }

  private async connect(): Promise<void> {
    this.vueForm.validate(async (valid: boolean) => {
      if (!valid) {
        return false
      }
      const res: ConnectionModel | null = await updateConnection(
        this.connection.id as string,
        this.connection,
      )
      if (res) {
        this.$emit('handleConnect', this.connection)
      }
    })
  }

  private disconnect() {
    this.vueForm.validate(async (valid: boolean) => {
      if (!valid) {
        return false
      }
      this.$emit('handleDisconnect', this.connection)
    })
  }

  private cancel() {
    this.$emit('handleCancel', this.connection)
  }

  private refreshClientId() {
    this.connection.clientId = getClientId()
  }
}
</script>


<style lang="scss">
.connection-info {
  user-select: none;
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
    }
    .el-checkbox {
      margin-top: 42px;
    }
    .el-button.btn {
      margin-top: 13px;
      float: right;
    }
    .el-button.cancel {
      margin-right: 10px;
    }
    .el-button.disconnect {
      color: var(--color-second-red);
      border-color: var(--color-second-red);
    }
  }
}
</style>
