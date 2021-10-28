<template>
  <div class="connection-info">
    <el-form ref="form" label-position="top" :model="connection" :rules="rules">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item :label="$t('connections.name')" prop="name">
            <el-input size="mini" v-model="connection.name" :disabled="isClientConnected"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Client ID" prop="clientId">
            <el-tooltip
              class="icon-client-time"
              placement="top"
              :effect="theme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :offset="80"
              :content="$t('connections.clientIdWithTimeTip')"
            >
              <a
                href="javascript:;"
                class="icon-oper"
                @click="reverseClientIDWithTime"
                :class="{ 'icon-oper-active': clientIdWithTime }"
              >
                <i class="el-icon-time"></i>
              </a>
            </el-tooltip>
            <el-input size="mini" v-model="connection.clientId" :disabled="isClientConnected">
              <i
                slot="suffix"
                title="Refresh"
                class="el-icon-refresh"
                :class="{ 'icon-oper-disable': isClientConnected }"
                @click="refreshClientId"
              >
              </i>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="$t('connections.username')">
            <el-input size="mini" v-model="connection.username" :disabled="isClientConnected"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="$t('connections.password')">
            <el-input
              size="mini"
              type="password"
              v-model="connection.password"
              :disabled="isClientConnected"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Keep Alive">
            <el-input-number
              size="mini"
              type="number"
              :min="0"
              v-model="connection.keepalive"
              controls-position="right"
              :disabled="isClientConnected"
            >
            </el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Clean Session">
            <el-checkbox v-model="connection.clean" :disabled="isClientConnected" border>{{
              connection.clean ? 'true' : 'false'
            }}</el-checkbox>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-button
            v-if="!isClientConnected"
            class="btn"
            icon="el-icon-caret-right"
            plain
            type="outline"
            size="mini"
            :loading="btnLoading"
            @click="connect"
          >
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
            @click="disconnect"
          >
            {{ $t('connections.disconnectedBtn') }}
          </el-button>
          <el-button
            v-if="!isClientConnected && btnLoading"
            class="disconnect cancel btn"
            icon="el-icon-close"
            plain
            type="outline"
            size="mini"
            @click="cancel"
          >
            {{ $t('common.cancel') }}
          </el-button>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { getClientId } from '@/utils/idGenerator'
import { MqttClient } from 'mqtt'
import { Getter } from 'vuex-class'
import useServices from '@/database/useServices'

@Component
export default class ConnectionInfo extends Vue {
  @Prop({ required: true }) public connection!: ConnectionModel
  @Prop({ required: true }) public btnLoading!: boolean
  @Prop({ required: true }) public client!: Pick<MqttClient, 'connected'>
  @Prop({ required: true }) public titleName!: string

  @Getter('currentTheme') private theme!: Theme
  @Getter('allConnections') private allConnections!: ConnectionModel[] | []

  private oldName = ''

  @Watch('titleName', { immediate: true, deep: true })
  private handleNameChange(titleName: string) {
    this.oldName = titleName
  }

  // Return the status of client connection
  get isClientConnected() {
    return this.client.connected
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

  get clientIdWithTime(): boolean {
    if (this.connection.clientIdWithTime === undefined) {
      this.connection.clientIdWithTime = false
    }
    return this.connection.clientIdWithTime
  }

  // Reverse the status of clientIdWithTime.
  private reverseClientIDWithTime() {
    // when the client connected, we should disable this icon event
    if (this.isClientConnected) {
      return
    }
    if (this.connection.clientIdWithTime === undefined) {
      this.connection.clientIdWithTime = false
    }
    this.connection.clientIdWithTime = !this.connection.clientIdWithTime
  }

  private async validateName(rule: FormRule, name: string, callBack: NameCallBack) {
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
      const { connectionService } = useServices()
      if (this.connection.id) {
        const res: ConnectionModel | undefined = await connectionService.updateWithCascade(
          this.connection.id,
          this.connection,
        )
        if (res) {
          this.$emit('handleConnect', this.connection)
        }
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
    // when the client connected, we should disable this icon event
    if (this.isClientConnected) {
      return
    }
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
      // normal icon
      .icon-oper {
        color: var(--color-text-tips);
        line-height: 43px;
        transition: 0.2s color ease;
      }
      // icon active
      .icon-oper-active {
        color: var(--color-main-green);
      }
      // icon disable
      .icon-oper-disable {
        color: var(--color-text-default);
      }
      // input disable
      .is-disabled > input {
        background: transparent;
      }
    }
    // adjust the position of the clientID timestamp element
    .icon-client-time {
      position: absolute;
      top: -2.65em;
      left: 5em;
    }

    .el-checkbox {
      border: 1px solid var(--color-border-default);
      padding: 4px 10px;
      height: 28px;
      width: 100%;
      .el-checkbox__label {
        font-size: 12px;
      }
    }
    .el-button.btn {
      margin-top: 10px;
      float: right;
    }
    .el-button.cancel {
      margin-right: 10px;
    }
    .el-button.disconnect {
      color: var(--color-minor-red);
      border-color: var(--color-minor-red);
    }
    .el-form-item.is-success .el-input__inner,
    .el-form-item.is-success .el-input__inner:focus,
    .el-form-item.is-success .el-textarea__inner,
    .el-form-item.is-success .el-textarea__inner:focus {
      border: 1px solid var(--color-border-default);
    }
  }
}
</style>
