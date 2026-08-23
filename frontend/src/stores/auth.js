import { defineStore } from 'pinia'
import { authAPI } from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    admin: null,
    token: localStorage.getItem('auth_token') || null,
    needsSetup: false,
    loading: false
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.admin
  },
  
  actions: {
    async checkSetup() {
      try {
        const response = await authAPI.checkSetup()
        this.needsSetup = response.data?.data?.needs_setup || false
        return this.needsSetup
      } catch (error) {
        console.error('Failed to check setup:', error)
        return false
      }
    },
    
    async setup(credentials) {
      this.loading = true
      try {
        const response = await authAPI.setup(credentials)
        const { token, admin } = response.data.data
        this.setAuth(token, admin)
        this.needsSetup = false
        return { success: true }
      } catch (error) {
        return { 
          success: false, 
          message: error.response?.data?.message || 'Setup failed'
        }
      } finally {
        this.loading = false
      }
    },
    
    async login(credentials) {
      this.loading = true
      try {
        const response = await authAPI.login(credentials)
        const { token, admin } = response.data.data
        this.setAuth(token, admin)
        return { success: true }
      } catch (error) {
        return { 
          success: false, 
          message: error.response?.data?.message || 'Login failed'
        }
      } finally {
        this.loading = false
      }
    },
    
    async logout() {
      try {
        await authAPI.logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearAuth()
      }
    },
    
    async checkAuth() {
      if (!this.token) return false
      
      try {
        const response = await authAPI.verify()
        this.admin = response.data.data.admin
        return true
      } catch (error) {
        this.clearAuth()
        return false
      }
    },
    
    setAuth(token, admin) {
      this.token = token
      this.admin = admin
      localStorage.setItem('auth_token', token)
    },
    
    clearAuth() {
      this.token = null
      this.admin = null
      localStorage.removeItem('auth_token')
    }
  }
})
