<script setup lang="ts">
import type { SelectPosts } from '../../../database/schemas/posts'
import { database } from '../../../database/db.renderer'
import { posts } from '../../../database/schemas/posts'

const postList = ref<SelectPosts[]>([])

async function insertMockData() {
  await database.delete(posts).execute()
  await database.insert(posts).values([
    {
      title: 'Hello World',
    },
    {
      title: 'Hello World 2',
    },
  ])
}

insertMockData().then(() => {
  console.log('Mock data inserted')
  database.query.posts.findMany().then((result) => {
    console.log(result)
    postList.value = result
  })
})
</script>

<template>
  <!-- <SettingsView /> -->
  TODO: Implement desktop database settings
  <pre>
    {{ postList }}
  </pre>
</template>
