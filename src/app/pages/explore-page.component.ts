import { Component, ChangeDetectionStrategy } from "@angular/core";
import { GameUIComponent } from "../game-ui/game-ui.component";

@Component({
  selector: "app-explore-page",
  standalone: true,
  imports: [GameUIComponent],
  template: `
    <div class="page-header">
      <h2>Game Explorer</h2>
      <p>Search, sort, and compare game versions across platforms</p>
    </div>
    <app-game-ui></app-game-ui>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExplorePageComponent {}
