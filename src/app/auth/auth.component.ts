import { Component, ChangeDetectionStrategy, HostListener, ElementRef, inject, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "./auth.service";

@Component({
  selector: "app-auth",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./auth.component.html",
  styleUrls: ["./auth.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  protected readonly authService = inject(AuthService);
  private readonly elementRef = inject(ElementRef);

  readonly profileRequested = output<void>();

  protected dropdownOpen = false;
  protected loginUsername = "";
  protected loginPassword = "";
  protected loginError = "";

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (this.dropdownOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
      this.loginError = "";
    }
  }

  protected onLogin(): void {
    if (!this.loginUsername.trim() || !this.loginPassword.trim()) return;
    try {
      this.authService.login(this.loginUsername.trim(), this.loginPassword.trim());
      this.loginUsername = "";
      this.loginPassword = "";
      this.loginError = "";
      this.dropdownOpen = false;
    } catch {
      this.loginError = "Invalid username or password";
      this.loginPassword = "";
    }
  }

  protected onLogout(): void {
    this.authService.logout();
    this.dropdownOpen = false;
  }

  protected onProfile(): void {
    this.dropdownOpen = false;
    this.profileRequested.emit();
  }

  protected toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    if (!this.dropdownOpen) {
      this.loginError = "";
    }
  }
}
