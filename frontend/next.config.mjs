const nextConfig = {
  // Rewrites hanya untuk local development
  // Di Docker/production, Nginx akan handle routing ke backend
  ...(process.env.NODE_ENV === 'development' && {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:8080/:path*',
        },
      ];
    },
  }),
};

export default nextConfig;
