/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloud Run向けにスタンドアロン出力（軽量なDockerイメージ用）
  output: "standalone",
};

export default nextConfig;
