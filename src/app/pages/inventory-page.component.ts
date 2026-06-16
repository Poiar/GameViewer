import { Component, ChangeDetectionStrategy } from "@angular/core";
import { InventoryComponent } from "../inventory/inventory.component";

@Component({
  selector: "app-inventory-page",
  standalone: true,
  imports: [InventoryComponent],
  template: `
    <div class="page-header">
      <h2>My Inventory</h2>
      <p>Track your owned game copies</p>
    </div>
    <app-inventory></app-inventory>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryPageComponent {}
