<template>
  <div class="settings-mcp">
    <div class="settings-title">{{ $t('copilot.mcpTitle') }}</div>

    <el-divider></el-divider>

    <el-row class="settings-item" type="flex" justify="space-between">
      <el-col :span="20">
        <label>{{ $t('copilot.mcpEnableLabel') }}</label>
        <el-tooltip
          placement="top"
          :effect="currentTheme !== 'light' ? 'light' : 'dark'"
          :open-delay="500"
          :content="$t('copilot.mcpEnableTooltip')"
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
            <label>{{ $t('copilot.mcpServerConfigLabel') }}</label>
            <el-tooltip
              placement="top"
              :effect="currentTheme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="$t('copilot.mcpServerConfigTooltip')"
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
            <label>{{ $t('copilot.mcpConfiguredServersLabel') }}</label>
            <el-tooltip
              placement="top"
              :effect="currentTheme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="$t('copilot.mcpConfiguredServersTooltip')"
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
          <div class="no-servers">{{ $t('copilot.mcpNoServersConfigured') }}</div>
        </el-col>
      </el-row>

      <div v-else class="server-list">
        <el-card v-for="(server, name) in mcpConfig.mcpServers" :key="name" class="server-card" shadow="never">
          <div slot="header" class="server-header">
            <span class="server-name">{{ name }}</span>
            <div class="server-actions">
              <div class="server-enabled-switch" v-if="serverResults[name] && serverResults[name].success">
                <span class="enable-label">{{ $t('common.enable') }}</span>
                <el-switch
                  v-model="serverEnabledStatus[name]"
                  active-color="#13ce66"
                  inactive-color="#A2A9B0"
                  @change="(val) => handleServerEnabledChange(name, val)"
                >
                </el-switch>
              </div>
              <el-button
                size="mini"
                type="primary"
                :loading="testingServer === name"
                icon="el-icon-connection"
                @click="testServerConnection(name, server)"
              >
              </el-button>
              <el-button size="mini" type="danger" icon="el-icon-delete" @click="removeMCPServer(name)"></el-button>
            </div>
          </div>

          <div v-if="server.url" class="server-url">
            {{ server.url }}
            <el-button
              size="mini"
              type="text"
              icon="el-icon-document-copy"
              class="copy-btn"
              @click="copyText(server.url)"
              :title="$t('common.copy')"
            ></el-button>
          </div>
          <div v-else class="server-command">
            {{ server.command }} {{ server.args.join(' ') }}
            <el-button
              size="mini"
              type="text"
              icon="el-icon-document-copy"
              class="copy-btn"
              @click="copyText(server.command + ' ' + server.args.join(' '))"
              :title="$t('common.copy')"
            ></el-button>
          </div>

          <!-- Connection test results -->
          <div v-if="serverResults[name]" class="connection-results">
            <div
              class="connection-status"
              :class="{ success: serverResults[name].success, error: !serverResults[name].success }"
            >
              <i :class="serverResults[name].success ? 'el-icon-success' : 'el-icon-error'"></i>
              {{ serverResults[name].message }}
            </div>

            <div v-if="serverResults[name].tools && serverResults[name].tools.length > 0" class="tools-list">
              <div class="tools-header">{{ $t('copilot.mcpAvailableTools') }}</div>
              <div class="tools-container">
                <el-tag
                  v-for="(tool, index) in serverResults[name].tools"
                  :key="index"
                  size="mini"
                  type="info"
                  effect="plain"
                  class="tool-tag"
                >
                  {{ tool.name }}
                </el-tag>
              </div>
            </div>
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
import { MCPConfig, MCPServer } from '@/types/mcp'
import { ipcRenderer } from 'electron'

/**
 * MCP Settings Component - Provides interface for users to configure Model Context Protocol servers
 * Completely independent component, doesn't rely on parent component for configuration
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
  private testingServer: string | null = null
  private serverResults: Record<string, any> = {}
  private serverEnabledStatus: Record<string, boolean> = {}

  /**
   * Lifecycle hook when component is created
   */
  created() {
    this.loadMCPConfig()
    this.loadServerResults()
    this.loadServerEnabledStatus()
  }

  /**
   * Load MCP configuration from main process
   */
  private async loadMCPConfig() {
    try {
      // Get MCP enabled status
      this.mcpEnabled = await ipcRenderer.invoke('mcp:get-enabled')

      // Get MCP configuration
      this.mcpConfig = await ipcRenderer.invoke('mcp:get-config')
      this.mcpConfigStr = JSON.stringify(this.mcpConfig, null, 2)

      // After loading config, immediately load results and status
      await this.loadServerResults()
      await this.loadServerEnabledStatus()
    } catch (error) {
      this.$log.error(`[MCP] Failed to load MCP configuration: ${error}`)
      this.mcpConfigError = this.$t('copilot.mcpFailedParseConfig').toString()
      this.mcpConfig = { mcpServers: {} }
      this.mcpConfigStr = JSON.stringify(this.mcpConfig, null, 2)
    }
  }

  /**
   * Load server test results from main process
   */
  private async loadServerResults() {
    // Iterate through all configured servers and load their test results
    if (this.mcpConfig && this.mcpConfig.mcpServers) {
      for (const serverName of Object.keys(this.mcpConfig.mcpServers)) {
        try {
          const results = await ipcRenderer.invoke('mcp:get-server-results', serverName)
          if (results) {
            this.$set(this.serverResults, serverName, results)
          }
        } catch (err) {
          this.$log.error(`[MCP] Failed to load test results for server ${serverName}: ${err}`)
        }
      }
    }
  }

  /**
   * Load server enabled status from main process
   */
  private async loadServerEnabledStatus() {
    // Iterate through all configured servers and load their enabled status
    if (this.mcpConfig && this.mcpConfig.mcpServers) {
      for (const serverName of Object.keys(this.mcpConfig.mcpServers)) {
        try {
          const enabled = await ipcRenderer.invoke('mcp:get-server-enabled', serverName)
          this.$set(this.serverEnabledStatus, serverName, enabled)
        } catch (err) {
          this.$log.error(`[MCP] Failed to load enabled status for server ${serverName}: ${err}`)
          // Default value is false, ensure each server has an enabled status
          this.$set(this.serverEnabledStatus, serverName, false)
        }
      }
    }
  }

  /**
   * Handle enable/disable MCP switch state change
   */
  private async handleMCPEnabledChange(value: boolean) {
    try {
      this.mcpEnabled = value
      await ipcRenderer.invoke('mcp:set-enabled', value)
    } catch (error) {
      this.$log.error(`[MCP] Failed to set MCP enabled status: ${error}`)
      this.$message({
        type: 'error',
        message: this.$t('common.failed').toString(),
      })
    }
  }

  /**
   * Handle server enabled status change
   */
  private async handleServerEnabledChange(serverName: string, enabled: boolean) {
    try {
      this.$set(this.serverEnabledStatus, serverName, enabled)
      await ipcRenderer.invoke('mcp:set-server-enabled', serverName, enabled)

      if (enabled) {
        this.$log.info(`[MCP] Server ${serverName} enabled`)
        this.$message({
          message: `${serverName} ${this.$t('copilot.mcpServerTestSuccess').toString()}`,
          type: 'success',
        })
      } else {
        this.$log.info(`[MCP] Server ${serverName} disabled`)
        this.$message({
          message: `${serverName} ${this.$t('common.disable').toString()}`,
          type: 'info',
        })
      }
    } catch (error) {
      this.$log.error(`[MCP] Failed to set server enabled status: ${error}`)
      this.$message({
        type: 'error',
        message: this.$t('common.failed').toString(),
      })
    }
  }

  /**
   * Handle MCP configuration text change
   */
  private async handleMCPConfigChange(value: string) {
    this.mcpConfigStr = value
    this.mcpConfigError = ''

    try {
      const config = JSON.parse(value) as MCPConfig

      // Validate configuration format
      if (!config.mcpServers || typeof config.mcpServers !== 'object') {
        this.mcpConfigError = this.$t('copilot.mcpConfigError').toString()
        return
      }

      // Validate each server configuration
      for (const [name, server] of Object.entries(config.mcpServers)) {
        if (!server.url && (!server.command || !Array.isArray(server.args))) {
          this.mcpConfigError = this.$t('copilot.mcpServerConfigInvalid', [name]).toString()
          return
        }
      }

      // Find deleted servers
      const oldServerNames = Object.keys(this.mcpConfig.mcpServers || {})
      const newServerNames = Object.keys(config.mcpServers || {})
      const removedServers = oldServerNames.filter((name) => !newServerNames.includes(name))

      // Delete corresponding test results and enabled status
      for (const name of removedServers) {
        this.$delete(this.serverResults, name)
        this.$delete(this.serverEnabledStatus, name)
        await ipcRenderer.invoke('mcp:delete-server', name)
      }

      // Handle newly added servers
      for (const name of newServerNames) {
        if (!oldServerNames.includes(name)) {
          // Set default enabled status for new servers
          this.$set(this.serverEnabledStatus, name, false)
        }
      }

      // Configuration is valid, update state
      this.mcpConfig = config
      await ipcRenderer.invoke('mcp:set-config', value)
    } catch (error) {
      this.mcpConfigError = this.$t('copilot.mcpInvalidJsonFormat').toString()
    }
  }

  /**
   * Handle editor focus
   */
  private handleEditorFocus() {
    // Clear error message
    this.mcpConfigError = ''
  }

  /**
   * Test connection to specified MCP server
   */
  private async testServerConnection(serverName: string, serverConfig: MCPServer) {
    try {
      this.testingServer = serverName
      this.$log.info(`[MCP] Testing connection to server: ${serverName}`)

      // Call main process via IPC to test connection
      const result = await ipcRenderer.invoke('mcp:test-connection', serverConfig, serverName)

      // Save test results in component state
      this.$set(this.serverResults, serverName, result)

      if (result.success) {
        // If test is successful, enable the server by default
        this.$set(this.serverEnabledStatus, serverName, true)
        await ipcRenderer.invoke('mcp:set-server-enabled', serverName, true)

        this.$log.info(`[MCP] Successfully connected to server ${serverName}`)
        this.$message({
          message: `${this.$t('copilot.mcpServerTestSuccess').toString()}: ${serverName}`,
          type: 'success',
        })
      } else {
        // If test fails, disable the server
        this.$set(this.serverEnabledStatus, serverName, false)
        await ipcRenderer.invoke('mcp:set-server-enabled', serverName, false)

        this.$log.error(`[MCP] Failed to connect to server ${serverName}: ${result.message}`)
        this.$message({
          message: `${this.$t('copilot.mcpServerTestFailed').toString()}: ${serverName}: ${result.message}`,
          type: 'error',
        })
      }
    } catch (error) {
      this.$log.error(`[MCP] Error during connection test: ${error instanceof Error ? error.message : String(error)}`)
      this.$message({
        message: `${this.$t('copilot.mcpConnectionFailed', [serverName]).toString()}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        type: 'error',
      })
    } finally {
      this.testingServer = null
    }
  }

  /**
   * Copy text to clipboard
   */
  private copyText(text: string) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()

    try {
      const successful = document.execCommand('copy')
      if (successful) {
        this.$log.info('[MCP] Text copied to clipboard')
        this.$message({
          message: this.$t('copilot.mcpCopySuccess').toString(),
          type: 'success',
          duration: 2000,
        })
      } else {
        this.$log.warn('[MCP] Copy failed, please select and copy manually')
        this.$message({
          message: this.$t('copilot.mcpCopyFailed').toString(),
          type: 'warning',
        })
      }
    } catch (err) {
      this.$log.warn(`[MCP] Copy failed: ${err}`)
      this.$message({
        message: this.$t('copilot.mcpCopyFailed').toString(),
        type: 'warning',
      })
    }

    document.body.removeChild(textArea)
  }

  /**
   * Remove specified MCP server
   */
  private async removeMCPServer(name: string) {
    if (this.mcpConfig.mcpServers && this.mcpConfig.mcpServers[name]) {
      this.$confirm(this.$t('copilot.mcpDeleteConfirm', [name]).toString(), {
        type: 'warning',
      })
        .then(async () => {
          try {
            // Delete server via main process
            await ipcRenderer.invoke('mcp:delete-server', name)

            // Update local config
            delete this.mcpConfig.mcpServers[name]
            this.mcpConfigStr = JSON.stringify(this.mcpConfig, null, 2)
            await ipcRenderer.invoke('mcp:set-config', this.mcpConfigStr)

            // Clean up UI state
            this.$delete(this.serverResults, name)
            this.$delete(this.serverEnabledStatus, name)

            this.$log.info(`[MCP] Successfully deleted server ${name}`)
            this.$message({
              type: 'success',
              message: this.$t('common.deleteSuccess').toString(),
            })
          } catch (error) {
            this.$log.error(`[MCP] Error deleting server: ${error}`)
            this.$message({
              type: 'error',
              message: this.$t('common.deleteFailed').toString(),
            })
          }
        })
        .catch(() => {
          // User cancelled delete operation
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
      border-radius: 8px;

      &.is-error {
        border-color: var(--color-minor-red);
      }
    }

    .mcp-config-error {
      color: var(--color-minor-red);
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

  .server-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .server-enabled-switch {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 8px;

    .enable-label {
      font-size: 13px;
      color: var(--color-text-light);
      white-space: nowrap;
    }
  }

  .server-name {
    font-weight: bold;
    color: var(--color-text-title);
    font-size: 14px;
  }

  .server-url,
  .server-command {
    font-family: Menlo, Monaco, 'Courier New', monospace;
    font-size: 12px;
    color: var(--color-text-default);
    line-height: 1.5;
    word-break: break-all;
    background-color: var(--color-bg-lighter);
    padding: 8px;
    border-radius: 8px;
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

  .connection-results {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed var(--color-border-default);

    .connection-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      position: relative;

      &.success {
        background-color: rgba(19, 206, 102, 0.1);
        color: #13ce66;
      }

      &.error {
        background-color: rgba(245, 108, 108, 0.1);
        color: #f56c6c;
      }
    }

    .tools-list {
      margin-top: 12px;

      .tools-header {
        margin-bottom: 8px;
        color: var(--color-text-title);
      }

      .tools-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }

      .tool-tag {
        margin-right: 0;
        font-family: Menlo, Monaco, 'Courier New', monospace;
        font-size: 12px;
      }
    }
  }
}
</style>
