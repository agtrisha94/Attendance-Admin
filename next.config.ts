// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // other next config options can stay here
  webpack: (config, { defaultLoaders }) => {
    // ensure alias so imports like `import ... from 'react-native'`
    // resolve to react-native-web (prevents Flow files from being parsed)
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // exact match for 'react-native' imports
      "react-native$": "react-native-web",
    };

    // prefer .web.* files where available (useful if libs provide .web.js variants)
    config.resolve.extensions = [
      ".web.tsx",
      ".web.ts",
      ".web.js",
      ...((config.resolve.extensions as string[]) || []),
    ];

    return config;
  },
};

export default nextConfig;
