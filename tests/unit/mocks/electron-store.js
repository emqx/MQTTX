// Keep service tests independent of the user's Electron settings.
module.exports = class Store {
  constructor() {
    this.values = new Map()
  }
  get(key, fallback) {
    return this.values.has(key) ? this.values.get(key) : fallback
  }
  set(key, value) {
    this.values.set(key, value)
  }
}
