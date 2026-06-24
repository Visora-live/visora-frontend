export const environment = {
  production: true,
  // Same-origin: nginx serves the app and proxies /api to the backend container,
  // so the build works on any EC2 IP/domain without a hardcoded host.
  apiUrl: '',
  apiBaseUrl: '/api',
};
