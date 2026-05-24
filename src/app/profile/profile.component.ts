import { Component, ChangeDetectionStrategy, EventEmitter, Output, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../auth/auth.service";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  protected readonly authService = inject(AuthService);

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  protected displayName = "";
  protected email = "";

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.displayName = user.displayName;
      this.email = user.email;
    }
  }

  protected onSave(): void {
    if (this.displayName.trim()) {
      this.authService.updateProfile(this.displayName.trim(), this.email.trim());
    }
    this.save.emit();
  }

  protected onCancel(): void {
    this.cancel.emit();
  }
}
