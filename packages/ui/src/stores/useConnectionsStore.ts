import { ref } from 'vue'
import { defineStore } from 'pinia'

const connectionsStoreSetup = () => {
  const count = ref(0)
  function increment() {
    count.value += 1
  }

  return { count, increment }
}

export const useConnectionsStore = defineStore('connections', connectionsStoreSetup)
