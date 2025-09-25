// 🎭 Debug Login Injector - The DOM Magic
// "Where development convenience meets runtime injection"

(function() {
  'use strict';
  
  // 🌙 Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.log('🐛 Debug Login Injector: Initializing...');

  // 🎭 Our mystical cast of development users
  const debugUsers = [
    {
      email: 'mom@api-router.cloud',
      password: 'MomAdmin123!',
      name: '👩‍💼 Mom (Main Admin)',
      role: 'Super Admin'
    },
    {
      email: 'dev@example.com',
      password: 'DevUser123!',
      name: '👨‍💻 Developer',
      role: 'Developer'
    },
    {
      email: 'editor@example.com',
      password: 'Editor123!',
      name: '✏️ Content Editor',
      role: 'Editor'
    }
  ];

  // 🔮 Wait for the login form to be available
  function waitForLoginForm() {
    const loginForm = document.querySelector('form[data-testid="login-form"], form');
    if (loginForm) {
      injectDebugButton(loginForm);
    } else {
      setTimeout(waitForLoginForm, 500);
    }
  }

  // 🌟 Inject our magical debug button
  function injectDebugButton(loginForm) {
    // 🎯 Check if already injected
    if (document.getElementById('debug-login-panel')) {
      return;
    }

    console.log('✨ Debug Login Injector: Adding debug panel to login form');

    // 🎨 Create the debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-login-panel';
    debugPanel.style.cssText = \`
      margin-top: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #fff9e6 0%, #fff3d4 100%);
      border: 2px dashed #ffd700;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    \`;

    debugPanel.innerHTML = \`
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="font-size: 20px;">🐛</span>
        <h3 style="margin: 0; color: #b8860b; font-size: 16px; font-weight: 600;">
          Development Quick Login
        </h3>
      </div>
      
      <p style="margin: 0 0 16px 0; color: #8b7355; font-size: 14px;">
        Skip password entry during development - saves time! ⚡
      </p>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; color: #5a4a3a; font-size: 13px; font-weight: 500;">
          Select User Account:
        </label>
        <select id="debug-user-select" style="
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          color: #333;
        ">
          \${debugUsers.map(user => 
            \`<option value="\${user.email}">\${user.name} - \${user.role}</option>\`
          ).join('')}
        </select>
      </div>
      
      <button id="debug-login-btn" style="
        width: 100%;
        padding: 12px 16px;
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 6px rgba(76, 175, 80, 0.2);
      " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(76, 175, 80, 0.3)'"
         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(76, 175, 80, 0.2)'">
        🚀 Quick Login as Mom (Main Admin)
      </button>
      
      <p style="margin: 12px 0 0 0; text-align: center; color: #999; font-size: 12px;">
        💡 This panel only appears in development mode
      </p>
    \`;

    // 🎯 Insert after the login form
    loginForm.parentNode.insertBefore(debugPanel, loginForm.nextSibling);

    // 🔮 Add event listeners
    const selectElement = document.getElementById('debug-user-select');
    const buttonElement = document.getElementById('debug-login-btn');

    selectElement.addEventListener('change', function() {
      const selectedUser = debugUsers.find(u => u.email === this.value);
      if (selectedUser) {
        buttonElement.textContent = \`🚀 Quick Login as \${selectedUser.name}\`;
      }
    });

    buttonElement.addEventListener('click', async function() {
      const selectedEmail = selectElement.value;
      const selectedUser = debugUsers.find(u => u.email === selectedEmail);
      
      if (!selectedUser) return;

      // 🌟 Update button state
      this.textContent = '🌟 Signing in...';
      this.disabled = true;
      this.style.background = 'linear-gradient(135deg, #999 0%, #777 100%)';

      try {
        console.log(\`🐛 Debug Login: Attempting login as \${selectedUser.name}\`);
        
        const response = await fetch('/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: selectedUser.email,
            password: selectedUser.password,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(\`✨ Debug Login: Successfully authenticated \${selectedUser.name}\`);
          
          // 🎊 Store the token and reload
          if (data.data?.token) {
            localStorage.setItem('jwtToken', data.data.token);
            this.textContent = '✅ Success! Redirecting...';
            this.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
            
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        } else {
          console.warn('🌊 Debug Login: Authentication failed');
          this.textContent = '❌ Login failed - User may not exist';
          this.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
          
          setTimeout(() => {
            this.textContent = \`🚀 Quick Login as \${selectedUser.name}\`;
            this.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
            this.disabled = false;
          }, 2000);
        }
      } catch (error) {
        console.error('💥 Debug Login failed:', error);
        this.textContent = '💥 Error occurred';
        this.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
        
        setTimeout(() => {
          this.textContent = \`🚀 Quick Login as \${selectedUser.name}\`;
          this.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
          this.disabled = false;
        }, 2000);
      }
    });
  }

  // 🌟 Start the magic when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForLoginForm);
  } else {
    waitForLoginForm();
  }

  // 🔄 Also watch for route changes (SPA navigation)
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    setTimeout(waitForLoginForm, 100);
  };

})();
