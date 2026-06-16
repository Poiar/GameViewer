import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiBaseService } from "./api-base.service";
import { DashboardStats } from "../types/game.types";

@Injectable({ providedIn: "root" })
export class DashboardService extends ApiBaseService {
  constructor(http: HttpClient) {
    super(http);
  }

  getStats(): Observable<DashboardStats> {
    return this.extractData<DashboardStats>(this.get<DashboardStats>("/dashboard/stats"));
  }
}
