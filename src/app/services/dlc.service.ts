import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiBaseService } from "./api-base.service";
import { PaginationMeta } from "../types/api.types";

export interface DlcSummary {
  id: number;
  title: string;
  firstReleaseYear: number | null;
  dlcType: string;
  masterGameId: number;
  createdAt: string;
  gameTitle: string;
  gameSlug: string;
  releaseCount: number;
  userOwns?: boolean;
}

@Injectable({ providedIn: "root" })
export class DlcService extends ApiBaseService {
  constructor(http: HttpClient) {
    super(http);
  }

  getDlcs(params?: {
    page?: number;
    limit?: number;
    gameId?: number;
  }): Observable<{ data: DlcSummary[]; meta?: PaginationMeta }> {
    return this.get<DlcSummary[]>("/dlc", params as Record<string, string | number | undefined>).pipe(
      this.mapResponse,
    );
  }

  private mapResponse(
    source: Observable<{ data: DlcSummary[]; meta?: PaginationMeta }>,
  ): Observable<{ data: DlcSummary[]; meta?: PaginationMeta }> {
    return source;
  }
}
