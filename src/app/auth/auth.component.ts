import { Component, ChangeDetectionStrategy, HostListener, ElementRef, inject, OnInit, OnDestroy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "./auth.service";
import { AuthUiService } from "./auth-ui.service";

@Component({
  selector: "app-auth",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./auth.component.html",
  styleUrls: ["./auth.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent implements OnInit, OnDestroy {
  protected readonly authService = inject(AuthService);
  private readonly authUiService = inject(AuthUiService);
  private readonly elementRef = inject(ElementRef);

  protected dropdownOpen = false;
  protected loginUsername = "";
  protected loginPassword = "";
  protected loginError = "";
  protected showLoginPassword = false;

  private keydownHandler = (e: KeyboardEvent) => this.onKeydown(e);

  ngOnInit(): void {
    document.addEventListener("keydown", this.keydownHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener("keydown", this.keydownHandler);
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (this.dropdownOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
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
    }
  }

  protected onLogout(): void {
    this.authService.logout();
    this.closeDropdown();
  }

  protected onProfile(): void {
    this.closeDropdown();
    this.authUiService.openProfile();
  }

  protected toggleLoginPasswordVisibility(): void {
    this.showLoginPassword = !this.showLoginPassword;
  }

  protected toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    if (!this.dropdownOpen) {
      this.loginError = "";
    }
  }

  private closeDropdown(): void {
    this.dropdownOpen = false;
    this.loginError = "";
    this.showLoginPassword = false;
  }

  private onKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape" && this.dropdownOpen) {
      this.closeDropdown();
    }
  }
}
