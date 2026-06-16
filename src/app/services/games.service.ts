import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiBaseService } from "./api-base.service";
import { MasterGame, MasterGameDetail, GameQueryParams } from "../types/game.types";
import { PaginationMeta } from "../types/api.types";

@Injectable({ providedIn: "root" })
export class GamesService extends ApiBaseService {
  constructor(http: HttpClient) {
    super(http);
  }

  getGames(params?: GameQueryParams): Observable<{ data: MasterGame[]; meta?: PaginationMeta }> {
    return this.get<MasterGame[]>("/games", params as Record<string, string | number | boolean | undefined>).pipe(
      this.mapResponse,
    );
  }

  getGameBySlug(slug: string): Observable<MasterGameDetail> {
    return this.extractData<MasterGameDetail>(this.get<MasterGameDetail>(`/games/${slug}`));
  }

  getGameById(id: number): Observable<MasterGameDetail> {
    return this.extractData<MasterGameDetail>(this.get<MasterGameDetail>(`/games/${id}`));
  }

  fetchCover(id: number): Observable<{ id: number; coverImageUrl: string }> {
    return this.extractData<{ id: number; coverImageUrl: string }>(
      this.post(`/games/${id}/cover`, {}),
    );
  }

  bulkFetchCovers(limit?: number): Observable<{ fetched: number; total: number; results: Array<{ id: number; title: string; coverImageUrl: string | null }> }> {
    return this.extractData(
      this.post("/games/bulk-cover", { limit: limit ?? 10 }),
    );
  }

  private mapResponse(source: Observable<{ data: MasterGame[]; meta?: PaginationMeta }>): Observable<{ data: MasterGame[]; meta?: PaginationMeta }> {
    return source;
  }
}
