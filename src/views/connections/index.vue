<template>
  <div>
    <leftbar>
      <SearchTopbar/>
      <LeftList/>
    </leftbar>

    <div class="connections-view right-content">
      <RightTopbar/>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Leftbar from '@/components/Leftbar.vue'
import SearchTopbar from '@/components/SearchTopbar.vue'
import LeftList from './LeftList.vue'
import RightTopbar from './RightTopbar.vue'

@Component({
  components: {
    Leftbar,
    SearchTopbar,
    LeftList,
    RightTopbar,
  },
})
export default class Connections extends Vue {}
</script>
