import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-error-state",
  standalone: true,
  template: `
    <div class="error-container">
      <div class="error-icon">!</div>
      <div class="error-content">
        <h3 class="error-title">{{ title }}</h3>
        <p class="error-message">{{ message }}</p>
      </div>
      @if (retry.observed) {
        <button class="retry-btn" (click)="retry.emit()">Retry</button>
      }
    </div>
  `,
  styles: [
    `
      .error-container {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px 24px;
        background: rgba(247, 110, 110, 0.08);
        border: 1px solid rgba(247, 110, 110, 0.2);
        border-radius: var(--radius-md);
      }
      .error-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(247, 110, 110, 0.15);
        color: var(--accent-warn);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 18px;
        flex-shrink: 0;
      }
      .error-content {
        flex: 1;
        min-width: 0;
      }
      .error-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--accent-warn);
        margin-bottom: 2px;
      }
      .error-message {
        font-size: 13px;
        color: var(--text-secondary);
      }
      .retry-btn {
        flex-shrink: 0;
        padding: 6px 16px;
        border-radius: var(--radius-sm);
        border: 1px solid rgba(247, 110, 110, 0.25);
        background: transparent;
        color: var(--accent-warn);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-fast);
        font-family: inherit;
      }
      .retry-btn:hover {
        background: rgba(247, 110, 110, 0.15);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  @Input() title = "Something went wrong";
  @Input() message = "An error occurred while loading data.";
  @Output() retry = new EventEmitter<void>();
}
