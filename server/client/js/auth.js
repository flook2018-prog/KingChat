// Authentication utilities
class AuthManager {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = this.getStoredUser();
  }

  // Get stored user data
  getStoredUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  // Store authentication data
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
  }

  // Clear authentication data
  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Check if user has specific role
  hasRole(role) {
    return this.user && this.user.role === role;
  }

  // Check if user has specific permission
  hasPermission(permission) {
    return this.user && this.user.permissions && this.user.permissions[permission];
  }

  // Get authorization header
  getAuthHeader() {
    return this.token ? `Bearer ${this.token}` : null;
  }

  // Get token (for compatibility)
  getToken() {
    return this.token;
  }

  // Redirect to login if not authenticated
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  // Logout and redirect
  logout() {
    this.clearAuth();
    window.location.href = 'login.html';
  }
}

// Global auth manager instance
window.auth = new AuthManager();

// Also create global reference for backward compatibility
const auth = window.auth;

// Global logout function
function logout() {
  window.auth.logout();
}