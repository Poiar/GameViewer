import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy, effect } from "@angular/core";
import { DashboardService } from "../services/dashboard.service";
import { AuthService } from "../services/auth.service";
import { GamesService } from "../services/games.service";
import { SlicePipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { LoadingSpinnerComponent } from "../shared/loading-spinner.component";
import { ErrorStateComponent } from "../shared/error-state.component";
import { EmptyStateComponent } from "../shared/empty-state.component";
import { DashboardStats } from "../types/game.types";
import { Subscription } from "rxjs";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [LoadingSpinnerComponent, ErrorStateComponent, EmptyStateComponent, SlicePipe, RouterLink],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private gamesService = inject(GamesService);
  protected authService = inject(AuthService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  fetchingCovers = signal(false);
  coverFetchResult = signal<string | null>(null);

  private sub?: Subscription;

  constructor() {
    // Reactively load stats whenever the user logs in
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.loadStats();
      }
    });
  }

  ngOnInit(): void {
    // Fallback: if already logged in by the time ngOnInit runs, load once
    if (this.authService.isLoggedIn()) {
      this.loadStats();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadStats(): void {
    // Guard: don't fire if not logged in yet
    if (!this.authService.isLoggedIn()) {
      setTimeout(() => this.loadStats(), 500);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.sub = this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? "Failed to load dashboard stats. Please try again.");
        this.loading.set(false);
      },
    });
  }

  maxPlatformCount(): number {
    const dist = this.stats()?.platformDistribution ?? [];
    if (dist.length === 0) return 1;
    return Math.max(...dist.map((d) => d.count), 1);
  }

  maxGenreCount(): number {
    const dist = this.stats()?.genreBreakdown ?? [];
    if (dist.length === 0) return 1;
    return Math.max(...dist.map((d) => d.count), 1);
  }

  bulkFetchCovers(): void {
    this.fetchingCovers.set(true);
    this.coverFetchResult.set(null);
    this.gamesService.bulkFetchCovers(25).subscribe({
      next: (data) => {
        this.coverFetchResult.set(`Fetched ${data.fetched} of ${data.total} covers`);
        this.fetchingCovers.set(false);
        this.loadStats(); // refresh to show covers
      },
      error: (err) => {
        this.coverFetchResult.set(`Error: ${err.message}`);
        this.fetchingCovers.set(false);
      },
    });
  }
}
