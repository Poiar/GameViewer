interface IgdbGame {
    id: number;
    name: string;
    slug: string;
    summary?: string;
    first_release_date?: number;
    cover?: {
        id: number;
        url: string;
    };
    genres?: {
        id: number;
        name: string;
    }[];
    screenshots?: {
        id: number;
        url: string;
    }[];
    game_modes?: {
        id: number;
        name: string;
    }[];
    player_perspectives?: {
        id: number;
        name: string;
    }[];
    age_ratings?: {
        id: number;
        category: number;
        rating: number;
    }[];
    videos?: {
        video_id: string;
        name: string;
    }[];
    franchise?: {
        id: number;
        name: string;
    };
    external_games?: {
        id: number;
        uid: string;
        external_game_source: number;
    }[];
    total_rating?: number;
    total_rating_count?: number;
}
export declare function getIgdbCoverUrl(coverUrl: string | undefined): string | undefined;
export declare function searchIgdb(title: string): Promise<IgdbGame | null>;
interface OpenCriticResult {
    id: number;
    name: string;
    score?: number;
    reviewCount?: number;
    url?: string;
}
export declare function searchOpenCritic(title: string): Promise<OpenCriticResult | null>;
interface HltbResult {
    id: number;
    name: string;
    mainTime?: number;
}
export declare function searchHltb(title: string): Promise<HltbResult | null>;
export interface EnrichmentResult {
    igdbId?: number;
    igdbUrl?: string;
    igdbCoverUrl?: string;
    igdbSummary?: string;
    igdbGenres?: string[];
    igdbScreenshots?: string[];
    igdbGameModes?: string[];
    igdbPlayerPerspectives?: string[];
    igdbAgeRating?: string;
    igdbTrailerUrl?: string;
    igdbFranchise?: string;
    igdbSteamAppId?: number;
    igdbTotalRating?: number;
    igdbTotalRatingCount?: number;
    opencriticId?: number;
    opencriticScore?: number;
    hltbId?: number;
    hltbTime?: number;
}
export declare function enrichGame(title: string): Promise<EnrichmentResult>;
export declare function fetchSteamPlayers(steamAppId: number): Promise<{
    players: number;
    asOf: Date;
} | null>;
export {};
//# sourceMappingURL=enrichment.d.ts.map