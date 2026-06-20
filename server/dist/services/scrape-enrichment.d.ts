export declare function delay(ms?: number): Promise<void>;
export interface OcScrapeResult {
    id: number;
    name: string;
    score?: number;
    reviewCount?: number;
}
/**
 * OpenCritic headless — uses SPA Bearer token, works from Node.js fetch.
 */
export declare function searchOpenCritic(title: string): Promise<OcScrapeResult | null>;
/**
 * OpenCritic via Playwright browser context — same API calls but executed
 * inside a page that has visited opencritic.com (inherits cookies, SPA auth).
 * The caller must provide a page already navigated to https://opencritic.com.
 */
export declare function searchOpenCriticBrowser(page: {
    evaluate: (fn: Function, arg: any) => Promise<any>;
}, title: string): Promise<{
    opencriticId?: number;
    criticScore?: number;
} | null>;
export interface HltbScrapeResult {
    id: number;
    name: string;
    mainTime?: number;
}
/**
 * Run HLTB search inside a Playwright page context (which has proper
 * browser fingerprinting). The caller must provide a Playwright `page` object
 * that is already navigated to https://howlongtobeat.com.
 */
export declare function searchHltbBrowser(page: {
    evaluate: (fn: Function, arg: any) => Promise<any>;
}, title: string): Promise<HltbScrapeResult | null>;
//# sourceMappingURL=scrape-enrichment.d.ts.map