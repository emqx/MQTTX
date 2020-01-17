<template>
  <div class="connection-form right-content card-form">
    <div class="right-topbar topbar">
      <div class="header">
          <a href="javascript:;" @click="handleBack($route.params.id)">
            <i class="el-icon-arrow-left"></i>{{ $t('common.back') }}
          </a>
        </div>
      <div class="body">
        <h2>{{ oper === 'create' ? $t('common.new') : $t('common.edit') }}</h2>
      </div>
      <div class="tail">
        <a href="javascript:;" @click="save">
          {{ $t('connections.connectBtn') }}
        </a>
      </div>
    </div>

    <el-form
      ref="form"
      label-position="right"
      label-width="160px"
      :model="record"
      :rules="rules">
      <div class="client-create__body">
        <div class="info-header">
          <h3>{{ $t('settings.general') }}</h3>
        </div>
        <el-card
          shadow="never"
          class="info-body item-card">
          <el-row :gutter="10">
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('connections.name')" prop="name">
                <el-input size="mini" v-model="record.name"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label-width="93px" label="Client ID" prop="clientId">
                <el-input size="mini" v-model="record.clientId"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <a href="javascript:;" class="icon-oper" @click="setClientID">
                <i class="el-icon-refresh-right"></i>
              </a>
            </el-col>
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('connections.brokerIP')" prop="host">
                <el-input size="mini" v-model="record.host"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('connections.brokerPort')" prop="port">
                <el-input size="mini" type="number" v-model.number="record.port"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('connections.username')" prop="username">
                <el-input size="mini" v-model="record.username"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('connections.password')" prop="password">
                <el-input type="password" size="mini" v-model="record.password"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label-width="93px" label="SSL/TLS" prop="ssl">
                <el-radio-group v-model="record.ssl" @change="handleSSL">
                  <el-radio :label="true">true</el-radio>
                  <el-radio :label="false">false</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <template v-if="record.ssl">
              <el-col :span="22">
                <el-form-item label-width="93px" :label="$t('connections.certType')" prop="certType">
                  <el-radio-group v-model="record.certType">
                    <el-radio label="server">CA signed server</el-radio>
                    <el-radio label="self">Self signed</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
            </template>
          </el-row>
        </el-card>

        <transition-group name="el-zoom-in-top">
          <template v-if="record.certType === 'self'">
            <div key="title" class="info-header">
              <h3>Certificates</h3>
            </div>
            <el-card
              key="content"
              shadow="never"
              class="info-body item-card">
              <el-row :gutter="10">
                <el-col :span="22">
                  <el-form-item :label="$t('connections.ca')" prop="ca">
                    <el-input size="mini" v-model="record.ca"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2">
                  <a href="javascript:;" class="icon-oper" @click="getFilePath('ca')">
                    <i class="el-icon-folder-opened"></i>
                  </a>
                </el-col>
                <el-col :span="22">
                  <el-form-item :label="$t('connections.cert')" prop="cert">
                    <el-input size="mini" v-model="record.cert"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2">
                  <a href="javascript:;" class="icon-oper" @click="getFilePath('cert')">
                    <i class="el-icon-folder-opened"></i>
                  </a>
                </el-col>
                <el-col :span="22">
                  <el-form-item :label="$t('connections.key')" prop="key">
                    <el-input size="mini" v-model="record.key"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2">
                  <a href="javascript:;" class="icon-oper" @click="getFilePath('key')">
                    <i class="el-icon-folder-opened"></i>
                  </a>
                </el-col>
              </el-row>
            </el-card>
          </template>
        </transition-group>

        <div class="info-header">
          <h3>{{ $t('settings.advanced') }} <i class="el-icon-caret-top"></i></h3>
        </div>
        <el-card
          shadow="never"
          class="info-body item-card">
          <el-row :gutter="10">
            <el-col :span="22">
              <el-form-item
                :label="`${$t('connections.connectionTimeout')} (${$t('common.unitS')})`"
                prop="connectTimeout">
                <el-input size="mini" type="number" v-model.number="record.connectTimeout"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item :label="`Keep Alive (${$t('common.unitS')})`" prop="keepalive">
                <el-input size="mini" type="number" v-model.number="record.keepalive"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2">
            </el-col>
            <el-col :span="22">
              <el-form-item :label="$t('connections.cleanSession')" prop="clean">
                <el-radio-group v-model="record.clean">
                  <el-radio :label="true"></el-radio>
                  <el-radio :label="false"></el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item :label="$t('connections.autoReconnect')" prop="reconnect">
                <el-radio-group v-model="record.reconnect">
                  <el-radio :label="true"></el-radio>
                  <el-radio :label="false"></el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item :label="$t('connections.mqttVersion')" prop="mqttVersion">
                <el-select size="mini" v-model="record.mqttVersion">
                  <el-option value="3.1.1" label="3.1.1"></el-option>
                  <el-option value="5.0" label="5.0"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>

            <!-- MQTT v5.0 -->
            <template v-if="record.mqttVersion === '5.0'">
              <el-col :span="22">
                <el-form-item :label="$t('connections.sessionExpiryInterval')" prop="sessionExpiryInterval">
                  <el-input size="mini" type="number" v-model.number="record.sessionExpiryInterval">
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
              <el-col :span="22">
                <el-form-item :label="$t('connections.receiveMaximum')" prop="receiveMaximum">
                  <el-input size="mini" type="number" v-model.number="record.receiveMaximum">
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
            </template>
          </el-row>
        </el-card>
      </div>
    </el-form>
  </div>
</template>


<script lang="ts">
import { remote } from 'electron'
import { Component, Vue, Prop } from 'vue-property-decorator'
import { Action } from 'vuex-class'
import { loadConnection, updateConnection } from '@/utils/api/connection'
import getClientId from '@/utils/getClientId'
import { createConnection } from '@/utils/api/connection'
import { ConnectionModel } from './types'

@Component
export default class ConnectionCreate extends Vue {
  @Prop({ required: true }) public oper!: 'edit' | 'create' | undefined

  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection!: (
    payload: Client,
  ) => void

  private record: ConnectionModel = {
    clientId: getClientId(),
    name: '',
    clean: true,
    host: 'broker.emqx.io',
    keepalive: 60,
    connectTimeout: 10,
    reconnect: true,
    username: '',
    password: '',
    path: '/mqtt',
    port: 1883,
    ssl: false,
    certType: '',
    ca: '',
    cert: '',
    key: '',
    mqttVersion: '3.1.1',
    subscriptions: [],
    messages: [],
    unreadMessageCount: 0,
    client: {
      connected: false,
    },
  }

  get rules() {
    return {
      name: [{ required: true, message: this.$t('common.inputRequired') }],
      clientId: [{ required: true, message: this.$t('common.inputRequired') }],
      host: [{ required: true, message: this.$t('common.inputRequired') }],
      port: [{ required: true, message: this.$t('common.inputRequired') }],
      certType: [{ required: true, message: this.$t('common.selectRequired') }],
      ca: [{ required: true, message: this.$t('common.inputRequired') }],
    }
  }

  get vueForm(): VueForm {
    return this.$refs.form as VueForm
  }

  private async loadDetail(id: string) {
    const res: ConnectionModel | null = await loadConnection(id)
    if (res) {
      this.record = res
    }
  }

  private save(): void {
    this.vueForm.validate(async (valid: boolean) => {
      if (!valid) {
        return false
      }
      const data = { ...this.record }
      let res: ConnectionModel | null = null
      let msgError = ''
      if (this.oper === 'create') {
        res = await createConnection(data)
        msgError = this.$t('common.createfailed') as string
      } else {
        res = await updateConnection(data.id as string, data)
        msgError = this.$t('common.editfailed') as string
      }
      if (res) {
        this.changeActiveConnection({
          id: res.id as string,
          client: {},
          messages: [],
        })
        this.$emit('connect')
        this.$router.push(`/recent_connections/${res.id}`)
      } else {
        this.$message.error(msgError)
      }
    })
  }

  private setClientID() {
    this.record.clientId = getClientId()
  }

  private getFilePath(key: 'ca' | 'cert' | 'key'): void {
    remote.dialog.showOpenDialog({
      properties: [
        'openFile',
      ],
      filters: [
        { name: 'CA', extensions: ['crt', 'key', 'pem'] },
      ],
    }, (files) => {
      if (files) {
        this.record[key] = files[0]
      }
    })
  }

  private handleSSL(val: boolean): void {
    if (!val) {
      this.record.certType = ''
    }
  }

  private handleBack(id: string): void {
    if (this.oper === 'create' && id === '0') {
      this.$router.push('/recent_connections')
    } else {
      this.$router.push(`/recent_connections/${id}`)
    }
  }

  private created() {
    const { id } = this.$route.params
    if (this.oper === 'edit' && id !== '0') {
      this.loadDetail(id)
    }
  }
}
</script>


<style lang="scss">
.connection-form {
  padding: 0 16px;
  .el-form {
    padding-top: 80px;
    .icon-oper {
      color: var(--color-text-default);
      line-height: 43px;
      &:hover,
      &:focus {
        color: var(--color-main-green);
      }
    }
    .el-form-item__error {
      top: 80%;
    }
  }
}
</style>
