<script setup lang="ts"></script>

<template>
  <div class="leftbar w-[120px] mx-3 p-3 border-solid">
    <h2 class="mb-3">Menus</h2>
    <router-link to="/connections" class="text-green-primary">Connections</router-link>
  </div>
</template>

<style lang="scss">
.leftbar {
  width: 120px;
  h2 {
    margin-bottom: 12px;
  }
}
</style>
