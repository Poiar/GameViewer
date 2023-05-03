import { Component } from '@angular/core';
import { GameModalComponent } from './game-modal/game-modal.component';
import {allCollections, Collection} from "../classes/collection";
import {allGames, Game} from "../classes/game";
import {GameVersion, allGameVersions} from "../classes/gameVersion";
import {allSeries, Series} from "../classes/series";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  // constructor(private gameModalComponent: GameModalComponent) {}
  gameModalComponent: GameModalComponent = new GameModalComponent();

  title: string = 'gameViewer';


  collections:Collection[] = allCollections;
  games:Game[] = allGames;
  series:Series[] = allSeries;
  gameVersions:GameVersion[] = allGameVersions;

  openModal(gameVersion: GameVersion) {
    this.gameModalComponent.openModal(gameVersion);
    // console.log("Button clicked:", gameVersion.superVersion.game.title)
  }
}
