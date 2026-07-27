import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingExcludes: {
    "/api/scorm/[courseId]/content/[...path]": [
      "./app/**/*",
      "./components/**/*",
      "./lib/**/*",
      "./scripts/**/*",
      "./*.md",
      "./ecosystem.config.cjs",
      "./deploy/nginx-otto-lms.conf",
      "./next.config.ts",
      "./sample-learners.csv"
    ]
  },
  serverExternalPackages: ["adm-zip", "@aws-sdk/client-s3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  }
};

export default nextConfig;
