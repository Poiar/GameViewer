export const config = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://neondb_owner:npg_rn8FBu7UXHag@ep-summer-queen-a2tlqgvn-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  jwtSecret: process.env.JWT_SECRET ?? "gameviewer-jwt-secret-change-in-production",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "gameviewer-jwt-refresh-secret-change-in-production",
  jwtExpiresIn: "15m",
  jwtRefreshExpiresIn: "7d",
  bcryptRounds: 12,
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:4200",
  sgdbApiKey: process.env.SGDB_API_KEY ?? "",
} as const;
