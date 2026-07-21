<template>
  <AuthLayout>
    <LoginPanel show-registration-link />
  </AuthLayout>
</template>

<script setup lang="ts">
import LoginPanel from '@/components/auth/LoginPanel.vue'
import { AuthLayout } from '@/components/layout'
</script>
