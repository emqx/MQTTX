<template>
  <div class="cloud-route"></div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

// Home keeps the Cloud view mounted; this route only selects its visibility.
@Component
export default class CloudRoute extends Vue {}
</script>
