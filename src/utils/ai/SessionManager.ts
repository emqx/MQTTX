import { loadSystemPrompt } from './copilot'
// Language type is globally defined
// No need to explicitly import Language type

/**
 * Session state interface
 */
export interface SessionState {
  systemPrompt: string // Current system prompt for the session
  presetPrompt: string // Current preset prompt being used
  isNewSession: boolean // Whether this is a new session
  lastPresetChangeTime: number // Timestamp of the last preset change
}

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
    this.state.systemPrompt = '' // Force system prompt reload
  }

  /**
   * Get system prompt for current session
   * Reloads if necessary
   */
  public getSystemPrompt(language: Language): string {
    // Reload system prompt if new session or empty
    if (this.state.isNewSession || !this.state.systemPrompt) {
      this.loadSystemPrompt(language)
    }
    return this.state.systemPrompt
  }

  /**
   * Load system prompt for current session
   */
  private loadSystemPrompt(language: Language): void {
    this.state.systemPrompt = loadSystemPrompt(language, this.state.presetPrompt)
    this.state.isNewSession = false
  }
}
