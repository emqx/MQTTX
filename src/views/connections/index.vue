<template>
  <div>
    <leftbar>
      <LeftTopbar/>
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
import LeftTopbar from './LeftTopbar.vue'
import LeftList from './LeftList.vue'
import RightTopbar from './RightTopbar.vue'

@Component({
  components: {
    Leftbar,
    LeftTopbar,
    LeftList,
    RightTopbar,
  },
})
export default class Connections extends Vue {}
</script>
