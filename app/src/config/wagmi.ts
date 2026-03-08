import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "NARNIA X",
  projectId: "narnia-x-narnusd", // Replace with WalletConnect project ID for production
  chains: [sepolia],
  ssr: true,
});
