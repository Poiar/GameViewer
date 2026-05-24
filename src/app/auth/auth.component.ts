import { Component, ChangeDetectionStrategy, HostListener, ElementRef, inject } from "@angular/core";
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

  protected dropdownOpen = false;
  protected loginUsername = "";

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (this.dropdownOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  protected onLogin(): void {
    if (!this.loginUsername.trim()) return;
    try {
      this.authService.login(this.loginUsername.trim());
      this.loginUsername = "";
    } catch {
      this.loginUsername = "";
    } finally {
      this.dropdownOpen = false;
    }
  }

  protected onLogout(): void {
    this.authService.logout();
    this.dropdownOpen = false;
  }

  protected toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }
}
