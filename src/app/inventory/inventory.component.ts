import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { allOwnedInstances, OwnedInstance, allGameVersions, GameVersion } from "../../classes/model";
import { AuthService } from "../auth/auth.service";

@Component({
  selector: "app-inventory",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./inventory.component.html",
  styleUrls: ["./inventory.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent {
  protected readonly authService = inject(AuthService);

  ownedInstances: OwnedInstance[] = allOwnedInstances;
  gameVersions: GameVersion[] = allGameVersions;

  selectedOwned?: OwnedInstance;
  editing?: OwnedInstance;

  showAddForm = false;
  newGameVersionId = 0;
  newCondition = "";
  newLocation = "";
  newNotes = "";
  newAcquiredDate = "";
  newPurchasePrice = "";

  onSelect(owned: OwnedInstance): void {
    this.selectedOwned = owned;
    this.editing = undefined;
  }

  onEdit(owned: OwnedInstance): void {
    this.editing = owned;
    this.selectedOwned = owned;
  }

  onSaveEdit(): void {
    this.editing = undefined;
  }

  onToggleAdd(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  onAdd(): void {
    const gv = this.gameVersions.find((g) => g.id === this.newGameVersionId);
    if (!gv) {
      return;
    }
    new OwnedInstance(
      gv,
      this.newCondition,
      this.newLocation,
      this.newNotes,
      this.newAcquiredDate,
      this.newPurchasePrice,
    );
    this.resetForm();
    this.showAddForm = false;
  }

  onDelete(owned: OwnedInstance): void {
    const idx = this.ownedInstances.indexOf(owned);
    if (idx >= 0) {
      this.ownedInstances.splice(idx, 1);
    }
    if (this.selectedOwned === owned) {
      this.selectedOwned = undefined;
    }
    this.editing = undefined;
  }

  getGameVersionLabel(gv: GameVersion): string {
    return `${gv.superVersion.game.title} — ${gv.superVersion.getVersionType()} (${gv.getPlayableOnTitles()}) [${gv.getProvider()}]`;
  }

  private resetForm(): void {
    this.newGameVersionId = 0;
    this.newCondition = "";
    this.newLocation = "";
    this.newNotes = "";
    this.newAcquiredDate = "";
    this.newPurchasePrice = "";
  }
}
