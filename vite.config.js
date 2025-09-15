// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
// })



import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
// import autoprefixer from 'autoprefixer'

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5175,
      allowedHosts: [
        'shprod.platinum-infotech.com'
      ],
      proxy: {
        // https://vitejs.dev/config/server-options.html
      }
    }
  }
})