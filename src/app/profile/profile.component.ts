import {
  Component,
  ChangeDetectionStrategy,
  EventEmitter,
  Output,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit, OnDestroy {
  protected readonly authService = inject(AuthService);

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @ViewChild("firstInput") firstInput?: ElementRef<HTMLInputElement>;

  protected displayName = "";
  protected email = "";
  protected currentPassword = "";
  protected newPassword = "";
  protected profileError = "";
  protected loading = false;

  protected showCurrentPassword = false;
  protected showNewPassword = false;
  protected showPasswordChange = false;

  private keydownHandler = (e: KeyboardEvent) => this.onKeydown(e);

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.displayName = user.displayName;
      this.email = user.email;
    }
    document.addEventListener("keydown", this.keydownHandler);
    setTimeout(() => this.firstInput?.nativeElement.focus(), 50);
  }

  ngOnDestroy(): void {
    document.removeEventListener("keydown", this.keydownHandler);
  }

  protected onSave(): void {
    if (!this.displayName.trim()) return;
    if (!this.currentPassword.trim()) {
      this.profileError = "Current password is required to save changes";
      return;
    }
    this.loading = true;
    this.profileError = "";

    this.authService.updateProfile(this.displayName.trim(), this.email.trim(), this.currentPassword).subscribe({
      next: () => {
        if (this.newPassword) {
          this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
            next: () => {
              this.loading = false;
              this.save.emit();
            },
            error: (err) => {
              this.profileError = err.message ?? "Failed to change password";
              this.loading = false;
            },
          });
        } else {
          this.loading = false;
          this.save.emit();
        }
      },
      error: (err) => {
        this.profileError = err.message ?? "Failed to update profile";
        this.loading = false;
      },
    });
  }

  protected onCancel(): void {
    this.cancel.emit();
  }

  protected toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  protected toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  private onKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      this.onCancel();
      return;
    }
    if (e.key === "Tab") {
      const modal = document.querySelector(".profile-modal") as HTMLElement;
      if (!modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }
}
