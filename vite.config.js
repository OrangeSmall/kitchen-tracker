import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/kitchen-tracker/', // <--- 改成新的專案名稱
})