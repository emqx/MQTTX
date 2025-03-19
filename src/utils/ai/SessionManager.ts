import { SessionState } from '@/types/copilot'
import { loadSystemPrompt } from './copilot'
import { loadEnabledMCPServers } from './mcp'

/**
 * Copilot Session Manager
 *
 * Manages conversation session state including system prompts, preset selection, and session lifecycle
 */
export class SessionManager {
  private state: SessionState = {
    systemPrompt: '',
    presetPrompt: '',
    isNewSession: true,
    lastPresetChangeTime: 0,
    mcpData: undefined,
  }

  /**
   * Get current session state
   */
  public getState(): SessionState {
    return { ...this.state }
  }

  /**
   * Reset session state
   */
  public resetSession(): void {
    this.state = {
      systemPrompt: '',
      presetPrompt: '',
      isNewSession: true,
      lastPresetChangeTime: 0,
      mcpData: undefined,
    }
  }

  /**
   * Reset session while preserving preset
   * Useful for language switching scenarios
   */
  public resetSessionKeepPreset(): void {
    const currentPreset = this.state.presetPrompt
    this.resetSession()
    this.state.presetPrompt = currentPreset
  }

  /**
   * Mark session as started
   * Called when sending the first message
   */
  public startSession(): void {
    this.state.isNewSession = false
  }

  /**
   * Update session preset prompt
   */
  public updatePreset(preset: string): void {
    this.state.presetPrompt = preset
    this.state.isNewSession = true
    this.state.lastPresetChangeTime = Date.now()
    this.state.systemPrompt = ''
    this.state.mcpData = undefined
  }

  /**
   * Load MCP data
   */
  public async loadMCPData(): Promise<void> {
    this.state.mcpData = await loadEnabledMCPServers()
  }

  /**
   * Get system prompt for current session
   * Reloads if necessary
   */
  public async getSystemPrompt(language: Language): Promise<string> {
    // Reload system prompt if new session or empty
    if (this.state.isNewSession || !this.state.systemPrompt) {
      await this.loadSystemPrompt(language)
    }
    return this.state.systemPrompt
  }

  /**
   * Load system prompt for current session
   */
  private async loadSystemPrompt(language: Language): Promise<void> {
    const mcpData = this.getState().mcpData
    if (!mcpData) {
      await this.loadMCPData()
    }
    this.state.systemPrompt = loadSystemPrompt(language, this.state.presetPrompt, this.state.mcpData)
    this.state.isNewSession = false
  }
}
