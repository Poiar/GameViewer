import { Component, ChangeDetectionStrategy } from "@angular/core";
import { allSeries, Series } from "../../classes/model";

@Component({
  selector: "app-series-page",
  standalone: true,
  template: `
    <div class="page-header">
      <h2>Series</h2>
      <p>Game franchises and their titles</p>
    </div>
    <div class="grid">
      @for (series of series; track series.id) {
        <article class="card">
          <div class="card-header">
            <div class="card-icon">📚</div>
            <div class="card-title-wrap">
              <h3 class="card-title">{{ series.title }}</h3>
              <div class="card-meta">
                {{ series.games.length }} {{ series.games.length === 1 ? "title" : "titles" }}
              </div>
            </div>
          </div>
          <div class="card-items">
            @for (game of series.games; track game.id) {
              <div class="mini-item">
                <span class="mini-label">{{ game.title }}</span>
                <span class="mini-detail">{{ game.firstRelease }} · {{ game.getGenre() }}</span>
              </div>
            }
          </div>
        </article>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeriesPageComponent {
  series: Series[] = allSeries;
}
