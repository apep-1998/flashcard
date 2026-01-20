declare module "next-pwa" {
  import type { NextConfig } from "next";

  type PWAConfig = Record<string, unknown>;
  type WithPWA = (options: PWAConfig) => (config: NextConfig) => NextConfig;

  const withPWA: WithPWA;
  export default withPWA;
}
