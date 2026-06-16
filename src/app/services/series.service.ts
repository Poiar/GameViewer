import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiBaseService } from "./api-base.service";
import { Series } from "../types/game.types";

@Injectable({ providedIn: "root" })
export class SeriesService extends ApiBaseService {
  constructor(http: HttpClient) {
    super(http);
  }

  getSeries(search?: string): Observable<Series[]> {
    return this.extractData<Series[]>(this.get<Series[]>("/series", search ? { search } : undefined));
  }

  getSeriesBySlug(slug: string): Observable<Series> {
    return this.extractData<Series>(this.get<Series>(`/series/${slug}`));
  }
}
