import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiBaseService } from "./api-base.service";
import { Release } from "../types/game.types";

@Injectable({ providedIn: "root" })
export class ReleasesService extends ApiBaseService {
  constructor(http: HttpClient) {
    super(http);
  }

  getReleases(params?: {
    gameId?: number;
    releaseGroupId?: number;
    platform?: string;
    provider?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<Release[]> {
    return this.extractData<Release[]>(
      this.get<Release[]>("/releases", params as Record<string, string | number | boolean | undefined>),
    );
  }

  getReleaseById(id: number): Observable<Release> {
    return this.extractData<Release>(this.get<Release>(`/releases/${id}`));
  }
}
