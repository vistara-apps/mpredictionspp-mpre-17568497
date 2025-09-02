declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_BASE_URL: string;
    UPSTASH_REDIS_REST_URL: string;
    UPSTASH_REDIS_REST_TOKEN: string;
    NEXT_PUBLIC_ONCHAINKIT_API_KEY: string;
    NEYNAR_API_KEY: string;
    PREDICTION_CONTRACT_ADDRESS: string;
  }
}

