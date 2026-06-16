import { Component, Input, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-loading-spinner",
  standalone: true,
  template: `
    <div class="spinner-container" [class.inline]="inline">
      <div class="spinner"></div>
      @if (message) {
        <span class="spinner-message">{{ message }}</span>
      }
    </div>
  `,
  styles: [
    `
      .spinner-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        gap: 16px;
      }
      .spinner-container.inline {
        padding: 16px;
      }
      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--border-subtle);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .spinner-message {
        font-size: 14px;
        color: var(--text-muted);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent {
  @Input() message = "";
  @Input() inline = false;
}
