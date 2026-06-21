import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy, effect } from "@angular/core";
import { DashboardService } from "../services/dashboard.service";
import { AuthService } from "../services/auth.service";
import { GamesService } from "../services/games.service";
import { HttpClient } from "@angular/common/http";
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
  private http = inject(HttpClient);
  protected authService = inject(AuthService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  fetchingCovers = signal(false);
  coverFetchResult = signal<string | null>(null);
  enriching = signal(false);
  enrichResult = signal<string | null>(null);
  pricing = signal(false);
  pricingAll = signal(false);
  pricingResult = signal<string | null>(null);
  importingDlcs = signal(false);
  dlcResult = signal<string | null>(null);

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

  bulkEnrich(): void {
    this.enriching.set(true);
    this.enrichResult.set(null);
    this.http.post<any>('/api/enrich/batch', { limit: 25 }).subscribe({
      next: (res) => {
        const d = res.data ?? res;
        this.enrichResult.set(`Enriched ${d.enriched} of ${d.total} games`);
        this.enriching.set(false);
        this.loadStats();
      },
      error: (err) => {
        this.enrichResult.set(`Error: ${err.message}`);
        this.enriching.set(false);
      },
    });
  }

  bulkPrice(): void {
    this.pricing.set(true);
    this.pricingResult.set(null);
    this.http.post<any>('/api/pricing/batch', { limit: 50 }).subscribe({
      next: (res) => {
        const d = res.data ?? res;
        this.pricingResult.set(`Priced ${d.updated} of ${d.total} games`);
        this.pricing.set(false);
        this.loadStats();
      },
      error: (err) => {
        this.pricingResult.set(`Error: ${err.message}`);
        this.pricing.set(false);
      },
    });
  }

  priceAll(): void {
    this.pricingAll.set(true);
    this.pricingResult.set(null);
    this.http.post<any>('/api/pricing/refresh-all', {}).subscribe({
      next: (res) => {
        const d = res.data ?? res;
        this.pricingResult.set(`Price refresh: ${d.updated}/${d.total} games updated`);
        this.pricingAll.set(false);
        this.loadStats();
      },
      error: (err) => {
        this.pricingResult.set(`Error: ${err.message}`);
        this.pricingAll.set(false);
      },
    });
  }

  bulkImportDlcs(): void {
    this.importingDlcs.set(true);
    this.dlcResult.set(null);
    this.http.post<any>('/api/dlc/batch', { limit: 10 }).subscribe({
      next: (res) => {
        const d = res.data ?? res;
        this.dlcResult.set(`Imported ${d.imported} DLCs across ${d.games?.length ?? 0} games`);
        this.importingDlcs.set(false);
        this.loadStats();
      },
      error: (err) => {
        this.dlcResult.set(`Error: ${err.message}`);
        this.importingDlcs.set(false);
      },
    });
  }
}
