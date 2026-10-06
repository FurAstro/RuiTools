// @ts-check
import { defineConfig } from 'astro/config';

import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 4322, 
    allowedHosts: true, // 允许所有主机名访问，防止 CSRF/XSS
  },

  integrations: [icon()],
});