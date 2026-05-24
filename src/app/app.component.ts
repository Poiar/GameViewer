import { Component, ChangeDetectionStrategy, inject, signal } from "@angular/core";
import { GameUIComponent } from "./game-ui/game-ui.component";
import { InventoryComponent } from "./inventory/inventory.component";
import { AuthComponent } from "./auth/auth.component";
import { ProfileComponent } from "./profile/profile.component";
import { FavoritesService } from "./favorites.service";
import {
  allCollections,
  Collection,
  allGames,
  Game,
  GameVersion,
  allGameVersions,
  allSeries,
  Series,
} from "../classes/model";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [GameUIComponent, InventoryComponent, AuthComponent, ProfileComponent],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private favoritesService = inject(FavoritesService);

  collections: Collection[] = allCollections;
  games: Game[] = allGames;
  series: Series[] = allSeries;
  gameVersions: GameVersion[] = allGameVersions;

  isMobileMenuOpen = signal(false);

  isFavorite(gameId: number): boolean {
    return this.favoritesService.isFavorite(gameId);
  }

  toggleFavorite(gameId: number, event: Event): void {
    event.stopPropagation();
    this.favoritesService.toggle(gameId);
  }

  scrollTo(event: Event, id: string): void {
    event.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${id}`);
    }
    document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
    (event.target as HTMLElement).classList.add("active");
    this.closeMobileMenu();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
