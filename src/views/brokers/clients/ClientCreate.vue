<template>
  <div class="client-create card-form">
    <ClientTopbar/>

    <div class="client-create__body">
      <div class="info-header">
        <h3>General</h3>
      </div>
      <el-card
        shadow="never"
        class="info-body item-card">
        <el-row :gutter="10">
          <el-form :model="generalRecord" label-position="right" label-width="110px" :rules="generalRules">
            <el-col :span="22">
              <el-form-item label="Client Name" prop="clientName">
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
              <el-form-item label="Username" prop="username">
                <el-input size="mini" v-model="generalRecord.username"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label="Password" prop="password">
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
                <el-form-item label="CA File" prop="ca">
                  <el-input size="mini" v-model="certRecord.ca"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2">
                <a href="javascript:;" class="icon-oper">
                  <i class="el-icon-folder-opened"></i>
                </a>
              </el-col>
              <el-col :span="22">
                <el-form-item label="Client Certificate File" prop="cert">
                  <el-input size="mini" v-model="certRecord.cert"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2">
                <a href="javascript:;" class="icon-oper">
                  <i class="el-icon-folder-opened"></i>
                </a>
              </el-col>
              <el-col :span="22">
                <el-form-item label="Client Key File" prop="key">
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
        <h3>Advanced <i class="el-icon-caret-top"></i></h3>
      </div>
      <el-card
        shadow="never"
        class="info-body item-card">
        <el-row :gutter="10">
          <el-form :model="advancedRecord" label-position="right" label-width="150px">
            <el-col :span="22">
              <el-form-item label="Connection Timeout" prop="connectionTimeout">
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
              <el-form-item label="Clean Session" prop="cleanSession">
                <el-radio-group v-model="advancedRecord.cleanSession">
                  <el-radio :label="true"></el-radio>
                  <el-radio :label="false"></el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label="Auto Reconnect" prop="autoReconnect">
                <el-radio-group v-model="advancedRecord.autoReconnect">
                  <el-radio :label="true"></el-radio>
                  <el-radio :label="false"></el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="2"></el-col>
            <el-col :span="22">
              <el-form-item label="MQTT version" prop="mqttVersion">
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
import ClientTopbar from './ClientTopbar.vue'

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
  components: {
    ClientTopbar,
  },
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
  private generalRules = {
    clientName: [{ required: true, message: 'required' }],
    clientId: [{ required: true, message: 'required' }],
  }
  private certRules = {
    ca: [{ required: true, message: 'required' }],
    cert: [{ required: true, message: 'required' }],
    key: [{ required: true, message: 'required' }],
  }

  // TODO: Determine whether to save on beforeRouterLeave
}
</script>


<style lang="scss" scope>
@import "~@/assets/scss/variable.scss";
@import "~@/assets/scss/mixins.scss";

.client-create {
  height: 100%;

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
          i {
            font-weight: 600;
          }
        }
      }
    }
  }
}
</style>
