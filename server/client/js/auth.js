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
    const token = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    const loginTime = localStorage.getItem('loginTime');
    
    // Check if token exists and is recent (within 24 hours)
    if (token && currentUser && loginTime) {
      const timeDiff = Date.now() - parseInt(loginTime);
      if (timeDiff < 24 * 60 * 60 * 1000) { // 24 hours
        return true;
      }
    }
    
    return false;
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
      // Prevent redirect loop by checking current page
      if (!window.location.pathname.includes('login')) {
        console.log('Not authenticated, redirecting to login...');
        window.location.href = '/login.html#no-redirect';
      }
      return false;
    }
    return true;
  }

  // Logout and redirect
  logout() {
    this.clearAuth();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginMode');
    localStorage.removeItem('loginTime');
    console.log('Logged out, redirecting to login...');
    window.location.href = '/login.html';
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