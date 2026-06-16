import { Component, ChangeDetectionStrategy } from "@angular/core";
import { DashboardComponent } from "../dashboard/dashboard.component";

@Component({
  selector: "app-dashboard-page",
  standalone: true,
  imports: [DashboardComponent],
  template: `
    <div class="page-header">
      <h2>Dashboard</h2>
      <p>Your collection at a glance</p>
    </div>
    <app-dashboard></app-dashboard>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {}
