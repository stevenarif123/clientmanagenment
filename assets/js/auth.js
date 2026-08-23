/**
 * Reactive Auth State Store
 */

const { reactive } = Vue;

window.Auth = reactive({
  admin: null,
  token: localStorage.getItem('auth_token') || null,
  needsSetup: false,
  loading: false,

  get isAuthenticated() {
    return !!this.token && !!this.admin;
  },

  async checkSetup() {
    try {
      const response = await window.API.auth.checkSetup();
      this.needsSetup = response.data?.data?.needs_setup || false;
      return this.needsSetup;
    } catch (error) {
      console.error('Failed to check setup:', error);
      return false;
    }
  },

  async setup(credentials) {
    this.loading = true;
    try {
      const response = await window.API.auth.setup(credentials);
      const { token, admin } = response.data.data;
      this.setAuth(token, admin);
      this.needsSetup = false;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Setup failed'
      };
    } finally {
      this.loading = false;
    }
  },

  async login(credentials) {
    this.loading = true;
    try {
      const response = await window.API.auth.login(credentials);
      const { token, admin } = response.data.data;
      this.setAuth(token, admin);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    } finally {
      this.loading = false;
    }
  },

  async logout() {
    try {
      await window.API.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
      window.location.hash = '#/login';
    }
  },

  async checkAuth() {
    if (!this.token) {
      this.clearAuth();
      return false;
    }

    try {
      const response = await window.API.auth.verify();
      this.admin = response.data.data.admin;
      return true;
    } catch (error) {
      this.clearAuth();
      return false;
    }
  },

  setAuth(token, admin) {
    this.token = token;
    this.admin = admin;
    localStorage.setItem('auth_token', token);
  },

  clearAuth() {
    this.token = null;
    this.admin = null;
    localStorage.removeItem('auth_token');
  }
});
