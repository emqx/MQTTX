import { expect } from 'chai'
import { SessionManager } from '@/utils/ai/SessionManager'

describe('SessionManager', () => {
  let sessionManager: SessionManager

  beforeEach(() => {
    // Create a new SessionManager instance before each test
    sessionManager = new SessionManager()
  })

  describe('getState', () => {
    it('should return a copy of the state', () => {
      const state = sessionManager.getState()

      // Verify that it returns an object
      expect(state).to.be.an('object')

      // Verify that the returned state contains expected properties
      expect(state).to.have.property('systemPrompt')
      expect(state).to.have.property('isNewSession')
      expect(state).to.have.property('presetPrompt')

      // Modifying the returned state should not affect the original state
      state.isNewSession = false
      expect(sessionManager.getState().isNewSession).to.be.true
    })
  })

  describe('resetSession', () => {
    it('should reset the session to initial values', () => {
      // First modify the session state
      sessionManager.startSession()
      sessionManager.updatePreset('test-preset')

      // Then reset
      sessionManager.resetSession()

      // Verify the state has been reset
      const state = sessionManager.getState()
      expect(state.isNewSession).to.be.true
      expect(state.systemPrompt).to.equal('')
      expect(state.presetPrompt).to.equal('')
    })
  })

  describe('resetSessionKeepPreset', () => {
    it('should reset the session while keeping preset prompt', () => {
      // First modify the session state
      sessionManager.startSession()
      sessionManager.updatePreset('test-preset')

      // Then reset, but keep the preset prompt
      sessionManager.resetSessionKeepPreset()

      // Verify the state has been reset, but preset prompt is retained
      const state = sessionManager.getState()
      expect(state.isNewSession).to.be.true
      expect(state.systemPrompt).to.equal('')
      expect(state.presetPrompt).to.equal('test-preset')
    })
  })

  describe('startSession', () => {
    it('should mark the session as not new', () => {
      // Initially isNewSession should be true
      expect(sessionManager.getState().isNewSession).to.be.true

      // Start the session
      sessionManager.startSession()

      // Verify isNewSession becomes false
      expect(sessionManager.getState().isNewSession).to.be.false
    })

    it('should not affect other state properties', () => {
      // Set some initial state
      sessionManager.updatePreset('test-preset')

      // Record the current system prompt state
      const initialSystemPrompt = sessionManager.getState().systemPrompt

      // Start the session
      sessionManager.startSession()

      // Verify only the isNewSession property was modified
      const state = sessionManager.getState()
      expect(state.systemPrompt).to.equal(initialSystemPrompt)
      expect(state.presetPrompt).to.equal('test-preset')
    })
  })

  describe('updatePreset', () => {
    it('should update the preset prompt', () => {
      sessionManager.updatePreset('new-preset')

      expect(sessionManager.getState().presetPrompt).to.equal('new-preset')
    })

    it('should mark the session as new', () => {
      // First mark the session as not new
      sessionManager.startSession()
      expect(sessionManager.getState().isNewSession).to.be.false

      // Update the preset prompt
      sessionManager.updatePreset('new-preset')

      // Verify the session is marked as new
      expect(sessionManager.getState().isNewSession).to.be.true
    })

    it('should clear the system prompt', () => {
      // Simulate having an existing system prompt
      sessionManager.getSystemPrompt('en')
      expect(sessionManager.getState().systemPrompt).to.not.equal('')

      // Update the preset prompt
      sessionManager.updatePreset('new-preset')

      // Verify the system prompt is cleared
      expect(sessionManager.getState().systemPrompt).to.equal('')
    })
  })

  describe('getSystemPrompt', () => {
    it('should load system prompt if session is new', () => {
      // Using sinon would encounter import issues, so we simply test behavior here
      const result = sessionManager.getSystemPrompt('en')

      // Verify it returned a non-empty string
      expect(result).to.be.a('string')
      expect(result).to.not.equal('')

      // Verify the state was updated
      expect(sessionManager.getState().systemPrompt).to.equal(result)
    })

    it('should return cached system prompt if session is not new', () => {
      // Get the system prompt for the first time
      const firstPrompt = sessionManager.getSystemPrompt('en')

      // Mark the session as not new
      sessionManager.startSession()

      // Get the system prompt again
      const secondPrompt = sessionManager.getSystemPrompt('en')

      // Verify the same prompt is returned
      expect(secondPrompt).to.equal(firstPrompt)
    })

    it('should reload system prompt if empty even if session is not new', () => {
      // Get the system prompt for the first time
      sessionManager.getSystemPrompt('en')

      // Mark the session as not new
      sessionManager.startSession()

      // Manually clear the system prompt
      sessionManager['state'].systemPrompt = ''

      // Get the system prompt again
      const reloadedPrompt = sessionManager.getSystemPrompt('en')

      // Verify it returned a non-empty prompt
      expect(reloadedPrompt).to.be.a('string')
      expect(reloadedPrompt).to.not.equal('')
    })
  })
})
