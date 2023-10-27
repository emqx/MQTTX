import { type Ref, ref } from 'vue'
import type { Connection, ConnectionDetail } from 'mqttx'

export default function useMockData(): {
  connections: Ref<Connection[]>
  getMockConnectionDetail: (id: string) => ConnectionDetail
  getFirstConnectionId: () => string | null
} {
  const connections = ref<Array<Connection>>(generateMockConnections())

  function generateMockConnections(count = 10): Connection[] {
    const mockConnections: Array<Connection> = []

    for (let i = 1; i <= count; i++) {
      mockConnections.push({
        id: i.toString(),
        name: `Mocked Connection ${i}`,
      })
    }

    return mockConnections
  }

  function getMockConnectionDetail(id: string): ConnectionDetail {
    const details = {
      id,
      name: `Mocked Connection ${id}`,
      host: 'localhost',
      port: 1883,
      username: `user_${id}`,
      password: `pass_${id}`,
      lastConnected: new Date().toISOString(),
      topics: [`topic_${id}_1`, `topic_${id}_2`, `topic_${id}_3`],
    }

    return details
  }

  function getFirstConnectionId(): string | null {
    return connections.value[0]?.id || null
  }

  return {
    connections,
    getMockConnectionDetail,
    getFirstConnectionId,
  }
}
