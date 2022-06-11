import { Component } from '@angular/core';

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
  title = 'gameViewer';

  collections:Collection[] = allCollections;
  games:Game[] = allGames;
  series:Series[] = allSeries;
  gameVersions:GameVersion[] = allGameVersions;
}
