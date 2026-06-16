import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { FavoritesService } from "../services/favorites.service";
import {
  allGames,
  Game,
} from "../../classes/model";

@Component({
  selector: "app-games-page",
  standalone: true,
  template: `
    <div class="page-header">
      <h2>Games</h2>
      <p>All titles and their versions</p>
    </div>
    <div class="grid">
      @for (game of games; track game.id) {
        <article class="card">
          <div class="card-header">
            <div class="card-cover">
              @if (game.coverImage) {
                <img [src]="game.coverImage" [alt]="game.title" loading="lazy" width="80" height="112" />
              } @else {
                <img [src]="'https://picsum.photos/seed/' + game.id + '/80/112'" [alt]="game.title" loading="lazy" width="80" height="112" />
              }
            </div>
            <div class="card-title-wrap">
              <h3 class="card-title">{{ game.title }}</h3>
              <div class="card-meta">
                <span class="tag tag-genre">{{ game.getGenre() }}</span>
                <span class="tag">{{ game.firstRelease }}</span>
                @if (game.alternativeTitles.length > 0) {
                  <span class="tag tag-muted">a.k.a. {{ game.alternativeTitles.join(", ") }}</span>
                }
              </div>
            </div>
            <button
              class="favorite-btn"
              [class.is-favorite]="isFavorite(game.id)"
              [attr.aria-label]="isFavorite(game.id) ? 'Remove from favorites' : 'Add to favorites'"
              (click)="toggleFavorite(game.id, $event)"
              title="{{ isFavorite(game.id) ? 'Remove from' : 'Add to' }} favorites"
            >{{ isFavorite(game.id) ? "♥" : "♡" }}</button>
          </div>
          <div class="card-versions">
            @for (superVersion of game.superVersions; track superVersion.id) {
              <div class="version-chip">
                <span class="version-type">{{ superVersion.getVersionType() }}</span>
                @if (superVersion.versionYear) { <span class="version-year">{{ superVersion.versionYear }}</span> }
                @if (superVersion.versionName) { <span class="version-name">{{ superVersion.versionName }}</span> }
                @for (gv of superVersion.gameVersions; track gv.id) {
                  <span class="version-platform">{{ gv.getPlayableOnTitles() }}</span>
                }
              </div>
            }
          </div>
          @if (game.getAllDlcForThisGame().length > 0) {
            <div class="card-dlc">
              <span class="dlc-label">DLC:</span>
              @for (dlc of game.getAllDlcForThisGame(); track dlc.id) {
                <span class="dlc-chip">{{ dlc.title }}</span>
              }
            </div>
          }
        </article>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamesPageComponent {
  private favoritesService = inject(FavoritesService);
  games: Game[] = allGames;

  isFavorite(gameId: number): boolean {
    return this.favoritesService.isFavorite(gameId);
  }

  toggleFavorite(gameId: number, event: Event): void {
    event.stopPropagation();
    this.favoritesService.toggle(gameId);
  }
}
