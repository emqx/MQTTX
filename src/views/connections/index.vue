<template>
  <div>
    <leftbar>
      <SearchTopbar/>
      <ConnectionsList/>
    </leftbar>

    <div class="connections-view">
      <ConnectionsTopbar @click-subs="setSubsVisible"/>
      <ConnectionsContent/>
    </div>

    <SubscriptionsList ref="subscriptionsList" :subs-visible.sync="showSubs"/>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import Leftbar from '@/components/Leftbar.vue'
import SearchTopbar from '@/components/SearchTopbar.vue'
import ConnectionsList from './ConnectionsList.vue'
import ConnectionsTopbar from './ConnectionsTopbar.vue'
import ConnectionsContent from './ConnectionsContent.vue'
import SubscriptionsList from './SubscriptionsList.vue'

@Component({
  components: {
    Leftbar,
    SearchTopbar,
    ConnectionsList,
    ConnectionsTopbar,
    ConnectionsContent,
    SubscriptionsList,
  },
})
export default class Connections extends Vue {
  private showSubs: boolean = false

  private setSubsVisible(): void {
    this.showSubs = !this.showSubs
  }
}
</script>
