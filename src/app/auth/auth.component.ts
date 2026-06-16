import {
  Component,
  ChangeDetectionStrategy,
  HostListener,
  ElementRef,
  inject,
  OnInit,
  OnDestroy,
  computed,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../services/auth.service";
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
  protected mode: "login" | "register" = "login";

  protected loginUsername = "";
  protected loginPassword = "";
  protected registerUsername = "";
  protected registerDisplayName = "";
  protected registerEmail = "";
  protected registerPassword = "";
  protected authError = "";
  protected loading = false;

  protected showLoginPassword = false;
  protected showRegisterPassword = false;

  protected initials = computed(() => {
    const u = this.authService.user();
    if (!u?.displayName) return "";
    return u.displayName
      .split(" ")
      .filter((p) => p.length > 0)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  });

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
    this.loading = true;
    this.authError = "";
    this.authService.login(this.loginUsername.trim(), this.loginPassword.trim()).subscribe({
      next: () => {
        this.loginUsername = "";
        this.loginPassword = "";
        this.loading = false;
        this.dropdownOpen = false;
      },
      error: (err) => {
        this.authError = err.message ?? "Invalid username or password";
        this.loading = false;
      },
    });
  }

  protected onRegister(): void {
    if (
      !this.registerUsername.trim() ||
      !this.registerDisplayName.trim() ||
      !this.registerEmail.trim() ||
      !this.registerPassword.trim()
    )
      return;
    if (this.registerPassword.length < 8) {
      this.authError = "Password must be at least 8 characters";
      return;
    }
    this.loading = true;
    this.authError = "";
    this.authService
      .register(
        this.registerUsername.trim(),
        this.registerDisplayName.trim(),
        this.registerEmail.trim(),
        this.registerPassword.trim(),
      )
      .subscribe({
        next: () => {
          this.registerUsername = "";
          this.registerDisplayName = "";
          this.registerEmail = "";
          this.registerPassword = "";
          this.loading = false;
          this.dropdownOpen = false;
        },
        error: (err) => {
          this.authError = err.message ?? "Registration failed";
          this.loading = false;
        },
      });
  }

  protected switchMode(mode: "login" | "register"): void {
    this.mode = mode;
    this.authError = "";
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

  protected toggleRegisterPasswordVisibility(): void {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  protected toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    if (!this.dropdownOpen) {
      this.authError = "";
    }
  }

  private closeDropdown(): void {
    this.dropdownOpen = false;
    this.authError = "";
    this.showLoginPassword = false;
    this.showRegisterPassword = false;
    this.mode = "login";
  }

  private onKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape" && this.dropdownOpen) {
      this.closeDropdown();
    }
  }
}
