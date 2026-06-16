import { Component, ChangeDetectionStrategy, inject, signal, OnInit, effect, computed } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../services/auth.service";
import { InventoryService } from "../services/inventory.service";
import { ReleasesService } from "../services/releases.service";
import { OwnedInstance, Release } from "../types/game.types";
import {
  allGameVersions,
  GameVersion,
} from "../../classes/model";
import { allOwnedInstances, OwnedInstance as OldOwnedInstance } from "../../classes/ownedInstance";
import { SlicePipe } from "@angular/common";
import { LoadingSpinnerComponent } from "../shared/loading-spinner.component";

@Component({
  selector: "app-inventory",
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent, SlicePipe],
  templateUrl: "./inventory.component.html",
  styleUrls: ["./inventory.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly inventoryService = inject(InventoryService);
  private readonly releasesService = inject(ReleasesService);

  ownedInstances = signal<OwnedInstance[]>([]);
  oldOwnedInstances: OldOwnedInstance[] = allOwnedInstances;
  gameVersions: GameVersion[] = allGameVersions;
  releases = signal<Release[]>([]);
  loading = signal(false);

  selectedOwned?: OwnedInstance;
  editing?: OwnedInstance;
  useApi = computed(() => this.authService.isLoggedIn());

  showAddForm = false;
  newReleaseId: number | null = null;
  newCondition = "";
  newLocation = "";
  newNotes = "";
  newAcquiredDate = "";
  newPurchasePrice = "";

  constructor() {
    // Reactively load inventory whenever the user logs in
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.loadInventory();
      }
    });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadInventory();
    }
  }

  loadInventory(): void {
    this.loading.set(true);
    this.inventoryService.getInventory().subscribe({
      next: (items) => {
        this.ownedInstances.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onSelect(owned: OwnedInstance): void {
    this.selectedOwned = owned;
    this.editing = undefined;
  }

  onEdit(owned: OwnedInstance): void {
    this.editing = { ...owned };
    this.selectedOwned = owned;
  }

  onSaveEdit(): void {
    if (!this.editing) return;
    this.inventoryService.updateItem(this.editing.id, {
      condition: this.editing.condition ?? undefined,
      location: this.editing.location ?? undefined,
      notes: this.editing.notes ?? undefined,
      acquiredDate: this.editing.acquiredDate ?? undefined,
      purchasePrice: this.editing.purchasePrice ?? undefined,
    }).subscribe({
      next: () => {
        this.editing = undefined;
        this.loadInventory();
      },
    });
  }

  onToggleAdd(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.loadReleases();
    } else {
      this.resetForm();
    }
  }

  loadReleases(): void {
    this.releasesService.getReleases().subscribe({
      next: (data) => this.releases.set(data),
    });
  }

  onAdd(): void {
    if (!this.newReleaseId) return;
    this.inventoryService.addItem({
      releaseId: this.newReleaseId ?? undefined,
      condition: this.newCondition || undefined,
      location: this.newLocation || undefined,
      notes: this.newNotes || undefined,
      acquiredDate: this.newAcquiredDate || undefined,
      purchasePrice: this.newPurchasePrice || undefined,
    }).subscribe({
      next: () => {
        this.resetForm();
        this.showAddForm = false;
        this.loadInventory();
      },
    });
  }

  // Old hardcoded data methods (fallback when not logged in)
  oldOnSelect(owned: OldOwnedInstance): void {
    // handled in template
  }

  onDelete(owned: OwnedInstance): void {
    this.inventoryService.deleteItem(owned.id).subscribe({
      next: () => {
        if (this.selectedOwned?.id === owned.id) {
          this.selectedOwned = undefined;
        }
        this.editing = undefined;
        this.loadInventory();
      },
    });
  }

  getReleaseLabel(r: Release): string {
    const game = r.releaseGroup?.masterGame?.title ?? "Unknown";
    const edition = r.releaseGroup?.editionType?.name ?? "";
    const platforms = r.playableOn?.join(", ") ?? "";
    const provider = r.provider?.name ?? "";
    return `${game} — ${edition} (${platforms}) [${provider}]`;
  }

  getGameVersionLabel(gv: GameVersion): string {
    return `${gv.superVersion.game.title} — ${gv.superVersion.getVersionType()} (${gv.getPlayableOnTitles()}) [${gv.getProvider()}]`;
  }

  private resetForm(): void {
    this.newReleaseId = null;
    this.newCondition = "";
    this.newLocation = "";
    this.newNotes = "";
    this.newAcquiredDate = "";
    this.newPurchasePrice = "";
  }
}
