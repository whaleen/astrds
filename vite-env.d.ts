/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly VITE_SOLANA_RPC_ENDPOINT: string
    // Add other env variables as needed
  }
}
