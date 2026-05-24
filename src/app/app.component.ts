import { Component, ChangeDetectionStrategy, inject, OnInit } from "@angular/core";

import { GameUIComponent } from "./game-ui/game-ui.component";
import { InventoryComponent } from "./inventory/inventory.component";
import { AuthComponent } from "./auth/auth.component";
import { AuthService } from "./auth/auth.service";
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
  imports: [GameUIComponent, InventoryComponent, AuthComponent],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);

  title = "gameViewer";

  collections: Collection[] = allCollections;
  games: Game[] = allGames;
  series: Series[] = allSeries;
  gameVersions: GameVersion[] = allGameVersions;

  ngOnInit(): void {
    if (!this.authService.user()) {
      this.authService.login("MM");
    }
  }
}
