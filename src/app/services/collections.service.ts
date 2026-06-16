import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiBaseService } from "./api-base.service";
import { Collection, CollectionDetail } from "../types/game.types";

@Injectable({ providedIn: "root" })
export class CollectionsService extends ApiBaseService {
  constructor(http: HttpClient) {
    super(http);
  }

  getCollections(page?: number, limit?: number): Observable<Collection[]> {
    return this.extractData<Collection[]>(
      this.get<Collection[]>("/collections", { page, limit }),
    );
  }

  getCollectionById(id: number): Observable<CollectionDetail> {
    return this.extractData<CollectionDetail>(this.get<CollectionDetail>(`/collections/${id}`));
  }
}
