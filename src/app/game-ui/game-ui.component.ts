import { Component, ChangeDetectionStrategy } from "@angular/core";
import { allGames, Game, GameVersion } from "../../classes/model";

@Component({
  selector: "app-game-ui",
  standalone: true,
  templateUrl: "./game-ui.component.html",
  styleUrls: ["./game-ui.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameUIComponent {
  games: Game[] = allGames;
  aGame: Game = this.games[14];

  constructor() {}

  selectedGameVersion?: GameVersion;

  onSelect(gameVersion: GameVersion): void {
    this.selectedGameVersion = gameVersion;
  }
}
