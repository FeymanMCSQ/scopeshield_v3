import path from 'path';
import dotenv from 'dotenv';

// Load root .env explicitly
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
