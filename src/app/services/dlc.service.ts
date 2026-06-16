import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiBaseService } from "./api-base.service";
import { Dlc, DlcDetail } from "../types/game.types";

@Injectable({ providedIn: "root" })
export class DlcService extends ApiBaseService {
  constructor(http: HttpClient) {
    super(http);
  }

  getDlcs(gameId?: number): Observable<Dlc[]> {
    return this.extractData<Dlc[]>(this.get<Dlc[]>("/dlc", gameId ? { gameId } : undefined));
  }

  getDlcById(id: number): Observable<DlcDetail> {
    return this.extractData<DlcDetail>(this.get<DlcDetail>(`/dlc/${id}`));
  }
}
