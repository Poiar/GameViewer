import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";

import "./classes/seriesData";
import "./classes/gameData";
import "./classes/superVersionData";
import "./classes/dlcData";
import "./classes/dlcVersionData";
import "./classes/gameVersionData";
import "./classes/collectionData";
import "./classes/ownedInstanceData";

bootstrapApplication(AppComponent).catch((err) => console.error(err));
