// Login Page JavaScript

// Check if global instances already exist, if not create them
if (!window.api) {
  window.api = new APIClient();
}
if (!window.auth) {
  window.auth = new AuthManager();
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('Login page loaded');
  console.log('API instance:', window.api);
  console.log('Auth instance:', window.auth);
  
  // Check if already logged in
  if (window.auth.isAuthenticated()) {
    console.log('User already authenticated, redirecting...');
    window.location.href = '/dashboard.html';
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');
  const loginBtn = document.getElementById('loginBtn');
  const btnText = loginBtn.querySelector('.btn-text');
  const loadingSpinner = loginBtn.querySelector('.loading-spinner');

  // Handle form submission
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Hide previous messages
    hideMessages();

    // Show loading state
    setLoading(true);

    try {
      console.log('Attempting login with:', username);
      
      // Call login API
      const response = await window.api.login(username, password);
      
      console.log('Login response:', response);

      // Store authentication data
      window.auth.setAuth(response.token, response.user);

      // Show success message
      showSuccess('เข้าสู่ระบบสำเร็จ! กำลังพาไปหน้าแดชบอร์ด...');

      // Redirect to dashboard
      setTimeout(() => {
        console.log('Redirecting to dashboard...');
        window.location.href = '/dashboard.html';
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      showError(error.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  });

  function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }

  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
  }

  function setLoading(loading) {
    loginBtn.disabled = loading;
    if (loading) {
      btnText.style.display = 'none';
      loadingSpinner.style.display = 'inline-block';
    } else {
      btnText.style.display = 'inline-block';
      loadingSpinner.style.display = 'none';
    }
  }

  // Demo account auto-fill (for development)
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      document.getElementById('username').value = 'admin';
      document.getElementById('password').value = 'admin123';
    }
  });
});