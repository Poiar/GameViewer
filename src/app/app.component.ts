import { Component } from '@angular/core';

import {allCollections, Collection, providerEnum} from "../classes/collection";
import {allGames, Game, getAllSeries} from "../classes/game";
import {GameVersion, allGameVersions} from "../classes/gameVersion";
import {Series} from "../classes/series";
import {GameIteration, getAllGameIterations} from "../classes/gameIteration";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'gameViewer';

  collections:Collection[] = allCollections;
  games:Game[] = allGames;
  series:Series[] = getAllSeries();
  gameIterations:GameIteration[] = getAllGameIterations();
  gameVersions:GameVersion[] = allGameVersions;

  getProvidersFromGameIteration(gameIteration: GameIteration): string{
    const providers: string[] = gameIteration.collections.map(collection => providerEnum.toString(collection.provider));
    return providers.join(', ');
  }

  getProvidersFromGameVersion(gameVersion: GameVersion): string{
    const providers: string[] = gameVersion.gameIterations.map(gameIteration => this.getProvidersFromGameIteration(gameIteration));
    return providers.join(', ');
  }

}
