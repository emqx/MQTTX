<!-- src/components/ai/MCPSettings.vue -->
<template>
  <div class="settings-mcp">
    <div class="settings-title">MCP (Model Context Protocol)</div>

    <el-divider></el-divider>

    <el-row class="settings-item" type="flex" justify="space-between">
      <el-col :span="20">
        <label>启用 MCP</label>
        <el-tooltip
          placement="top"
          :effect="currentTheme !== 'light' ? 'light' : 'dark'"
          :open-delay="500"
          :content="'启用 MCP 可以让 AI 使用外部工具和服务'"
        >
          <a href="javascript:;" class="icon-oper">
            <i class="el-icon-warning-outline"></i>
          </a>
        </el-tooltip>
      </el-col>
      <el-col :span="4">
        <el-switch
          v-model="mcpEnabled"
          active-color="#13ce66"
          inactive-color="#A2A9B0"
          @change="handleMCPEnabledChange"
        >
        </el-switch>
      </el-col>
    </el-row>

    <el-divider></el-divider>

    <div v-if="mcpEnabled">
      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="24">
          <div class="section-header">
            <label>MCP 服务器配置</label>
            <el-tooltip
              placement="top"
              :effect="currentTheme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="'配置 MCP 服务器，格式为 JSON 对象，支持多个服务器'"
            >
              <a href="javascript:;" class="icon-oper">
                <i class="el-icon-warning-outline"></i>
              </a>
            </el-tooltip>
          </div>
        </el-col>
      </el-row>

      <el-row class="settings-item mcp-server-config" type="flex" justify="space-between" align="middle">
        <el-col :span="24">
          <div class="editor-container" :class="{ 'is-error': mcpConfigError }">
            <Editor
              id="mcp-config-editor"
              lang="json"
              :fontSize="12"
              lineNumbers="off"
              :wordWrap="'on'"
              :disabled="false"
              :renderHighlight="'line'"
              v-model="mcpConfigStr"
              @change="handleMCPConfigChange"
              @focus="handleEditorFocus"
            />
          </div>
          <div v-if="mcpConfigError" class="mcp-config-error">{{ mcpConfigError }}</div>
        </el-col>
      </el-row>

      <el-divider></el-divider>

      <el-row class="settings-item" type="flex" justify="space-between" align="middle">
        <el-col :span="24">
          <div class="section-header">
            <label>已配置的 MCP 服务器</label>
            <el-tooltip
              placement="top"
              :effect="currentTheme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="'显示当前已配置的 MCP 服务器列表'"
            >
              <a href="javascript:;" class="icon-oper">
                <i class="el-icon-warning-outline"></i>
              </a>
            </el-tooltip>
          </div>
        </el-col>
      </el-row>

      <el-row class="settings-item" v-if="!mcpConfig.mcpServers || Object.keys(mcpConfig.mcpServers).length === 0">
        <el-col :span="24">
          <div class="no-servers">尚未配置 MCP 服务器</div>
        </el-col>
      </el-row>

      <div v-else class="server-list">
        <el-card v-for="(server, name) in mcpConfig.mcpServers" :key="name" class="server-card" shadow="never">
          <div slot="header" class="server-header">
            <span class="server-name">{{ name }}</span>
            <el-button size="mini" type="danger" icon="el-icon-delete" @click="removeMCPServer(name)"></el-button>
          </div>
          <div class="server-command">
            {{ server.command }} {{ server.args.join(' ') }}
            <el-button
              size="mini"
              type="text"
              icon="el-icon-document-copy"
              class="copy-btn"
              @click="copyCommand(server.command + ' ' + server.args.join(' '))"
              title="复制命令"
            ></el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import Editor from '@/components/Editor.vue'

/**
 * MCP 服务器配置接口
 */
interface MCPServerConfig {
  command: string
  args: string[]
  env?: Record<string, string>
}

/**
 * MCP 配置接口
 */
interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>
}

/**
 * MCP 设置组件 - 提供用户配置 Model Context Protocol 服务器的界面
 * 完全独立的组件，不依赖于父组件传入配置
 */
@Component({
  components: {
    Editor,
  },
})
export default class MCPSettings extends Vue {
  @Getter('currentTheme') private currentTheme!: string

  private mcpEnabled = false
  private mcpConfigStr = ''
  private mcpConfigError = ''
  private mcpConfig: MCPConfig = { mcpServers: {} }

  /**
   * 组件创建时的生命周期钩子
   */
  created() {
    this.loadMCPConfig()
  }

  /**
   * 从本地存储加载 MCP 配置
   */
  private loadMCPConfig() {
    const storedConfig = localStorage.getItem('mcpConfig')

    if (storedConfig) {
      try {
        this.mcpConfig = JSON.parse(storedConfig)
        this.mcpConfigStr = JSON.stringify(this.mcpConfig, null, 2)
      } catch (error) {
        console.error('解析 MCP 配置失败:', error)
        this.mcpConfigError = '解析存储的配置失败，已重置为默认值'
        this.mcpConfig = { mcpServers: {} }
        this.mcpConfigStr = JSON.stringify(this.mcpConfig, null, 2)
      }
    } else {
      this.mcpConfig = { mcpServers: {} }
      this.mcpConfigStr = JSON.stringify(this.mcpConfig, null, 2)
    }

    const mcpEnabledStr = localStorage.getItem('mcpEnabled')
    if (mcpEnabledStr !== null) {
      this.mcpEnabled = mcpEnabledStr === 'true'
    }
  }

  /**
   * 处理启用/禁用 MCP 的开关状态变化
   */
  private handleMCPEnabledChange(value: boolean) {
    this.mcpEnabled = value
    localStorage.setItem('mcpEnabled', String(value))
  }

  /**
   * 处理 MCP 配置文本变化
   */
  private handleMCPConfigChange(value: string) {
    this.mcpConfigStr = value
    this.mcpConfigError = ''

    try {
      const config = JSON.parse(value) as MCPConfig

      // 验证配置格式
      if (!config.mcpServers || typeof config.mcpServers !== 'object') {
        this.mcpConfigError = '配置必须包含 mcpServers 对象'
        return
      }

      // 验证每个服务器配置
      for (const [name, server] of Object.entries(config.mcpServers)) {
        if (!server.command || !Array.isArray(server.args)) {
          this.mcpConfigError = `服务器 "${name}" 配置无效，必须包含 command 和 args 数组`
          return
        }
      }

      // 配置有效，更新状态
      this.mcpConfig = config
      localStorage.setItem('mcpConfig', value)
    } catch (error) {
      this.mcpConfigError = '无效的 JSON 格式'
    }
  }

  /**
   * 处理编辑器获得焦点
   */
  private handleEditorFocus() {
    // 清除错误信息
    this.mcpConfigError = ''
  }

  /**
   * 复制命令到剪贴板
   */
  private copyCommand(command: string) {
    const textArea = document.createElement('textarea')
    textArea.value = command
    document.body.appendChild(textArea)
    textArea.select()

    try {
      const successful = document.execCommand('copy')
      if (successful) {
        this.$message({
          message: '命令已复制到剪贴板',
          type: 'success',
          duration: 2000,
        })
      } else {
        this.$message({
          message: '复制失败，请手动选择并复制',
          type: 'warning',
        })
      }
    } catch (err) {
      this.$message({
        message: '复制失败，请手动选择并复制',
        type: 'warning',
      })
    }

    document.body.removeChild(textArea)
  }

  /**
   * 删除指定的 MCP 服务器
   */
  private removeMCPServer(name: string) {
    if (this.mcpConfig.mcpServers && this.mcpConfig.mcpServers[name]) {
      this.$confirm(`确定要删除服务器 "${name}" 吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          // 删除服务器并更新配置
          delete this.mcpConfig.mcpServers[name]
          this.mcpConfigStr = JSON.stringify(this.mcpConfig, null, 2)
          localStorage.setItem('mcpConfig', this.mcpConfigStr)

          this.$message({
            type: 'success',
            message: '删除成功!',
          })
        })
        .catch(() => {
          // 用户取消删除操作
        })
    }
  }
}
</script>

<style lang="scss">
.settings-mcp {
  padding-bottom: 42px;
  .settings-title {
    color: var(--color-text-light);
    margin-bottom: -5px;
  }

  .settings-item {
    label {
      color: var(--color-text-title);
    }
  }

  .section-header {
    display: flex;
    align-items: center;
  }

  .icon-oper {
    position: relative;
    top: 1px;
    left: 5px;
    color: var(--color-text-default);
  }

  .mcp-server-config {
    margin-top: 10px;

    .editor-container {
      height: 250px;
      border: 1px solid var(--color-border-default);
      border-radius: 4px;

      &.is-error {
        border-color: #f56c6c;
      }
    }

    .mcp-config-error {
      color: #f56c6c;
      font-size: 12px;
      line-height: 1;
      padding-top: 4px;
    }
  }

  .no-servers {
    color: var(--color-text-light);
    font-style: italic;
    text-align: center;
    padding: 10px 0;
  }

  .server-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 10px;
  }

  .server-card {
    border: 1px solid var(--color-border-default);
    margin-bottom: 0;

    .el-card__header {
      padding: 12px 16px;
    }

    .el-card__body {
      padding: 16px;
    }
  }

  .server-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .server-name {
    font-weight: bold;
    color: var(--color-text-title);
    font-size: 14px;
  }

  .server-command {
    font-family: Menlo, Monaco, 'Courier New', monospace;
    font-size: 12px;
    color: var(--color-text-default);
    line-height: 1.5;
    word-break: break-all;
    background-color: var(--color-bg-lighter);
    padding: 8px;
    border-radius: 4px;
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .copy-btn {
      margin-left: 8px;
      opacity: 0.7;
      transition: opacity 0.2s ease-in-out;

      &:hover {
        opacity: 1;
      }
    }
  }
}
</style>
