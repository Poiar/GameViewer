import { Component, ChangeDetectionStrategy } from "@angular/core";

import { GameUIComponent } from "./game-ui/game-ui.component";
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
  imports: [GameUIComponent],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = "gameViewer";

  collections: Collection[] = allCollections;
  games: Game[] = allGames;
  series: Series[] = allSeries;
  gameVersions: GameVersion[] = allGameVersions;
}
