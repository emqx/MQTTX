import { v4 as uuidv4 } from 'uuid'

export const add = (a: number, b: number) => {
  return a + b
}

export const subtract = (a: number, b: number) => {
  return a - b
}

export const getMessageId = () => `message_${uuidv4()}` as string

export type AddFunc = typeof add
export type SubtractFunc = typeof subtract
