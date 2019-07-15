<template>
  <div>
    <Leftbar>
      <SearchTopbar/>
      <BrokersList/>
    </Leftbar>

    <div class="brokers-view right-content">
      <div class="titlebar">Brokers</div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Leftbar from '@/components/Leftbar.vue'
import SearchTopbar from '@/components/SearchTopbar.vue'
import BrokersList from './BrokersList.vue'

@Component({
  components: {
    Leftbar,
    SearchTopbar,
    BrokersList,
  },
})
export default class Brokers extends Vue {}
</script>
