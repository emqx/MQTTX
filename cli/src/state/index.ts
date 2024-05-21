const state = {
  configs: null as ConfigModel | null,

  setConfigs(configs: ConfigModel) {
    this.configs = configs
  },

  getConfigs(): ConfigModel | null {
    return this.configs
  },

  getConfig(key: keyof ConfigModel | keyof ConfigModel['mqtt']): any {
    if (this.configs) {
      if (key in this.configs) {
        return this.configs[key as keyof ConfigModel]
      }
      if (key in this.configs.mqtt) {
        return this.configs.mqtt[key as keyof ConfigModel['mqtt']]
      }
    }
    return null
  },
}

export default state
