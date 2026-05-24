import { Component, ChangeDetectionStrategy, signal, computed, HostListener } from "@angular/core";
import { allGames, Game, GameVersion } from "../../classes/model";

type SortKey = "name" | "year" | "genre";

@Component({
  selector: "app-game-ui",
  standalone: true,
  templateUrl: "./game-ui.component.html",
  styleUrls: ["./game-ui.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameUIComponent {
  private readonly STORAGE_KEY = "gameExplorer.lastGameId";
  private readonly COMPARE_KEY = "gameExplorer.compareIds";
  private favoritesService = inject(FavoritesService);

  games: Game[] = allGames;

  searchQuery = signal("");
  sortKey = signal<SortKey>("name");
  sortAsc = signal(true);
  selectedGenre = signal<string | null>(null);
  selectedGame: Game;
  selectedGameVersion?: GameVersion;
  compareList = signal<GameVersion[]>([]);

  allGenres = computed(() => {
    const genres = new Set(this.games.map((g) => g.getGenre()));
    return Array.from(genres)
      .filter((g) => g !== "Undefined")
      .sort();
  });

  filteredGames = computed(() => {
    let result = this.games;
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(query) ||
          g.series.title.toLowerCase().includes(query) ||
          g.alternativeTitles.some((t) => t.toLowerCase().includes(query)),
      );
    }
    const genre = this.selectedGenre();
    if (genre) {
      result = result.filter((g) => g.getGenre() === genre);
    }
    return result;
  });

  sortedGames = computed(() => {
    const games = this.filteredGames();
    const key = this.sortKey();
    const asc = this.sortAsc() ? 1 : -1;
    return [...games].sort((a, b) => {
      let cmp = 0;
      switch (key) {
        case "name":
          cmp = a.title.localeCompare(b.title);
          break;
        case "year":
          cmp = a.firstRelease - b.firstRelease;
          break;
        case "genre":
          cmp = a.getGenre().localeCompare(b.getGenre());
          break;
      }
      return cmp * asc;
    });
  });

  constructor() {
    this.selectedGame = this.loadLastGame();
    this.loadCompareList();
  }

  private loadLastGame(): Game {
    const savedId = localStorage.getItem(this.STORAGE_KEY);
    if (savedId !== null) {
      const id = parseInt(savedId, 10);
      const game = this.games.find((g) => g.id === id);
      if (game) return game;
    }
    return this.games[0];
  }

  private saveLastGame(): void {
    localStorage.setItem(this.STORAGE_KEY, String(this.selectedGame.id));
  }

  private loadCompareList(): void {
    try {
      const saved = localStorage.getItem(this.COMPARE_KEY);
      if (saved) {
        const ids: number[] = JSON.parse(saved);
        const versions = ids
          .map((id) =>
            this.games
              .flatMap((g) => g.superVersions)
              .flatMap((sv) => sv.gameVersions)
              .find((gv) => gv.id === id),
          )
          .filter((gv): gv is GameVersion => gv !== undefined);
        if (versions.length > 0) this.compareList.set(versions.slice(0, 2));
      }
    } catch {
      /* ignore */
    }
  }

  private saveCompareList(): void {
    const ids = this.compareList().map((v) => v.id);
    localStorage.setItem(this.COMPARE_KEY, JSON.stringify(ids));
  }

  setSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortAsc.update((v) => !v);
    } else {
      this.sortKey.set(key);
      this.sortAsc.set(true);
    }
  }

  selectGame(game: Game): void {
    this.selectedGame = game;
    this.selectedGameVersion = undefined;
    this.compareList.set([]);
    this.saveCompareList();
    this.saveLastGame();
  }

  onSelect(gameVersion: GameVersion): void {
    this.selectedGameVersion = gameVersion;
  }

  toggleCompare(gv: GameVersion, event: Event): void {
    event.stopPropagation();
    this.compareList.update((list) => {
      const idx = list.findIndex((v) => v.id === gv.id);
      let next: GameVersion[];
      if (idx >= 0) {
        next = list.filter((_, i) => i !== idx);
      } else if (list.length >= 2) {
        next = [list[1], gv];
      } else {
        next = [...list, gv];
      }
      this.saveCompareList();
      return next;
    });
  }

  isInCompare(gv: GameVersion): boolean {
    return this.compareList().some((v) => v.id === gv.id);
  }

  clearCompare(): void {
    this.compareList.set([]);
    this.saveCompareList();
  }

  getCompareField(gv: GameVersion, field: string): string {
    switch (field) {
      case "title":
        return gv.superVersion.game.title;
      case "year":
        return String(gv.superVersion.getVersionYear());
      case "genre":
        return gv.superVersion.game.getGenre();
      case "version":
        return gv.superVersion.getVersionType();
      case "platform":
        return gv.getPlayableOnTitles();
      case "provider":
        return gv.getProvider();
      case "localCoop":
        return gv.getLocalMultiplayer();
      case "onlineMulti":
        return gv.getOnlineMultiplayer();
      case "controller":
        return gv.getControllerSupport();
      default:
        return "—";
    }
  }

  isCompareDifferent(field: string): boolean {
    const list = this.compareList();
    if (list.length !== 2) return false;
    return this.getCompareField(list[0], field) !== this.getCompareField(list[1], field);
  }

  @HostListener("document:keydown.arrow-down", ["$event"])
  onArrowDown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if ((keyboardEvent.target as HTMLElement)?.tagName === "INPUT") return;
    keyboardEvent.preventDefault();
    const games = this.sortedGames();
    if (games.length === 0) return;
    const idx = games.findIndex((g) => g.id === this.selectedGame.id);
    const nextIdx = idx < games.length - 1 ? idx + 1 : 0;
    this.selectGame(games[nextIdx]);
    this.scrollGameIntoView(games[nextIdx]);
  }

  @HostListener("document:keydown.arrow-up", ["$event"])
  onArrowUp(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if ((keyboardEvent.target as HTMLElement)?.tagName === "INPUT") return;
    keyboardEvent.preventDefault();
    const games = this.sortedGames();
    if (games.length === 0) return;
    const idx = games.findIndex((g) => g.id === this.selectedGame.id);
    const nextIdx = idx > 0 ? idx - 1 : games.length - 1;
    this.selectGame(games[nextIdx]);
    this.scrollGameIntoView(games[nextIdx]);
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.compareList().length > 0) {
      this.clearCompare();
    } else if (this.selectedGameVersion) {
      this.selectedGameVersion = undefined;
    } else {
      this.searchQuery.set("");
    }
  }

  private scrollGameIntoView(game: Game): void {
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-game-id="${game.id}"]`);
      el?.scrollIntoView({ block: "nearest" });
    });
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.selectedGenre.set(null);
  }

  clearSearch(): void {
    this.searchQuery.set("");
  }

  isFavorite(gameId: number): boolean {
    return this.favoritesService.isFavorite(gameId);
  }

  toggleFavorite(gameId: number): void {
    this.favoritesService.toggle(gameId);
  }
}
