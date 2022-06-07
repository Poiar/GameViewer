import { Component } from '@angular/core';

import {collections, Collection, providerEnum} from "../classes/collection";
import {games, Game, getAllSeries} from "../classes/game";
import {GameIteration} from "../classes/gameIteration";
import {Series} from "../classes/series";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'gameViewer';

  collections:Collection[] = collections;
  games:Game[] = games;
  series:Series[] = getAllSeries();

  getProvidersFromGameIteration(gameIteration: GameIteration): string{
    const providers: string[] = gameIteration.collections.map(collection => providerEnum.toString(collection.provider));
    return providers.join(', ');
  }


}
