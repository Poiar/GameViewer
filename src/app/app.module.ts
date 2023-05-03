import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { GameUIComponent } from './game-ui/game-ui.component';
import { GameModalComponent } from './game-modal/game-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    GameUIComponent,
    GameModalComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
