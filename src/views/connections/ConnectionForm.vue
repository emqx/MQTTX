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

    <el-form ref="form" label-position="right" label-width="160px" :model="record" :rules="rules">
      <div class="client-create__body">
        <div class="info-header">
          <h3>{{ $t('settings.general') }}</h3>
        </div>
        <el-card shadow="never" class="info-body item-card">
          <el-row :gutter="10">
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('connections.name')" prop="name">
                <el-autocomplete
                  v-if="oper === 'create'"
                  size="mini"
                  v-model="record.name"
                  value-key="name"
                  :fetch-suggestions="querySearchName"
                  @select="handleSelectName"
                >
                </el-autocomplete>
                <el-input v-else size="mini" v-model="record.name"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <el-tooltip
                v-if="oper === 'create'"
                placement="top"
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :open-delay="500"
                :offset="80"
                :content="$t('connections.nameTip')"
              >
                <a href="javascript:;" class="icon-oper">
                  <i class="el-icon-warning-outline"></i>
                </a>
              </el-tooltip>
            </el-col>
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
              <el-form-item class="host-item" label-width="93px" :label="$t('connections.brokerIP')" prop="host">
                <el-col :span="6">
                  <el-select size="mini" v-model="record.protocol">
                    <el-option label="mqtt://" value="mqtt" :disabled="record.ssl"></el-option>
                    <el-option label="mqtts://" value="mqtts"></el-option>
                    <el-option label="ws://" value="ws" :disabled="record.ssl"></el-option>
                    <el-option label="wss://" value="wss"></el-option>
                  </el-select>
                </el-col>
                <el-col :span="18">
                  <el-input size="mini" v-model="record.host"> </el-input>
                </el-col>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('connections.brokerPort')" prop="port">
                <el-input size="mini" type="number" :min="0" v-model.number="record.port"> </el-input>
              </el-form-item>
            </el-col>

            <template v-if="record.protocol === 'ws' || record.protocol === 'wss'">
              <el-col :span="22">
                <el-form-item label-width="93px" label="Path" prop="path">
                  <el-input size="mini" v-model="record.path"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
            </template>

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

        <!-- SSL -->
        <transition-group name="el-zoom-in-top">
          <template v-if="record.certType === 'self'">
            <div key="title" class="info-header">
              <h3>Certificates</h3>
            </div>
            <el-card key="content" shadow="never" class="info-body item-card">
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
                <el-col :span="22">
                  <el-form-item
                    :label="$t('connections.strictValidateCertificate')"
                    :label-width="getterLang === 'zh' ? '' : '200'"
                    prop="rejectUnauthorized"
                  >
                    <el-switch v-model="record.rejectUnauthorized" active-color="#13ce66" inactive-color="#A2A9B0">
                    </el-switch>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
              </el-row>
            </el-card>
          </template>
        </transition-group>

        <div class="info-header">
          <h3>
            {{ $t('settings.advanced') }}
            <a
              :class="['collapse-btn', advancedVisible ? 'top' : 'bottom']"
              href="javascript:;"
              @click="handleCollapse('advanced')"
            >
              <i class="el-icon-caret-top"></i>
            </a>
          </h3>
        </div>
        <el-collapse-transition>
          <el-card v-show="advancedVisible" shadow="never" class="info-body item-card">
            <el-row :gutter="10">
              <el-col :span="22">
                <el-form-item
                  :label="`${$t('connections.connectionTimeout')} (${$t('common.unitS')})`"
                  prop="connectTimeout"
                >
                  <el-input size="mini" type="number" :min="0" v-model.number="record.connectTimeout"> </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
              <el-col :span="22">
                <el-form-item :label="`Keep Alive (${$t('common.unitS')})`" prop="keepalive">
                  <el-input size="mini" type="number" :min="0" v-model.number="record.keepalive"> </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2"> </el-col>
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
                    <el-input size="mini" type="number" :min="0" v-model.number="record.sessionExpiryInterval">
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
                <el-col :span="22">
                  <el-form-item :label="$t('connections.receiveMaximum')" prop="receiveMaximum">
                    <el-input size="mini" type="number" :min="0" v-model.number="record.receiveMaximum"> </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
                <el-col :span="22">
                  <el-form-item :label="$t('connections.topicAliasMaximum')" prop="topicAliasMaximum">
                    <el-input size="mini" type="number" :min="0" v-model.number="record.topicAliasMaximum"> </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
              </template>
            </el-row>
          </el-card>
        </el-collapse-transition>

        <!-- Last-Will Message -->
        <div class="info-header">
          <h3>
            {{ $t('connections.willMessage') }}
            <a
              :class="['collapse-btn', willMessageVisible ? 'top' : 'bottom']"
              href="javascript:;"
              @click="handleCollapse('willMessage')"
            >
              <i class="el-icon-caret-top"></i>
            </a>
          </h3>
        </div>
        <el-collapse-transition>
          <el-card v-show="willMessageVisible" shadow="never" class="info-body item-card">
            <el-row :gutter="10">
              <el-col :span="22">
                <el-form-item
                  :label-width="`${willLabelWidth}px`"
                  :label="$t('connections.willTopic')"
                  prop="will.lastWillTopic"
                >
                  <el-input size="mini" v-model="record.will.lastWillTopic"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
              <el-col :span="22">
                <el-form-item
                  :label-width="`${willLabelWidth}px`"
                  :label="$t('connections.willQos')"
                  prop="will.lastWillQos"
                >
                  <el-radio-group v-model="record.will.lastWillQos">
                    <el-radio :label="0"></el-radio>
                    <el-radio :label="1"></el-radio>
                    <el-radio :label="2"></el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
              <el-col :span="22">
                <el-form-item
                  :label-width="`${willLabelWidth}px`"
                  :label="$t('connections.willRetain')"
                  prop="will.lastWillRetain"
                >
                  <el-radio-group v-model="record.will.lastWillRetain">
                    <el-radio :label="true"></el-radio>
                    <el-radio :label="false"></el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
              <el-col :span="22">
                <el-form-item
                  class="will-payload-box"
                  :label-width="`${willLabelWidth}px`"
                  :label="$t('connections.willPayload')"
                  prop="will.lastWillPayload"
                >
                  <div class="last-will-payload">
                    <Editor
                      ref="lastWillPayload"
                      id="lastWillPayload"
                      :lang="payloadType"
                      :fontSize="12"
                      v-model="record.will.lastWillPayload"
                      scrollbar-status="auto"
                    />
                  </div>
                  <div class="payload-type">
                    <el-radio-group v-model="payloadType">
                      <el-radio label="json">JSON</el-radio>
                      <el-radio label="plaintext">Plaintext</el-radio>
                    </el-radio-group>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>

              <!-- MQTT v5.0 -->
              <template v-if="record.mqttVersion === '5.0'">
                <el-col :span="22">
                  <el-form-item
                    :label-width="`${willLabelWidth}px`"
                    :label="$t('connections.isUTF8Data')"
                    prop="payloadFormatIndicator"
                  >
                    <el-radio-group v-model="record.will.properties.payloadFormatIndicator">
                      <el-radio :label="true"></el-radio>
                      <el-radio :label="false"></el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
                <el-col :span="22">
                  <el-form-item
                    :label-width="`${willLabelWidth}px`"
                    :label="`${$t('connections.willDelayInterval')} (${$t('common.unitS')})`"
                    prop="willDelayInterval"
                  >
                    <el-input
                      size="mini"
                      type="number"
                      :min="0"
                      v-model.number="record.will.properties.willDelayInterval"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
                <el-col :span="22">
                  <el-form-item
                    :label-width="`${willLabelWidth}px`"
                    :label="`${$t('connections.messageExpiryInterval')} (${$t('common.unitS')})`"
                    props="messageExpiryInterval"
                  >
                    <el-input
                      size="mini"
                      type="number"
                      :min="0"
                      v-model.number="record.will.properties.messageExpiryInterval"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
                <el-col :span="22">
                  <el-form-item
                    :label-width="`${willLabelWidth}px`"
                    :label="$t('connections.contentType')"
                    prop="contentType"
                  >
                    <el-input type="textarea" :rows="2" v-model="record.will.properties.contentType"> </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
              </template>
            </el-row>
          </el-card>
        </el-collapse-transition>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts">
import { remote } from 'electron'
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import { loadConnection, createConnection, updateConnection, loadSuggestConnections } from '@/utils/api/connection'
import getClientId from '@/utils/getClientId'
import { ConnectionModel, SearchCallBack, NameCallBack, FormRule } from './types'
import { getMQTTProtocol } from '@/utils/mqttUtils'
import Editor from '@/components/Editor.vue'
import deepMerge from '@/utils/deepMerge'

@Component({
  components: {
    Editor,
  },
})
export default class ConnectionCreate extends Vue {
  @Prop({ required: true }) public oper!: 'edit' | 'create' | undefined

  @Getter('currentLang') private getterLang!: Language
  @Getter('advancedVisible') private getterAdvancedVisible!: boolean
  @Getter('willMessageVisible') private getterWillMessageVisible!: boolean
  @Getter('currentTheme') private theme!: Theme
  @Getter('allConnections') private allConnections!: ConnectionModel[] | []

  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection!: (payload: Client) => void
  @Action('TOGGLE_ADVANCED_VISIBLE') private toggleAdvancedVisible!: (payload: { advancedVisible: boolean }) => void
  @Action('TOGGLE_WILL_MESSAGE_VISIBLE') private toggleWillMessageVisible!: (payload: {
    willMessageVisible: boolean
  }) => void

  private willMessageVisible = true
  private advancedVisible = true
  private payloadType = 'plaintext'
  private willLabelWidth = 160
  private suggestConnections: ConnectionModel[] | [] = []
  private oldName = ''

  private record: ConnectionModel = {
    clientId: getClientId(),
    name: '',
    clean: true,
    protocol: 'mqtt',
    host: 'broker.emqx.io',
    keepalive: 60,
    connectTimeout: 10,
    reconnect: false,
    username: '',
    password: '',
    path: '/mqtt',
    port: 1883,
    ssl: false,
    certType: '',
    rejectUnauthorized: false,
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
    will: {
      lastWillTopic: '',
      lastWillPayload: '',
      lastWillQos: 0,
      lastWillRetain: false,
      properties: {
        payloadFormatIndicator: undefined,
        willDelayInterval: undefined,
        messageExpiryInterval: undefined,
        contentType: '',
      },
    },
    sessionExpiryInterval: undefined,
    receiveMaximum: undefined,
    topicAliasMaximum: undefined,
  }

  @Watch('record', { immediate: true, deep: true })
  private handleMqttVersionChange(val: ConnectionModel) {
    if (val.mqttVersion === '3.1.1') {
      this.willLabelWidth = 160
    } else {
      this.willLabelWidth = 180
    }
  }

  get rules() {
    return {
      name: [
        { required: true, message: this.$t('common.inputRequired') },
        { validator: this.validateName, trigger: 'blur' },
      ],
      clientId: [{ required: true, message: this.$t('common.inputRequired') }],
      path: [{ required: true, message: this.$t('common.inputRequired') }],
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
      deepMerge(this.record, res)
      this.oldName = res.name
      this.record.protocol = getMQTTProtocol(res)
      if (res.rejectUnauthorized === undefined) {
        this.record.rejectUnauthorized = false
      }
    }
  }

  private save() {
    this.vueForm.validate(async (valid: boolean) => {
      if (!valid) {
        return false
      }
      const data = { ...this.record }
      this.trimString(data)
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

  private getFilePath(key: 'ca' | 'cert' | 'key') {
    remote.dialog.showOpenDialog(
      {
        properties: ['openFile'],
        filters: [{ name: 'CA', extensions: ['crt', 'key', 'pem', 'jks', 'der', 'cer', 'pfx'] }],
      },
      (files) => {
        if (files) {
          this.record[key] = files[0]
        }
      },
    )
  }

  private handleSSL(val: boolean) {
    const { protocol } = this.record
    this.changeProtocol(protocol, val)
    if (!val) {
      this.record.certType = ''
    }
  }

  private changeProtocol(protocol: Protocol | undefined, isSSL: boolean): void | boolean {
    if (!protocol) {
      return false
    }
    if (/ws/gi.test(protocol)) {
      this.record.protocol = isSSL ? 'wss' : 'ws'
    } else if (/mqtt/gi.test(protocol)) {
      this.record.protocol = isSSL ? 'mqtts' : 'mqtt'
    }
  }

  private handleBack(id: string) {
    if (this.oper === 'create' && id === '0') {
      this.$router.push('/recent_connections')
    } else {
      this.$router.push(`/recent_connections/${id}`)
    }
  }

  private trimString(data: ConnectionModel) {
    const { name, host, password } = data
    data.name = name.trim()
    data.host = host.trim()
    data.password = password.trim()
  }

  private handleCollapse(part: 'advanced' | 'willMessage') {
    if (part === 'advanced') {
      this.advancedVisible = !this.advancedVisible
      this.toggleAdvancedVisible({
        advancedVisible: this.advancedVisible,
      })
    } else if (part === 'willMessage') {
      this.willMessageVisible = !this.willMessageVisible
      this.toggleWillMessageVisible({
        willMessageVisible: this.willMessageVisible,
      })
    }
  }

  private async validateName(rule: FormRule, name: string, callBack: NameCallBack['callBack']) {
    for (const connection of this.allConnections) {
      if (this.oper === 'create' && connection.name === name) {
        callBack(`${this.$t('connections.duplicateName')}`)
      } else if (this.oper === 'edit' && name !== this.oldName && connection.name === name) {
        callBack(`${this.$t('connections.duplicateName')}`)
      }
    }
  }

  private async loadData(reload: boolean = false): Promise<void> {
    this.suggestConnections = await loadSuggestConnections()
  }

  private createFilter(queryName: string) {
    return (connectionItem: ConnectionModel) => {
      return connectionItem.name.toLowerCase().indexOf(queryName.toLowerCase()) === 0
    }
  }

  private querySearchName(queryName: string, cb: SearchCallBack['callBack']) {
    const connections = [...this.suggestConnections]
    const results = queryName ? connections.filter(this.createFilter(queryName)) : connections
    cb(results.reverse())
  }

  private handleSelectName(item: ConnectionModel) {
    const { id, ...oneConnection } = item
    oneConnection.clientId = getClientId()
    this.record = oneConnection
  }

  private created() {
    this.loadData()
    const { id } = this.$route.params
    if (this.oper === 'edit' && id !== '0') {
      this.loadDetail(id)
    }
    this.advancedVisible = this.getterAdvancedVisible
    this.willMessageVisible = this.getterWillMessageVisible
  }
}
</script>

<style lang="scss">
@import '~@/assets/scss/mixins.scss';

.connection-form {
  padding: 0 16px;
  .topbar {
    -webkit-app-region: drag;
  }
  .el-form {
    padding-top: 80px;
    padding-bottom: 40px;
    .icon-oper {
      color: var(--color-text-default);
      line-height: 43px;
      transition: 0.2s color ease;
      &:hover,
      &:focus {
        color: var(--color-main-green);
      }
    }
    .el-form-item__error {
      top: 80%;
    }
    .host-item {
      .el-col-6 {
        padding-left: 0px !important;
      }
      .el-col-18 {
        padding-right: 0px !important;
      }
    }
    .last-will-payload {
      height: 235px;
      border: 1px solid var(--color-border-default);
      padding: 10px 1px 1px 1px;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }
    .payload-type {
      width: 100%;
      height: 30px;
      line-height: 30px;
      padding: 0px 12px;
      background: var(--color-bg-radio);
      border: 1px solid var(--color-border-default);
      border-top: none;
      text-align: right;
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }
  }
  .info-header {
    a.collapse-btn {
      color: var(--color-text-light);
      font-size: 1rem;
      position: relative;
      top: 1px;
    }
    @include collapse-btn-transform(0deg, 180deg);
  }
}
</style>
