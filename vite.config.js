import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ── الـ proxy يحفظ session cookie ويضيفه لكل طلب ──
let savedSession = null;   // "session_id=xxxxx"

export default defineConfig({
  plugins: [react()],
  base: './', // Makes CSS/JS paths relative so it works on GitHub Pages
  server: {
    proxy: {
      '/odoo': {
        target:       'https://forestedge-test.odoo.com',
        changeOrigin: true,
        rewrite:      (path) => path.replace(/^\/odoo/, ''),
        secure:       false,

        configure: (proxy) => {

          // ① اعترض الـ responses — ابحث عن session cookie
          proxy.on('proxyRes', (proxyRes, req) => {
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              const sessionCookie = cookies.find(c => c.startsWith('session_id='));
              if (sessionCookie) {
                savedSession = sessionCookie.split(';')[0]; // "session_id=xxxx"
                console.log('[proxy] 💾 Session saved:', savedSession.slice(0, 30) + '...');
              }

              // أعد كتابة الـ cookie ليقبله المتصفح على localhost
              proxyRes.headers['set-cookie'] = cookies.map(c =>
                c
                  .replace(/;\s*Secure/gi, '')
                  .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
                  .replace(/;\s*Domain=[^;]*/gi, '')
              );
            }
          });

          // ② اعترض الـ requests — أضف الـ session cookie لكل طلب لأودو
          proxy.on('proxyReq', (proxyReq) => {
            if (savedSession) {
              const existing = proxyReq.getHeader('Cookie') || '';
              const merged   = existing ? `${existing}; ${savedSession}` : savedSession;
              proxyReq.setHeader('Cookie', merged);
            }
          });

          proxy.on('error', (err) => {
            console.error('[proxy] ❌', err.message);
          });
        },
      }
    }
  }
})
