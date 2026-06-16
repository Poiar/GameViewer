import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiBaseService } from "./api-base.service";
import { Platform, Provider, Genre, EditionType, MediaFormat } from "../types/game.types";

@Injectable({ providedIn: "root" })
export class LookupService extends ApiBaseService {
  constructor(http: HttpClient) {
    super(http);
  }

  getPlatforms(): Observable<Platform[]> {
    return this.extractData<Platform[]>(this.get<Platform[]>("/lookup/platforms"));
  }

  getProviders(): Observable<Provider[]> {
    return this.extractData<Provider[]>(this.get<Provider[]>("/lookup/providers"));
  }

  getGenres(): Observable<Genre[]> {
    return this.extractData<Genre[]>(this.get<Genre[]>("/lookup/genres"));
  }

  getEditionTypes(): Observable<EditionType[]> {
    return this.extractData<EditionType[]>(this.get<EditionType[]>("/lookup/edition-types"));
  }

  getMediaFormats(): Observable<MediaFormat[]> {
    return this.extractData<MediaFormat[]>(this.get<MediaFormat[]>("/lookup/media-formats"));
  }
}
