import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { provideRouter, withHashLocation } from "@angular/router";
import { AppComponent } from "./app/app.component";
import { routes } from "./app/routes";
import { AuthInterceptor } from "./app/interceptors/auth.interceptor";
import { ErrorInterceptor } from "./app/interceptors/error.interceptor";
import { ErrorConsoleService } from "./app/services/error-console.service";

// Hardcoded data still loaded for backwards compatibility during migration
import "./classes/seriesData";
import "./classes/gameData";
import "./classes/superVersionData";
import "./classes/dlcData";
import "./classes/dlcVersionData";
import "./classes/gameVersionData";
import "./classes/collectionData";
import "./classes/ownedInstanceData";

// ---------------------------------------------------------------------------
// Global error hooks — pipes JS errors into the in-app error console
// ---------------------------------------------------------------------------

const errorConsole = new ErrorConsoleService();

window.addEventListener("error", (event: ErrorEvent) => {
  errorConsole.push({
    message: event.message || String(event.error || "Unknown error"),
    source: event.filename || "",
    line: event.lineno || "",
    col: event.colno || "",
    stack: event.error?.stack || "",
  });
});

window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  const reason = event.reason;
  errorConsole.push({
    message: reason?.message || String(reason || "Unhandled Promise rejection"),
    stack: reason?.stack || "",
  });
});

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes, withHashLocation()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: ErrorConsoleService, useValue: errorConsole },
  ],
}).catch((err) => console.error(err));
