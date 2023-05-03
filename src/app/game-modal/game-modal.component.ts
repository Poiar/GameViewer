import { Component } from '@angular/core';
import { GameVersion, gv_X360_physical_enhanced2016_redDeadRedemption } from "../../classes/gameVersion";


@Component({
  selector: 'app-game-modal',
  templateUrl: './game-modal.component.html',
  // template: `
  //   <div class="modal" *ngIf="isModalOpen">
  //     <div class="modal-content">
  //       <span class="close" (click)="closeModal()">&times;</span>
  //       <p>This is the modal content.</p>
  //     </div>
  //   </div>
  // `,
  styleUrls: ['./game-modal.component.css']
})
export class GameModalComponent {
  isModalOpen: boolean = false;

  currentGameVersion: GameVersion = gv_X360_physical_enhanced2016_redDeadRedemption;

  // constructor() { }
  //
  // ngOnInit(): void {
  // }

  openModal(gameVersion: GameVersion) {
    this.isModalOpen = true;
    this.currentGameVersion = gameVersion;
    console.log("Button clicked:", gameVersion.superVersion.game.title)
    console.log("Button clicked2:", this.currentGameVersion.superVersion.game.title, this.isModalOpen)

  }

  closeModal() {
    this.isModalOpen = false;
  }

}
