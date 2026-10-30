import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ce dossier est un projet autonome ; on épingle la racine pour que
  // Next n'aille pas inférer celle du parent (package-lock.json à la racine).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
