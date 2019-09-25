import Vue from 'vue'

declare module '*.vue' {
  export default Vue
}

declare global {
  type VueForm = Vue & {
    validate: (validate: (valid: boolean) => void) => void,
    clearValidate: () => void,
    resetFields: () => void,
  }
}
