// 🎭 Admin App Configuration - The Digital Canvas
// "Where the admin interface comes alive with mystical enhancements"

const config = {
  locales: ['en'],
  
  // 🌟 Customize the login page
  auth: {
    logo: null, // You can add a custom logo here if needed
  },

  // 🎭 Bootstrap the admin app with debug enhancements
  bootstrap(app) {
    console.log('🎨 Admin app bootstrapping with debug enhancements');
    
    // 🐛 Inject debug login functionality in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 Loading debug login injector...');
      
      // 🌟 Wait for DOM to be ready and inject debug functionality
      setTimeout(() => {
        const script = document.createElement('script');
        script.textContent = `
          (function() {
            console.log('🐛 Debug Login Injector: Starting...');
            
            const debugUsers = [
              { email: 'mom@api-router.cloud', password: 'MomAdmin123!', name: '👩‍💼 Mom (Main Admin)', role: 'Super Admin' },
              { email: 'dev@example.com', password: 'DevUser123!', name: '👨‍💻 Developer', role: 'Developer' },
              { email: 'editor@example.com', password: 'Editor123!', name: '✏️ Content Editor', role: 'Editor' }
            ];

            function addDebugPanel() {
              const loginForm = document.querySelector('form');
              if (loginForm && !document.getElementById('debug-panel')) {
                const panel = document.createElement('div');
                panel.id = 'debug-panel';
                panel.style.cssText = 'margin-top:20px;padding:20px;background:#fff9e6;border:2px dashed #ffd700;border-radius:12px;font-family:system-ui;';
                
                panel.innerHTML = '<div style="margin-bottom:12px;"><span style="font-size:20px;">🐛</span> <strong style="color:#b8860b;">Development Quick Login</strong></div>' +
                  '<p style="margin:0 0 16px;color:#8b7355;font-size:14px;">Skip password entry - saves time! ⚡</p>' +
                  '<select id="user-select" style="width:100%;padding:10px;margin-bottom:16px;border:1px solid #ddd;border-radius:6px;">' +
                  debugUsers.map(u => '<option value="' + u.email + '">' + u.name + ' - ' + u.role + '</option>').join('') +
                  '</select>' +
                  '<button id="quick-login" style="width:100%;padding:12px;background:#4CAF50;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">🚀 Quick Login as Mom (Main Admin)</button>' +
                  '<p style="margin:12px 0 0;text-align:center;color:#999;font-size:12px;">💡 Development mode only</p>';
                
                loginForm.parentNode.insertBefore(panel, loginForm.nextSibling);
                
                document.getElementById('user-select').onchange = function() {
                  const user = debugUsers.find(u => u.email === this.value);
                  document.getElementById('quick-login').textContent = '🚀 Quick Login as ' + user.name;
                };
                
                document.getElementById('quick-login').onclick = async function() {
                  const email = document.getElementById('user-select').value;
                  const user = debugUsers.find(u => u.email === email);
                  this.textContent = '🌟 Signing in...'; this.disabled = true;
                  
                  try {
                    const res = await fetch('/admin/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: user.email, password: user.password })
                    });
                    
                    if (res.ok) {
                      const data = await res.json();
                      if (data.data?.token) {
                        localStorage.setItem('jwtToken', data.data.token);
                        this.textContent = '✅ Success!';
                        setTimeout(() => window.location.reload(), 500);
                      }
                    } else {
                      this.textContent = '❌ Failed - User may not exist';
                      setTimeout(() => { this.textContent = '🚀 Quick Login as ' + user.name; this.disabled = false; }, 2000);
                    }
                  } catch (e) {
                    this.textContent = '💥 Error';
                    setTimeout(() => { this.textContent = '🚀 Quick Login as ' + user.name; this.disabled = false; }, 2000);
                  }
                };
              } else if (!loginForm) {
                setTimeout(addDebugPanel, 500);
              }
            }
            
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', addDebugPanel);
            } else {
              setTimeout(addDebugPanel, 100);
            }
          })();
        `;
        document.head.appendChild(script);
      }, 1000);
    }
  },

  // 🔮 Custom configuration
  config: {
    // 🌙 Only in development mode
    ...(process.env.NODE_ENV === 'development' && {
      tutorials: false,
      notifications: { releases: false },
    }),
  },
};

export default config;
