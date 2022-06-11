import { Component } from '@angular/core';

import {allCollections, Collection} from "../classes/collection";
import {allGames, Game} from "../classes/game";
import {GameVersion, allGameVersions} from "../classes/gameVersion";
import {allSeries, Series} from "../classes/series";
import {allGameIterations, GameIteration} from "../classes/gameIteration";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'gameViewer';

  collections:Collection[] = allCollections;
  games:Game[] = allGames;
  series:Series[] = allSeries;
  gameIterations:GameIteration[] = allGameIterations;
  gameVersions:GameVersion[] = allGameVersions;

  // getProvidersFromGameIteration(gameIteration: GameIteration): string{
  //   const providers: string[] = gameIteration.collections.map(collection => providerEnum.toString(collection.provider));
  //   return providers.join(', ');
  // }



}
