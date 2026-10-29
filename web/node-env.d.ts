declare namespace NodeJS {
  interface ProcessEnv {
    APP_MODE?: "demo" | "integrated";
    API_URL?: string;
    KEYCLOAK_CLIENT_ID?: string;
    KEYCLOAK_CLIENT_SECRET?: string;
    KEYCLOAK_ISSUER?: string;
    NEXTAUTH_SECRET?: string;
    NEXTAUTH_URL?: string;
    NEXTAUTH_LOGOUT?: string;
  }
}
