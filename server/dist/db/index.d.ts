import * as schema from "./schema.js";
export declare const db: import("drizzle-orm/neon-http").NeonHttpDatabase<typeof schema> & {
    $client: import("@neondatabase/serverless").NeonQueryFunction<false, false>;
};
export type Db = typeof db;
export default db;
//# sourceMappingURL=index.d.ts.map