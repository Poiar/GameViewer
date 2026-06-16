import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "dashboard",
  },
  {
    path: "dashboard",
    loadComponent: () => import("./pages/dashboard-page.component").then((m) => m.DashboardPageComponent),
    data: { title: "Dashboard" },
  },
  {
    path: "collections",
    loadComponent: () => import("./pages/collections-page.component").then((m) => m.CollectionsPageComponent),
    data: { title: "Collections" },
  },
  {
    path: "collections/:id",
    loadComponent: () => import("./pages/collection-detail-page.component").then((m) => m.CollectionDetailPageComponent),
    data: { title: "Collection Detail" },
  },
  {
    path: "games",
    loadComponent: () => import("./pages/games-page.component").then((m) => m.GamesPageComponent),
    data: { title: "Games" },
  },
  {
    path: "games/:slug",
    loadComponent: () => import("./pages/game-detail-page.component").then((m) => m.GameDetailPageComponent),
    data: { title: "Game" },
  },
  {
    path: "series",
    loadComponent: () => import("./pages/series-page.component").then((m) => m.SeriesPageComponent),
    data: { title: "Series" },
  },
  {
    path: "series/:slug",
    loadComponent: () => import("./pages/series-detail-page.component").then((m) => m.SeriesDetailPageComponent),
    data: { title: "Series Detail" },
  },
  {
    path: "inventory",
    loadComponent: () => import("./pages/inventory-page.component").then((m) => m.InventoryPageComponent),
    data: { title: "Inventory" },
  },
  {
    path: "versions",
    loadComponent: () => import("./pages/versions-page.component").then((m) => m.VersionsPageComponent),
    data: { title: "Versions" },
  },
  {
    path: "favorites",
    loadComponent: () => import("./pages/favorites-page.component").then((m) => m.FavoritesPageComponent),
    data: { title: "Favorites" },
  },
  {
    path: "dlc",
    loadComponent: () => import("./pages/dlc-page.component").then((m) => m.DlcPageComponent),
    data: { title: "DLCs" },
  },
  {
    path: "platforms",
    loadComponent: () => import("./pages/platforms-page.component").then((m) => m.PlatformsPageComponent),
    data: { title: "Platforms" },
  },
  {
    path: "providers",
    loadComponent: () => import("./pages/providers-page.component").then((m) => m.ProvidersPageComponent),
    data: { title: "Providers" },
  },
  {
    path: "stats",
    loadComponent: () => import("./pages/stats-page.component").then((m) => m.StatsPageComponent),
    data: { title: "Stats & Analytics" },
  },
  {
    path: "timeline",
    loadComponent: () => import("./pages/timeline-page.component").then((m) => m.TimelinePageComponent),
    data: { title: "Timeline" },
  },
];
