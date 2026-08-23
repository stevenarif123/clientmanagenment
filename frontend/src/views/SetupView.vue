<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full mx-4">
      <div class="card">
        <div class="card-body">
          <div class="text-center mb-8">
            <h1 class="text-2xl font-bold text-gray-900">Welcome!</h1>
            <p class="mt-2 text-gray-600">Create your admin account to get started</p>
          </div>
          
          <form @submit.prevent="handleSetup" class="space-y-6">
            <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {{ error }}
            </div>
            
            <div>
              <label for="username" class="label">Username</label>
              <input
                id="username"
                v-model="form.username"
                type="text"
                required
                class="input"
                placeholder="Choose a username"
              />
            </div>
            
            <div>
              <label for="email" class="label">Email (optional)</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="input"
                placeholder="Your email address"
              />
            </div>
            
            <div>
              <label for="password" class="label">Password</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                required
                minlength="6"
                class="input"
                placeholder="Create a password (min 6 characters)"
              />
            </div>
            
            <div>
              <label for="confirmPassword" class="label">Confirm Password</label>
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                required
                class="input"
                placeholder="Confirm your password"
              />
            </div>
            
            <button
              type="submit"
              :disabled="authStore.loading"
              class="btn btn-primary w-full"
            >
              <span v-if="authStore.loading">Creating Account...</span>
              <span v-else>Create Account</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const error = ref('')

const handleSetup = async () => {
  error.value = ''
  
  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }
  
  if (form.password.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  
  const result = await authStore.setup({
    username: form.username,
    email: form.email || undefined,
    password: form.password
  })
  
  if (result.success) {
    router.push('/')
  } else {
    error.value = result.message
  }
}
</script>
