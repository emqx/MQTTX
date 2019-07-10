<template>
  <div>
    <leftbar>
      <SearchTopbar/>
      <ConnectionsList/>
    </leftbar>

    <div class="connections-view">
      <ConnectionsTopbar/>
      <ConnectionsContent/>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Leftbar from '@/components/Leftbar.vue'
import SearchTopbar from '@/components/SearchTopbar.vue'
import ConnectionsList from './ConnectionsList.vue'
import ConnectionsTopbar from './ConnectionsTopbar.vue'
import ConnectionsContent from './ConnectionsContent.vue'

@Component({
  components: {
    Leftbar,
    SearchTopbar,
    ConnectionsList,
    ConnectionsTopbar,
    ConnectionsContent,
  },
})
export default class Connections extends Vue {}
</script>
