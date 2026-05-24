import { Injectable, signal } from "@angular/core";

@Injectable({ providedIn: "root" })
export class AuthUiService {
  private readonly profileVisible = signal(false);
  readonly showProfile = this.profileVisible.asReadonly();

  openProfile(): void {
    this.profileVisible.set(true);
  }

  closeProfile(): void {
    this.profileVisible.set(false);
  }
}
