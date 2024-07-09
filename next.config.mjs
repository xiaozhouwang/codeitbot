/** @type {import('next').NextConfig} */
const nextConfig = {
    api: {
      bodyParser: {
        sizeLimit: '10mb' // Increase this as needed
      }
    }
  };
  
  export default nextConfig;