import { Injectable, signal, effect } from "@angular/core";

@Injectable({ providedIn: "root" })
export class FavoritesService {
  private readonly KEY = "gameCatalog.favorites";
  favorites = signal<Set<number>>(new Set(this.load()));

  constructor() {
    effect(() => {
      localStorage.setItem(this.KEY, JSON.stringify([...this.favorites()]));
    });
  }

  private load(): number[] {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || "[]");
    } catch {
      return [];
    }
  }

  toggle(gameId: number): void {
    this.favorites.update((set) => {
      const next = new Set(set);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
  }

  isFavorite(gameId: number): boolean {
    return this.favorites().has(gameId);
  }
}
