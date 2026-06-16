import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "dashboard",
  },
  {
    path: "dashboard",
    loadComponent: () =>
      import("./pages/dashboard-page.component").then(
        (m) => m.DashboardPageComponent,
      ),
    data: { title: "Dashboard" },
  },
  {
    path: "explore",
    loadComponent: () =>
      import("./pages/explore-page.component").then(
        (m) => m.ExplorePageComponent,
      ),
    data: { title: "Explore" },
  },
  {
    path: "collections",
    loadComponent: () =>
      import("./pages/collections-page.component").then(
        (m) => m.CollectionsPageComponent,
      ),
    data: { title: "Collections" },
  },
  {
    path: "games",
    loadComponent: () =>
      import("./pages/games-page.component").then(
        (m) => m.GamesPageComponent,
      ),
    data: { title: "Games" },
  },
  {
    path: "series",
    loadComponent: () =>
      import("./pages/series-page.component").then(
        (m) => m.SeriesPageComponent,
      ),
    data: { title: "Series" },
  },
  {
    path: "inventory",
    loadComponent: () =>
      import("./pages/inventory-page.component").then(
        (m) => m.InventoryPageComponent,
      ),
    data: { title: "Inventory" },
  },
  {
    path: "versions",
    loadComponent: () =>
      import("./pages/versions-page.component").then(
        (m) => m.VersionsPageComponent,
      ),
    data: { title: "Versions" },
  },
];
