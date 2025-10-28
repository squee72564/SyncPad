import type { NextConfig } from "next";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, ".")
  }
};

export default nextConfig;
