export const environment = {
  production: true,
  // Same-origin: nginx serves the app and proxies /api to the backend container,
  // so the build works on any EC2 IP/domain without a hardcoded host.
  apiUrl: '',
  apiBaseUrl: '/api',
  // MediaMTX on the EC2 (set when we deploy streaming to AWS).
  mediamtxRtmpUrl: 'rtmp://98.81.228.31:1935',
  mediamtxHlsBase: 'http://98.81.228.31:8888',
};
