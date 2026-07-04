import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.fadaef62fdf847077ad728486c8029493',
  appName: 'Mentor4You',
  webDir: 'dist',
  server: {
    url: 'https://id-preview--fadaef62-fdf8-4707-ad72-8486c8029493.lovable.app?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
