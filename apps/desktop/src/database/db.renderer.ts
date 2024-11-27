import { drizzle } from 'drizzle-orm/sqlite-proxy'
import { posts } from './schemas/posts'

export const database = drizzle(async (...args) => {
  try {
    const result = await window.api.execute(...args)
    return { rows: result }
  } catch (e: any) {
    console.error('Error from sqlite proxy server: ', e.response.data)
    return { rows: [] }
  }
}, {
  schema: { posts },
})
