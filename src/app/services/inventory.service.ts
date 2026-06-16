import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiBaseService } from "./api-base.service";
import { OwnedInstance } from "../types/game.types";

@Injectable({ providedIn: "root" })
export class InventoryService extends ApiBaseService {
  constructor(http: HttpClient) {
    super(http);
  }

  getInventory(limit?: number): Observable<OwnedInstance[]> {
    const params: Record<string, string | number> = {};
    if (limit) params["limit"] = limit;
    return this.extractData<OwnedInstance[]>(this.get<OwnedInstance[]>("/inventory", params));
  }

  addItem(item: {
    releaseId?: number;
    dlcReleaseId?: number;
    condition?: string;
    location?: string;
    notes?: string;
    acquiredDate?: string;
    purchasePrice?: string;
  }): Observable<OwnedInstance> {
    return this.extractData<OwnedInstance>(this.post<OwnedInstance>("/inventory", item));
  }

  updateItem(id: number, item: Partial<OwnedInstance>): Observable<OwnedInstance> {
    return this.extractData<OwnedInstance>(this.put<OwnedInstance>(`/inventory/${id}`, item));
  }

  deleteItem(id: number): Observable<void> {
    return this.extractData<void>(this.delete<void>(`/inventory/${id}`));
  }
}
