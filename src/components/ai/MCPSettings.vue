<!-- src/components/ai/MCPSettings.vue -->
<template>
  <div class="settings-mcp">
    <div class="settings-title">MCP (Model Context Protocol)</div>

    <el-divider></el-divider>

    <el-row class="settings-item" type="flex" justify="space-between">
      <el-col :span="20">
        <label>Enable MCP</label>
        <el-tooltip
          placement="top"
          :effect="currentTheme !== 'light' ? 'light' : 'dark'"
          :open-delay="500"
          :content="'Enable MCP to let AI use external tools and services'"
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
            <label>MCP Server Configuration</label>
            <el-tooltip
              placement="top"
              :effect="currentTheme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="'Configure MCP servers in JSON format, supports multiple servers'"
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
            <label>Configured MCP Servers</label>
            <el-tooltip
              placement="top"
              :effect="currentTheme !== 'light' ? 'light' : 'dark'"
              :open-delay="500"
              :content="'Display list of currently configured MCP servers'"
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
          <div class="no-servers">No MCP servers configured yet</div>
        </el-col>
      </el-row>

      <div v-else class="server-list">
        <el-card v-for="(server, name) in mcpConfig.mcpServers" :key="name" class="server-card" shadow="never">
          <div slot="header" class="server-header">
            <span class="server-name">{{ name }}</span>
            <div class="server-actions">
              <el-button
                size="mini"
                type="primary"
                :loading="testingServer === name"
                icon="el-icon-connection"
                @click="testServerConnection(name, server)"
                >Test Connection</el-button
              >
              <el-button size="mini" type="danger" icon="el-icon-delete" @click="removeMCPServer(name)"></el-button>
            </div>
          </div>

          <div class="server-command">
            {{ server.command }} {{ server.args.join(' ') }}
            <el-button
              size="mini"
              type="text"
              icon="el-icon-document-copy"
              class="copy-btn"
              @click="copyCommand(server.command + ' ' + server.args.join(' '))"
              title="Copy Command"
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

              <!-- Enable/disable switch for successfully tested servers -->
              <div v-if="serverResults[name].success" class="server-enabled-switch">
                <span class="enable-label">Enable:</span>
                <el-switch
                  v-model="serverEnabledStatus[name]"
                  active-color="#13ce66"
                  inactive-color="#A2A9B0"
                  @change="(val) => handleServerEnabledChange(name, val)"
                >
                </el-switch>
              </div>
            </div>

            <div v-if="serverResults[name].tools && serverResults[name].tools.length > 0" class="tools-list">
              <div class="tools-header">Available Tools:</div>
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
   * Load MCP configuration from local storage
   */
  private loadMCPConfig() {
    const storedConfig = localStorage.getItem('mcpConfig')

    if (storedConfig) {
      try {
        this.mcpConfig = JSON.parse(storedConfig)
        this.mcpConfigStr = JSON.stringify(this.mcpConfig, null, 2)
      } catch (error) {
        console.error('Failed to parse MCP configuration:', error)
        this.mcpConfigError = 'Failed to parse stored configuration, reset to default'
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
   * Load server test results from local storage
   */
  private loadServerResults() {
    // Iterate through all configured servers and load their test results
    if (this.mcpConfig && this.mcpConfig.mcpServers) {
      for (const serverName of Object.keys(this.mcpConfig.mcpServers)) {
        const storedResult = localStorage.getItem(`mcpServerResult:${serverName}`)
        if (storedResult) {
          try {
            const parsedResult = JSON.parse(storedResult)
            this.$set(this.serverResults, serverName, parsedResult)
          } catch (err) {
            console.error(`Failed to parse test result for server ${serverName}:`, err)
          }
        }
      }
    }
  }

  /**
   * Load server enabled status from local storage
   */
  private loadServerEnabledStatus() {
    // Iterate through all configured servers and load their enabled status
    if (this.mcpConfig && this.mcpConfig.mcpServers) {
      for (const serverName of Object.keys(this.mcpConfig.mcpServers)) {
        const storedStatus = localStorage.getItem(`mcpServerEnabled:${serverName}`)
        if (storedStatus !== null) {
          this.$set(this.serverEnabledStatus, serverName, storedStatus === 'true')
        } else {
          // Default value is false, ensure each server has an enabled status
          this.$set(this.serverEnabledStatus, serverName, false)
        }
      }
    }
  }

  /**
   * Handle enable/disable MCP switch state change
   */
  private handleMCPEnabledChange(value: boolean) {
    this.mcpEnabled = value
    localStorage.setItem('mcpEnabled', String(value))
  }

  /**
   * Handle server enabled status change
   */
  private handleServerEnabledChange(serverName: string, enabled: boolean) {
    this.$set(this.serverEnabledStatus, serverName, enabled)
    localStorage.setItem(`mcpServerEnabled:${serverName}`, String(enabled))

    if (enabled) {
      this.$message({
        message: `Server ${serverName} enabled`,
        type: 'success',
      })
    } else {
      this.$message({
        message: `Server ${serverName} disabled`,
        type: 'info',
      })
    }
  }

  /**
   * Handle MCP configuration text change
   */
  private handleMCPConfigChange(value: string) {
    this.mcpConfigStr = value
    this.mcpConfigError = ''

    try {
      const config = JSON.parse(value) as MCPConfig

      // Validate configuration format
      if (!config.mcpServers || typeof config.mcpServers !== 'object') {
        this.mcpConfigError = 'Configuration must include mcpServers object'
        return
      }

      // Validate each server configuration
      for (const [name, server] of Object.entries(config.mcpServers)) {
        if (!server.command || !Array.isArray(server.args)) {
          this.mcpConfigError = `Server "${name}" configuration is invalid, must include command and args array`
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
        localStorage.removeItem(`mcpServerResult:${name}`)
        localStorage.removeItem(`mcpServerEnabled:${name}`)
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
      localStorage.setItem('mcpConfig', value)
    } catch (error) {
      this.mcpConfigError = 'Invalid JSON format'
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
      console.log(`Testing connection to server: ${serverName}`)

      // Call main process via IPC to test connection
      const result = await ipcRenderer.invoke('mcp:test-connection', serverConfig, serverName)

      // Save test results
      this.$set(this.serverResults, serverName, result)

      // Persist test results
      localStorage.setItem(`mcpServerResult:${serverName}`, JSON.stringify(result))

      if (result.success) {
        // If test is successful, enable the server by default
        this.$set(this.serverEnabledStatus, serverName, true)
        localStorage.setItem(`mcpServerEnabled:${serverName}`, 'true')

        this.$message({
          message: `Successfully connected to server ${serverName}`,
          type: 'success',
        })

        // Disconnect after testing
        try {
          await ipcRenderer.invoke('mcp:disconnect', serverName)
        } catch (disconnectError) {
          console.error(`Failed to disconnect:`, disconnectError)
        }
      } else {
        // If test fails, disable the server
        this.$set(this.serverEnabledStatus, serverName, false)
        localStorage.setItem(`mcpServerEnabled:${serverName}`, 'false')

        this.$message({
          message: `Failed to connect to server ${serverName}: ${result.message}`,
          type: 'error',
        })
      }
    } catch (error) {
      console.error(`Error during connection test:`, error)

      const errorResult = {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      }

      this.$set(this.serverResults, serverName, errorResult)
      localStorage.setItem(`mcpServerResult:${serverName}`, JSON.stringify(errorResult))

      // Disable server when error occurs
      this.$set(this.serverEnabledStatus, serverName, false)
      localStorage.setItem(`mcpServerEnabled:${serverName}`, 'false')

      this.$message({
        message: `Error during connection test: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error',
      })
    } finally {
      this.testingServer = null
    }
  }

  /**
   * Copy command to clipboard
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
          message: 'Command copied to clipboard',
          type: 'success',
          duration: 2000,
        })
      } else {
        this.$message({
          message: 'Copy failed, please select and copy manually',
          type: 'warning',
        })
      }
    } catch (err) {
      this.$message({
        message: 'Copy failed, please select and copy manually',
        type: 'warning',
      })
    }

    document.body.removeChild(textArea)
  }

  /**
   * Remove specified MCP server
   */
  private removeMCPServer(name: string) {
    if (this.mcpConfig.mcpServers && this.mcpConfig.mcpServers[name]) {
      this.$confirm(`Are you sure you want to delete server "${name}"?`, 'Confirm', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning',
      })
        .then(async () => {
          // Disconnect first if connected
          if (this.serverResults[name] && this.serverResults[name].success) {
            try {
              await ipcRenderer.invoke('mcp:disconnect', name)
            } catch (error) {
              console.error(`Error disconnecting from server:`, error)
            }
          }

          // Delete server and update configuration
          delete this.mcpConfig.mcpServers[name]
          this.mcpConfigStr = JSON.stringify(this.mcpConfig, null, 2)
          localStorage.setItem('mcpConfig', this.mcpConfigStr)

          // Delete test results and enabled status
          this.$delete(this.serverResults, name)
          this.$delete(this.serverEnabledStatus, name)
          localStorage.removeItem(`mcpServerResult:${name}`)
          localStorage.removeItem(`mcpServerEnabled:${name}`)

          this.$message({
            type: 'success',
            message: 'Successfully deleted!',
          })
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
      border-radius: 4px;

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
      border-radius: 4px;
      position: relative;

      &.success {
        background-color: rgba(19, 206, 102, 0.1);
        color: #13ce66;
      }

      &.error {
        background-color: rgba(245, 108, 108, 0.1);
        color: #f56c6c;
      }

      .server-enabled-switch {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 8px;

        .enable-label {
          font-size: 13px;
          color: var(--color-text-light);
        }
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
