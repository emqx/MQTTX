import { MessageType } from '../connections/types'

export interface ScriptModel {
  id?: string
  name: string
  script: string
}

export interface ScriptState {
  apply: MessageType
  content: ScriptModel | null
}
