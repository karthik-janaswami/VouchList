<template>
  <NavBar />
  <main>
    <RouterView />
  </main>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
</script>

<style>
main { min-height: 100vh; }
</style>
