<template>
  <my-dialog
    :title="$t('script.script')"
    :visible.sync="showDialog"
    class="use-script"
    width="400px"
    @close="resetData"
    @confirm="save"
    @keyupEnter="save"
  >
    <router-link class="new-script-btn" to="/script">
      <i class="iconfont icon-new"></i>
    </router-link>
    <el-form ref="form" label-position="left" label-width="120px">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item :label="$t('script.applyType')" prop="scriptApply">
            <el-select size="small" v-model="scriptApply">
              <el-option v-for="(apply, index) in applyOption" :key="index" :value="apply.value" :label="apply.label">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item :label="$t('script.functionName')" prop="currentFunctionId">
            <el-select filterable clearable size="small" v-model="currentFunctionId" @change="handleFunctionChange">
              <el-option v-for="func in functions" :key="func.id" :value="func.id" :label="func.name"> </el-option>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item :label="$t('script.schemaType')" prop="todo">
            <el-select filterable clearable size="small" v-model="currentSchemaType" @change="handleSchemaTypeChange">
              <el-option v-for="schema in schemaList" :key="schema.label" :value="schema.value" :label="schema.label">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item :label="$t('script.schemaName')" prop="currentSchemaId">
            <el-select filterable clearable size="small" v-model="currentSchemaId">
              <el-option v-for="schema in schemas" :key="schema.id" :value="schema.id" :label="schema.name">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="24" v-if="currentSchemaId && currentSchemaType == 'protobuf'">
          <el-form-item :label="$t('script.protoName')" prop="currentProtoName">
            <el-input v-model.trim="currentProtoName" size="mini"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </my-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import MyDialog from './MyDialog.vue'
import useServices from '@/database/useServices'

@Component({
  components: {
    MyDialog,
  },
})
export default class UseScript extends Vue {
  @Prop({ default: false }) public visible!: boolean

  private showDialog: boolean = this.visible
  private schemaList: SchemaList[] = [
    { label: 'Protobuf', value: 'protobuf' },
    { label: 'Avro', value: 'avro' },
  ]
  private functions: ScriptModel[] = []
  private schemas: ScriptModel[] = []
  private currentFunctionId: string = ''
  private currentSchemaType: SchemaType | null = null
  private currentSchemaId: string = ''
  private currentProtoName: string = ''
  private scriptApply: MessageType = 'all'
  private applyOption = [
    {
      label: this.$t('connections.all'),
      value: 'all',
    },
    {
      label: this.$t('connections.received'),
      value: 'received',
    },
    {
      label: this.$t('connections.published'),
      value: 'publish',
    },
  ]

  @Watch('visible')
  private onVisibleChanged(val: boolean) {
    this.showDialog = val
  }

  private created() {
    this.loadData()
  }

  private readonly defaultSchemaTypes = {
    protobuf: {
      extension: 'proto',
    },
    avro: {
      extension: 'avsc',
    },
  }

  private async loadData() {
    const { scriptService } = useServices()
    const functions: ScriptModel[] | [] = (await scriptService.getAllFunction()) ?? []
    const schemas: ScriptModel[] | [] = (await scriptService.getAllSchema()) ?? []
    this.functions = functions

    this.schemas =
      this.currentSchemaType === null
        ? []
        : schemas.filter((s) => s.name.endsWith(this.defaultSchemaTypes[this.currentSchemaType!].extension))
  }

  private resetData() {
    this.$emit('update:visible', false)
  }

  private handleFunctionChange() {
    this.loadData()
  }

  private handleSchemaTypeChange(schemaType: SchemaType) {
    this.currentSchemaType = schemaType
    this.currentSchemaId = ''
    this.loadData()
  }

  private async save() {
    if (!(this.currentFunctionId || this.currentSchemaId)) {
      this.$message.warning(this.$tc('script.mustSelect'))
      return
    }
    if (this.currentSchemaType && !this.currentSchemaId) {
      this.$message.warning(this.$tc('script.mustSelect'))
      return
    }
    if (this.currentSchemaType === 'protobuf' && !this.currentProtoName) {
      // TODO:modify warning content
      this.$message.warning(this.$tc('script.mustProtoName'))
      return
    }
    const { scriptService } = useServices()
    const currentFunction = await scriptService.get(this.currentFunctionId)
    const currentSchema = await scriptService.get(this.currentSchemaId)
    if (currentFunction || currentSchema) {
      this.$emit('setScript', currentFunction, currentSchema, { name: this.currentProtoName }, this.scriptApply)
      this.resetData()
    }
  }
}
</script>

<style lang="scss">
.use-script {
  .new-script-btn {
    position: absolute;
    top: 16px;
    left: 70px;
    i {
      font-weight: bold;
    }
  }
}
</style>
