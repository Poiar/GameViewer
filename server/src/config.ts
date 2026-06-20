function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value && !process.env.CI) {
    console.warn(`[config] Missing env var: ${key} — set it in server/.env`);
  }
  return value ?? "";
}

export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtRefreshSecret: requireEnv("JWT_REFRESH_SECRET"),
  jwtExpiresIn: "15m",
  jwtRefreshExpiresIn: "7d",
  bcryptRounds: 12,
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:4200",
  sgdbApiKey: process.env.SGDB_API_KEY ?? "",
  igdbClientId: process.env.IGDB_CLIENT_ID ?? "",
  igdbAccessToken: process.env.IGDB_ACCESS_TOKEN ?? "",
  rapidApiKey: process.env.RAPIDAPI_KEY ?? "",
  itadApiKey: process.env.ITAD_API_KEY ?? "",
  itadClientId: process.env.ITAD_CLIENT_ID ?? "",
  itadClientSecret: process.env.ITAD_CLIENT_SECRET ?? "",
} as const;
