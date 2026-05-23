import { Component, OnInit } from "@angular/core";
import { allGames, Game } from "../../classes/game";
import { GameVersion } from "../../classes/gameVersion";

@Component({
  selector: "app-game-ui",
  standalone: false,
  templateUrl: "./game-ui.component.html",
  styleUrls: ["./game-ui.component.css"],
})
export class GameUIComponent implements OnInit {
  games: Game[] = allGames;
  aGame: Game = this.games[14];

  constructor() {}

  ngOnInit(): void {}

  selectedGameVersion?: GameVersion;

  onSelect(gameVersion: GameVersion): void {
    this.selectedGameVersion = gameVersion;
  }
}
