import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthComponent } from "./auth/auth.component";
import { ProfileComponent } from "./profile/profile.component";
import { ErrorConsoleComponent } from "./shared/error-console.component";
import { AuthUiService } from "./auth/auth-ui.service";
import { AuthService } from "./services/auth.service";
import { DashboardService } from "./services/dashboard.service";
import { FavoritesService } from "./services/favorites.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AuthComponent, ProfileComponent, ErrorConsoleComponent],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  private favoritesService = inject(FavoritesService);
  protected readonly authUiService = inject(AuthUiService);
  protected readonly authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  isMobileMenuOpen = signal(false);

  /** Dashboard counts for sidebar badges */
  navCounts = signal<{
    totalGames: number;
    totalUserOwned: number;
    totalReleases: number;
    totalSeries: number;
    totalCollections: number;
  } | null>(null);

  private keyHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.isMobileMenuOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  };

  ngOnInit(): void {
    document.addEventListener("keydown", this.keyHandler);
    // Fetch sidebar counts once logged in
    this.tryLoadCounts();
  }

  private tryLoadCounts(): void {
    if (this.authService.isLoggedIn()) {
      this.dashboardService.getStats().subscribe({
        next: (s) =>
          this.navCounts.set({
            totalGames: s.totalGames,
            totalUserOwned: s.totalUserOwned,
            totalReleases: s.totalReleases,
            totalSeries: s.totalSeries,
            totalCollections: s.totalCollections,
          }),
        error: () => {},
      });
    } else {
      // Poll until logged in (auth is async)
      setTimeout(() => this.tryLoadCounts(), 800);
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener("keydown", this.keyHandler);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
