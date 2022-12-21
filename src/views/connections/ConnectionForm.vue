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
                  v-model.trim="record.name"
                  value-key="name"
                  :fetch-suggestions="querySearchName"
                  @select="handleSelectName"
                >
                </el-autocomplete>
                <el-input v-else size="mini" v-model.trim="record.name"></el-input>
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
            <el-col :span="1">
              <a href="javascript:;" class="icon-oper" @click="setClientID">
                <i class="el-icon-refresh-right"></i>
              </a>
            </el-col>
            <!-- add clientID timestamp check icon -->
            <el-col :span="1">
              <el-tooltip
                placement="top"
                :effect="theme !== 'light' ? 'light' : 'dark'"
                :open-delay="500"
                :offset="80"
                :content="$t('connections.clientIdWithTimeTip')"
              >
                <a
                  href="javascript:;"
                  class="icon-oper-pure"
                  @click="reverseClientIDWithTime"
                  :class="{ 'icon-oper-active': clientIdWithTime }"
                >
                  <i class="el-icon-time"></i>
                </a>
              </el-tooltip>
            </el-col>
            <el-col :span="22">
              <el-form-item class="host-item" label-width="93px" :label="$t('connections.brokerIP')" prop="host">
                <el-col :span="6">
                  <el-select size="mini" v-model="record.protocol" @change="handleProtocol">
                    <el-option label="mqtt://" value="mqtt"></el-option>
                    <el-option label="mqtts://" value="mqtts"></el-option>
                    <el-option label="ws://" value="ws"></el-option>
                    <el-option label="wss://" value="wss"></el-option>
                  </el-select>
                </el-col>
                <el-col :span="18">
                  <el-input size="mini" v-model.trim="record.host"> </el-input>
                </el-col>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('connections.brokerPort')" prop="port">
                <el-input-number
                  size="mini"
                  type="number"
                  :min="0"
                  :max="65535"
                  v-model="record.port"
                  controls-position="right"
                >
                </el-input-number>
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
                <el-input size="mini" clearable v-model.trim="record.username"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label-width="93px" :label="$t('connections.password')" prop="password">
                <el-input type="password" clearable size="mini" v-model.trim="record.password"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label-width="93px" label="SSL/TLS" prop="ssl">
                <el-switch v-model="record.ssl" active-color="#13ce66" inactive-color="#A2A9B0" @change="handleSSL">
                </el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <template v-if="record.ssl">
              <el-col :span="22">
                <el-form-item
                  class="item-secure"
                  :label="$t('connections.strictValidateCertificate')"
                  label-width="93px"
                  prop="rejectUnauthorized"
                >
                  <el-switch v-model="record.rejectUnauthorized" active-color="#13ce66" inactive-color="#A2A9B0">
                  </el-switch>
                  <el-tooltip
                    class="tooltip-secure"
                    placement="top"
                    :effect="theme !== 'light' ? 'light' : 'dark'"
                    :open-delay="500"
                    :offset="80"
                    :content="$t('connections.secureTip')"
                  >
                    <a href="javascript:;" class="icon-oper">
                      <i class="el-icon-warning-outline"></i>
                    </a>
                  </el-tooltip>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
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
                    <el-input size="mini" v-model="record.ca" clearable></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2">
                  <a href="javascript:;" class="icon-oper" @click="getFilePath('ca')">
                    <i class="el-icon-folder-opened"></i>
                  </a>
                </el-col>
                <el-col :span="22">
                  <el-form-item :label="$t('connections.cert')" prop="cert">
                    <el-input size="mini" v-model="record.cert" clearable></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2">
                  <a href="javascript:;" class="icon-oper" @click="getFilePath('cert')">
                    <i class="el-icon-folder-opened"></i>
                  </a>
                </el-col>
                <el-col :span="22">
                  <el-form-item :label="$t('connections.key')" prop="key">
                    <el-input size="mini" v-model="record.key" clearable></el-input>
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
                <el-form-item :label="$t('connections.mqttVersion')" prop="mqttVersion">
                  <el-select size="mini" v-model="record.mqttVersion">
                    <el-option value="3.1" label="3.1"></el-option>
                    <el-option value="3.1.1" label="3.1.1"></el-option>
                    <el-option value="5.0" label="5.0"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
              <el-col :span="22">
                <el-form-item :label="$t('connections.connectionTimeout')" prop="connectTimeout">
                  <el-input-number
                    size="mini"
                    type="number"
                    :min="0"
                    v-model="record.connectTimeout"
                    controls-position="right"
                  >
                  </el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="2"
                ><div class="unit">({{ $t('common.unitS') }})</div></el-col
              >
              <el-col :span="22">
                <el-form-item label="Keep Alive" prop="keepalive">
                  <el-input-number
                    size="mini"
                    type="number"
                    :min="0"
                    v-model="record.keepalive"
                    controls-position="right"
                  >
                  </el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="2"
                ><div class="unit">({{ $t('common.unitS') }})</div></el-col
              >
              <el-col :span="22">
                <el-form-item :label="$t('connections.autoReconnect')" prop="reconnect">
                  <el-switch v-model="record.reconnect" active-color="#13ce66" inactive-color="#A2A9B0"> </el-switch>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
              <template v-if="record.reconnect">
                <el-col :span="22">
                  <el-form-item :label="$t('connections.reconnectPeriod')" prop="reconnectPeriod">
                    <el-input-number
                      size="mini"
                      type="number"
                      :min="1"
                      v-model="record.reconnectPeriod"
                      controls-position="right"
                    >
                    </el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="2">
                  <div class="unit">({{ $t('common.unitMS') }})</div>
                </el-col>
              </template>
              <el-col :span="22">
                <el-form-item :label="record.mqttVersion === '5.0' ? 'Clean Start' : 'Clean Session'" prop="clean">
                  <el-switch
                    v-model="record.clean"
                    active-color="#13ce66"
                    inactive-color="#A2A9B0"
                    @change="handleClean"
                  >
                  </el-switch>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
              <template v-if="record.mqttVersion === '5.0'">
                <el-col :span="22">
                  <el-form-item :label="$t('connections.sessionExpiryInterval')" prop="sessionExpiryInterval">
                    <el-input
                      size="mini"
                      type="number"
                      :min="0"
                      :placeholder="$t('common.neverExpire')"
                      clearable
                      v-model.number="record.properties.sessionExpiryInterval"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2">
                  <div class="unit">({{ $t('common.unitS') }})</div>
                </el-col>
              </template>

              <!-- MQTT v5.0 -->
              <template v-if="record.mqttVersion === '5.0'">
                <el-col :span="22">
                  <el-form-item :label="$t('connections.receiveMaximum')" prop="receiveMaximum">
                    <el-input
                      size="mini"
                      type="number"
                      :min="1"
                      clearable
                      v-model.number="record.properties.receiveMaximum"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
                <el-col :span="22">
                  <el-form-item :label="$t('connections.maximumPacketSize')" prop="maximumPacketSize">
                    <el-input
                      size="mini"
                      type="number"
                      :min="100"
                      clearable
                      v-model.number="record.properties.maximumPacketSize"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
                <el-col :span="22">
                  <el-form-item :label="$t('connections.topicAliasMaximum')" prop="topicAliasMaximum">
                    <el-input
                      size="mini"
                      type="number"
                      :min="1"
                      clearable
                      v-model.number="record.properties.topicAliasMaximum"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
                <el-col :span="22">
                  <el-form-item :label="$t('connections.requestResponseInformation')" prop="requestResponseInformation">
                    <el-switch
                      v-model="record.properties.requestResponseInformation"
                      active-color="#13ce66"
                      inactive-color="#A2A9B0"
                    >
                    </el-switch>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
                <el-col :span="22">
                  <el-form-item :label="$t('connections.requestProblemInformation')" prop="requestProblemInformation">
                    <el-switch
                      v-model="record.properties.requestProblemInformation"
                      active-color="#13ce66"
                      inactive-color="#A2A9B0"
                    >
                    </el-switch>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
              </template>
            </el-row>
          </el-card>
        </el-collapse-transition>

        <el-card v-if="record.mqttVersion === '5.0' && advancedVisible" shadow="never" class="info-body item-card">
          <el-row :gutter="20">
            <el-col :span="22">
              <KeyValueEditor :title="$t('connections.userProperties')" v-model="record.properties.userProperties" />
            </el-col>
          </el-row>
        </el-card>

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
                <el-form-item label-width="160px" :label="$t('connections.willTopic')" prop="will.lastWillTopic">
                  <el-input size="mini" v-model="record.will.lastWillTopic"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
              <el-col :span="22">
                <el-form-item label-width="160px" :label="$t('connections.willQos')" prop="will.lastWillQos">
                  <el-radio-group v-model="record.will.lastWillQos">
                    <el-radio :label="0"></el-radio>
                    <el-radio :label="1"></el-radio>
                    <el-radio :label="2"></el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
              <el-col :span="22">
                <el-form-item label-width="160px" :label="$t('connections.willRetain')" prop="will.lastWillRetain">
                  <el-switch v-model="record.will.lastWillRetain" active-color="#13ce66" inactive-color="#A2A9B0">
                  </el-switch>
                </el-form-item>
              </el-col>
              <el-col :span="2"></el-col>
              <el-col :span="22">
                <el-form-item
                  class="will-payload-box"
                  label-width="160px"
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
                  <div class="lang-type">
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
                    label-width="175px"
                    :label="$t('connections.payloadFormatIndicator')"
                    prop="payloadFormatIndicator"
                  >
                    <el-switch
                      v-model="record.will.properties.payloadFormatIndicator"
                      active-color="#13ce66"
                      inactive-color="#A2A9B0"
                    >
                    </el-switch>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
                <el-col :span="22">
                  <el-form-item
                    label-width="175px"
                    :label="$t('connections.willDelayInterval')"
                    prop="willDelayInterval"
                  >
                    <el-input
                      size="mini"
                      type="number"
                      :min="0"
                      clearable
                      v-model.number="record.will.properties.willDelayInterval"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2"
                  ><div class="unit">({{ $t('common.unitS') }})</div></el-col
                >
                <el-col :span="22">
                  <el-form-item
                    label-width="175px"
                    :label="$t('connections.messageExpiryInterval')"
                    props="messageExpiryInterval"
                  >
                    <el-input
                      size="mini"
                      type="number"
                      :min="0"
                      clearable
                      v-model.number="record.will.properties.messageExpiryInterval"
                    >
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2">
                  <div class="unit">({{ $t('common.unitS') }})</div>
                </el-col>
                <el-col :span="22">
                  <el-form-item
                    class="content-type-item"
                    label-width="175px"
                    :label="$t('connections.contentType')"
                    prop="contentType"
                  >
                    <el-input size="mini" clearable v-model="record.will.properties.contentType"> </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
                <el-col :span="22">
                  <el-form-item
                    class="content-type-item"
                    label-width="175px"
                    :label="$t('connections.responseTopic')"
                    prop="responseTopic"
                  >
                    <el-input size="mini" clearable v-model="record.will.properties.responseTopic"> </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="2"></el-col>
                <el-col :span="22">
                  <el-form-item
                    class="content-type-item"
                    label-width="175px"
                    :label="$t('connections.correlationData')"
                    prop="correlationData"
                  >
                    <el-input size="mini" clearable v-model="record.will.properties.correlationData"> </el-input>
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
import _ from 'lodash'
import time from '@/utils/time'
import useServices from '@/database/useServices'
import { emptyToNull } from '@/utils/handleString'
import { getClientId } from '@/utils/idGenerator'
import { getMQTTProtocol, getDefaultRecord } from '@/utils/mqttUtils'
import Editor from '@/components/Editor.vue'
import KeyValueEditor from '@/components/KeyValueEditor.vue'

@Component({
  components: {
    Editor,
    KeyValueEditor,
  },
})
export default class ConnectionForm extends Vue {
  @Prop({ required: true }) public oper!: 'edit' | 'create' | undefined

  @Getter('advancedVisible') private getterAdvancedVisible!: boolean
  @Getter('willMessageVisible') private getterWillMessageVisible!: boolean
  @Getter('currentTheme') private theme!: Theme

  @Action('CHANGE_ACTIVE_CONNECTION') private changeActiveConnection!: (payload: Client) => void
  @Action('TOGGLE_ADVANCED_VISIBLE') private toggleAdvancedVisible!: (payload: { advancedVisible: boolean }) => void
  @Action('TOGGLE_WILL_MESSAGE_VISIBLE') private toggleWillMessageVisible!: (payload: {
    willMessageVisible: boolean
  }) => void

  private willMessageVisible = true
  private advancedVisible = true
  private payloadType = 'plaintext'
  private suggestConnections: ConnectionModel[] | [] = []
  private oldName = ''

  private defaultRecord: ConnectionModel = getDefaultRecord()

  private record: ConnectionModel = _.cloneDeep(this.defaultRecord)

  @Watch('oper')
  private handleCreateNewConnection(val: string) {
    if (val === 'create') {
      // reinit the form when page jump to creation page
      this.record = _.cloneDeep(this.defaultRecord)
    }
  }

  get clientIdWithTime() {
    return this.record.clientIdWithTime
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
    }
  }

  get vueForm(): VueForm {
    return this.$refs.form as VueForm
  }

  private async loadDetail(id: string) {
    const { connectionService } = useServices()
    const res: ConnectionModel | undefined = await connectionService.get(id)
    if (res) {
      this.record = res
      this.oldName = res.name
      this.record.protocol = getMQTTProtocol(res)
    }
  }

  private async save() {
    this.vueForm.validate(async (valid: boolean) => {
      if (!valid) {
        return false
      }
      const data = { ...this.record }
      data.properties = emptyToNull(data.properties)
      let res: ConnectionModel | undefined = undefined
      const { connectionService } = useServices()
      let msgError = ''
      // SSL File validation
      if (data.ssl && data.certType === 'self') {
        if (!data.cert && !data.key && !data.ca) {
          this.$message.warning(this.$tc('connections.sslFileRequired'))
          return
        }
      }
      if (this.oper === 'create') {
        // create a new connection
        res = await connectionService.create({
          ...data,
          createAt: time.getNowDate(),
          updateAt: time.getNowDate(),
        })
        this.$log.info(`First time created, Name: ${res?.name}, ID: ${res?.id}`)
        msgError = this.$tc('common.createfailed')
      } else {
        // update a exisit connection
        if (data.id) {
          res = await connectionService.updateWithCascade(data.id, {
            ...data,
            updateAt: time.getNowDate(),
          })
          this.$log.info(`${res?.name} was edited, ID: ${res?.id}`)
          msgError = this.$tc('common.editfailed')
        }
      }
      // update ActiveConnection & connect
      if (res && res.id) {
        this.changeActiveConnection({
          id: res.id,
          client: {
            connected: false,
          },
        })
        this.$emit('connect')
        this.$router.push(`/recent_connections/${res.id}`)
      } else {
        this.$message.error(msgError)
        this.$log.error(msgError)
      }
    })
  }

  private setClientID() {
    this.record.clientId = getClientId()
  }

  // Reverse the status of clientIdWithTime.
  private reverseClientIDWithTime() {
    this.record.clientIdWithTime = !this.record.clientIdWithTime
  }

  private getFilePath(key: 'ca' | 'cert' | 'key') {
    remote.dialog
      .showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'CA', extensions: ['crt', 'key', 'pem', 'jks', 'der', 'cer', 'pfx'] }],
      })
      .then((res) => {
        const { filePaths } = res
        if (filePaths) {
          this.record[key] = filePaths[0]
        }
      })
  }

  private handleProtocol(val: Protocol) {
    if (['mqtts', 'wss'].includes(val)) {
      this.record.ssl = true
      this.handleSSL(true)
    } else {
      this.record.ssl = false
      this.handleSSL(false)
    }
  }

  private handleSSL(val: boolean) {
    const { protocol } = this.record
    if (protocol) {
      this.changeProtocol(protocol, val)
      if (!val) {
        this.record.certType = ''
      } else {
        this.record.certType = 'server'
      }
    }
  }

  private handleClean(val: boolean) {
    if (this.record.mqttVersion !== '5.0') {
      return
    }
    if (val && this.record.properties) {
      this.$set(this.record.properties, 'sessionExpiryInterval', 0)
    } else if (!val && this.record.properties) {
      this.$set(this.record.properties, 'sessionExpiryInterval', null)
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

  private async validateName(rule: FormRule, name: string, callBack: NameCallBack) {
    const { connectionService } = useServices()
    const connections = (await connectionService.getAll()) ?? []
    for (const connection of connections) {
      if (this.oper === 'create' && connection.name === name) {
        callBack(this.$tc('connections.duplicateName'))
      } else if (this.oper === 'edit' && name !== this.oldName && connection.name === name) {
        callBack(this.$tc('connections.duplicateName'))
      }
    }
  }

  private async loadSuggestConnections(reload: boolean = false): Promise<void> {
    const { connectionService } = useServices()
    const res: ConnectionModel[] | undefined = await connectionService.getLeatests()
    if (res) {
      this.suggestConnections = res
    }
  }

  private createFilter(queryName: string) {
    return (connectionItem: ConnectionModel) => {
      return connectionItem.name.toLowerCase().indexOf(queryName.toLowerCase()) === 0
    }
  }

  private querySearchName(queryName: string, cb: SearchCallBack) {
    const connections = [...this.suggestConnections]
    const results = queryName ? connections.filter(this.createFilter(queryName)) : connections
    cb(results.reverse())
  }

  private async handleSelectName(item: ConnectionModel) {
    const { clientId } = item
    const { connectionService } = useServices()
    if (clientId) {
      const query: Partial<ConnectionModel> | undefined = await connectionService.getHistoryByClientID(clientId)
      if (query) {
        query.clientId = getClientId()
        this.record = { ...this.record, ...query }
      }
    }
  }

  private async created() {
    await this.loadSuggestConnections()
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
    // normal icon operation style
    .icon-oper {
      color: var(--color-text-default);
      line-height: 43px;
      transition: 0.2s color ease;
      &:hover {
        color: var(--color-main-green);
      }
    }
    .unit {
      color: var(--color-text-default);
      line-height: 43px;
      font-size: 12px;
    }
    // icon style without fake class such as `:hover` style
    .icon-oper-pure {
      color: var(--color-text-default);
      line-height: 43px;
      transition: 0.2s color ease;
    }
    // icon active
    .icon-oper-active {
      color: var(--color-main-green);
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
    .content-type-item {
      margin-top: 8px;
    }
    .key-value-editor {
      padding-left: 12px;
    }
    @include editor-lang-type;
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
  .item-secure {
    .el-form-item__content {
      display: flex;
      align-items: center;
      .tooltip-secure {
        margin-left: 10px;
      }
    }
  }
}
</style>
