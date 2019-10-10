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
          <a href="javascript:;">
            {{ $t('common.save') }}
          </a>
        </div>
      </div>
    </div>

    <div class="client-create__body">
      <div class="info-header">
        <h3>{{ $t('settings.general') }}</h3>
      </div>
      <el-card
        shadow="never"
        class="info-body item-card">
        <el-row :gutter="10">
          <el-form :model="generalRecord" label-position="right" label-width="110px" :rules="generalRules">
            <el-col :span="22">
              <el-form-item :label="$t('brokers.clientName')" prop="clientName">
                <el-input size="mini" v-model="generalRecord.clientName"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label="Client ID" prop="clientId">
                <el-input size="mini" v-model="generalRecord.clientId"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <a href="javascript:;" class="icon-oper">
                <i class="el-icon-refresh-right"></i>
              </a>
            </el-col>
            <el-col :span="22">
              <el-form-item :label="$t('brokers.username')" prop="username">
                <el-input size="mini" v-model="generalRecord.username"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item :label="$t('brokers.password')" prop="password">
                <el-input size="mini" v-model="generalRecord.password"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
          </el-form>
        </el-row>
      </el-card>

      <template v-if="hasSSL">
        <div class="info-header">
          <h3>Certificates</h3>
        </div>
        <el-card
          shadow="never"
          class="info-body item-card">
          <el-row :gutter="10">
            <el-form :model="certRecord" label-position="right" label-width="160px" :rules="certRules">
              <el-col :span="22">
                <el-form-item :label="$t('brokers.ca')" prop="ca">
                  <el-input size="mini" v-model="certRecord.ca"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2">
                <a href="javascript:;" class="icon-oper">
                  <i class="el-icon-folder-opened"></i>
                </a>
              </el-col>
              <el-col :span="22">
                <el-form-item :label="$t('brokers.cert')" prop="cert">
                  <el-input size="mini" v-model="certRecord.cert"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2">
                <a href="javascript:;" class="icon-oper">
                  <i class="el-icon-folder-opened"></i>
                </a>
              </el-col>
              <el-col :span="22">
                <el-form-item :label="$t('brokers.key')" prop="key">
                  <el-input size="mini" v-model="certRecord.key"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2">
                <a href="javascript:;" class="icon-oper">
                  <i class="el-icon-folder-opened"></i>
                </a>
              </el-col>
            </el-form>
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
          <el-form :model="advancedRecord" label-position="right" label-width="150px">
            <el-col :span="22">
              <el-form-item :label="$t('brokers.connectionTimeout')" prop="connectionTimeout">
                <el-input size="mini" v-model="advancedRecord.connectionTimeout"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label="Keep Alive" prop="keepAlive">
                <el-input size="mini" v-model="advancedRecord.keepAlive"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2">
            </el-col>
            <el-col :span="22">
              <el-form-item :label="$t('brokers.connectionTimeout')" prop="cleanSession">
                <el-radio-group v-model="advancedRecord.cleanSession">
                  <el-radio :label="true"></el-radio>
                  <el-radio :label="false"></el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item :label="$t('brokers.autoReconnect')" prop="autoReconnect">
                <el-radio-group v-model="advancedRecord.autoReconnect">
                  <el-radio :label="true"></el-radio>
                  <el-radio :label="false"></el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item :label="$t('brokers.mqttVersion')" prop="mqttVersion">
                <el-select size="mini" v-model="advancedRecord.mqttVersion">
                  <el-option value="3.1.0" label="3.1.0"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
          </el-form>
        </el-row>
      </el-card>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

interface GeneraModel {
  clientName: string,
  clientId: string,
  username?: string,
  password?: string,
}

interface AdvancedModel {
  connectionTimeout?: string,
  cleanSession?: boolean,
  autoReconnect?: boolean,
  mqttVersion?: string,
}

interface CertModel {
  ca: string,
  cert: string,
  key: string,
}

@Component({
  components: {},
})
export default class ClientCreate extends Vue {
  private hasSSL: boolean = true

  private generalRecord: GeneraModel = {
    clientName: '',
    clientId: '',
  }
  private advancedRecord: AdvancedModel = {
    cleanSession: true,
    autoReconnect: true,
    mqttVersion: '3.1.0',
  }
  private certRecord: CertModel = {
    ca: '',
    cert: '',
    key: '',
  }

  get generalRules() {
    return {
      clientName: [{ required: true, message: this.$t('common.inputRequired') }],
      clientId: [{ required: true, message: this.$t('common.inputRequired') }],
    }
  }

  get certRules() {
    return {
      ca: [{ required: true, message: this.$t('common.inputRequired') }],
      cert: [{ required: true, message: this.$t('common.inputRequired') }],
      key: [{ required: true, message: this.$t('common.inputRequired') }],
    }
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

  .client-create__body {
    .el-card.info-body {
      padding: 0 0px;
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
    }
  }
}
</style>
