import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': resolve(__dirname, 'src/components'),
      '@features':   resolve(__dirname, 'src/features'),
      '@pages':      resolve(__dirname, 'src/pages'),
      '@config':     resolve(__dirname, 'src/config'),
      '@hooks':      resolve(__dirname, 'src/hooks'),
      '@stores':     resolve(__dirname, 'src/stores'),
      '@types':      resolve(__dirname, 'src/types'),
      '@utils':      resolve(__dirname, 'src/utils'),
      '@providers':  resolve(__dirname, 'src/providers'),
      '@router':     resolve(__dirname, 'src/router'),
      '@app-types':  resolve(__dirname, 'src/types'),
    },
  },
});
