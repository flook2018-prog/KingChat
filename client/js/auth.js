// Authentication utilities
console.log('🔐 Loading auth.js...');

class AuthManager {
  constructor() {
    console.log('🔐 AuthManager constructor');
    // Try both token keys for compatibility
    this.token = localStorage.getItem('authToken') || localStorage.getItem('token');
    this.user = this.getStoredUser();
    console.log('🔐 Token found:', !!this.token);
    console.log('🔐 User found:', !!this.user);
    
    // Additional debug info
    if (this.token) {
      console.log('🔐 Token source:', localStorage.getItem('authToken') ? 'authToken' : 'token');
    }
    if (this.user) {
      console.log('🔐 User source:', localStorage.getItem('userData') ? 'userData' : 'currentUser');
      console.log('🔐 User role:', this.user.role);
    }
  }

  // Get stored user data
  getStoredUser() {
    // Try both storage keys for compatibility
    let userData = localStorage.getItem('userData');
    if (!userData) {
      userData = localStorage.getItem('currentUser');
    }
    
    try {
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }

  // Store authentication data
  setAuth(token, user) {
    console.log('🔐 Setting auth data:', { token: !!token, user: !!user });
    this.token = token;
    this.user = user;
    // Store in both formats for maximum compatibility
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  // Clear authentication data
  clearAuth() {
    console.log('🔐 Clearing auth data');
    this.token = null;
    this.user = null;
    // Clear all possible storage keys
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginMode');
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
      console.log('🔐 Authentication required, redirecting to login');
      window.location.href = 'login-fixed.html';
      return false;
    }
    return true;
  }

  // Logout and redirect
  logout() {
    console.log('🔐 Logging out user');
    this.clearAuth();
    window.location.href = 'login-fixed.html';
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