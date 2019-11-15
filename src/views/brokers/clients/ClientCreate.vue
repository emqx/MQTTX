<template>
  <div class="client-create card-form">
    <div class="client-topbar right-topbar">
      <div class="client-info topbar">
        <div class="client-header">
          <a href="javascript:;" @click="$router.go(-1)">
            <i class="el-icon-arrow-left"></i>{{ $t('common.back') }}
          </a>
        </div>
        <div class="client-body">
          <h2>{{ $t('brokers.newClient') }}</h2>
        </div>
        <div class="client-tail">
          <a href="javascript:;" @click="save">
            {{ $t('common.save') }}
          </a>
        </div>
      </div>
    </div>

    <el-form ref="record" :model="record" label-position="right" label-width="160px" :rules="rules">
      <div class="client-create__body">
        <div class="info-header">
          <h3>{{ $t('settings.general') }}</h3>
        </div>
        <el-card
          shadow="never"
          class="info-body item-card">
          <el-row :gutter="10">
            <el-col :span="22">
              <el-form-item label-width="110px" :label="$t('brokers.clientName')" prop="clientName">
                <el-input size="mini" v-model="record.clientName"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label-width="110px" label="Client ID" prop="clientId">
                <el-input size="mini" v-model="record.clientId"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <a href="javascript:;" class="icon-oper" @click="setClientID">
                <i class="el-icon-refresh-right"></i>
              </a>
            </el-col>
            <el-col :span="22">
              <el-form-item label-width="110px" :label="$t('brokers.username')" prop="username">
                <el-input size="mini" v-model="record.username"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label-width="110px" :label="$t('brokers.password')" prop="password">
                <el-input type="password" size="mini" v-model="record.password"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
          </el-row>
        </el-card>

        <template v-if="needSelfCAfile">
          <div class="info-header">
            <h3>Certificates</h3>
          </div>
          <el-card
            shadow="never"
            class="info-body item-card">
            <el-row :gutter="10">
              <el-col :span="22">
                <el-form-item :label="$t('brokers.ca')" prop="ca">
                  <el-input size="mini" v-model="record.ca"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2">
                <a href="javascript:;" class="icon-oper" @click="getFilePath('ca')">
                  <i class="el-icon-folder-opened"></i>
                </a>
              </el-col>
              <el-col :span="22">
                <el-form-item :label="$t('brokers.cert')" prop="cert">
                  <el-input size="mini" v-model="record.cert"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2">
                <a href="javascript:;" class="icon-oper" @click="getFilePath('cert')">
                  <i class="el-icon-folder-opened"></i>
                </a>
              </el-col>
              <el-col :span="22">
                <el-form-item :label="$t('brokers.key')" prop="key">
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

        <div class="info-header">
          <h3>{{ $t('settings.advanced') }} <i class="el-icon-caret-top"></i></h3>
        </div>
        <el-card
          shadow="never"
          class="info-body item-card">
          <el-row :gutter="10">
            <el-col :span="22">
              <el-form-item :label="$t('brokers.connectionTimeout')" prop="connectionTimeout">
                <el-input size="mini" type="number" v-model.number="record.connectionTimeout"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label="Keep Alive" prop="keepAlive">
                <el-input size="mini" type="number" v-model.number="record.keepAlive"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2">
            </el-col>
            <el-col :span="22">
              <el-form-item :label="$t('brokers.cleanSession')" prop="cleanSession">
                <el-radio-group v-model="record.cleanSession">
                  <el-radio :label="true"></el-radio>
                  <el-radio :label="false"></el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item :label="$t('brokers.autoReconnect')" prop="autoReconnect">
                <el-radio-group v-model="record.autoReconnect">
                  <el-radio :label="true"></el-radio>
                  <el-radio :label="false"></el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item :label="$t('brokers.mqttVersion')" prop="mqttVersion">
                <el-select size="mini" v-model="record.mqttVersion">
                  <el-option value="3.1.1" label="3.1.1"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
          </el-row>
        </el-card>
      </div>
    </el-form>
  </div>
</template>


<script lang="ts">
import { remote } from 'electron'
import { Component, Vue, Prop } from 'vue-property-decorator'
import { createClient } from '@/utils/api/broker'
import getClientId from '@/utils/getClientId'
import { ClientModel, BrokerModel } from '../types'

@Component({
  components: {},
})
export default class ClientCreate extends Vue {
  @Prop({ required: true }) private broker!: BrokerModel

  private record: ClientModel = {
    brokeruuid: '',
    clientName: '',
    clientId: getClientId(),
    cleanSession: true,
    autoReconnect: true,
    mqttVersion: '3.1.1',
    keepAlive: 60,
    ca: '',
    cert: '',
    key: '',
  }

  get vueForm(): VueForm {
    return this.$refs.record as VueForm
  }

  get needSelfCAfile(): boolean {
    return this.broker.tls && this.broker.certType === 'self'
  }

  get rules() {
    return  {
      clientName: [{ required: true, message: this.$t('common.inputRequired') }],
      clientId: [{ required: true, message: this.$t('common.inputRequired') }],
      ca: [{ required: true, message: this.$t('common.inputRequired') }],
      cert: [{ required: true, message: this.$t('common.inputRequired') }],
      key: [{ required: true, message: this.$t('common.inputRequired') }],
    }
  }

  private setClientID(): void {
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

  private save() {
    this.vueForm.validate(async (valid: boolean) => {
      if (!valid) {
        return false
      }
      this.record.brokeruuid = this.broker.id || ''
      const data = { ...this.record }
      const res = await createClient(data)
      if (res) {
        this.$message.success(this.$t('common.createSuccess') as string)
        this.$router.push({ path: `/brokers/${this.broker.id}` })
      }
    })
  }
  // TODO: Determine whether to save on beforeRouterLeave
}
</script>


<style lang="scss" scope>
@import "~@/assets/scss/variable.scss";
@import "~@/assets/scss/mixins.scss";

.client-create {
  height: 100%;

  .client-topbar {
    .client-info {
      padding: 0 16px;
    }
  }

  .el-form {
    .el-form-item {
      margin-bottom: 5px;
    }
    .icon-oper {
      color: var(--color-text-default);
      line-height: 40px;
      &:hover,
      &:focus {
        color: var(--color-main-green);
      }
    }
    .el-form-item__error {
      top: 80%;
    }
  }

  .client-create__body {
    .el-card.info-body {
      padding: 0 0px;
    }
  }
}
</style>
