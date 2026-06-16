import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-empty-state",
  standalone: true,
  template: `
    <div class="empty-container">
      <div class="empty-icon">{{ icon }}</div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-message">{{ message }}</p>
      @if (actionLabel && action.observed) {
        <button class="empty-action" (click)="action.emit()">{{ actionLabel }}</button>
      }
    </div>
  `,
  styles: [
    `
      .empty-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 24px;
        text-align: center;
        gap: 12px;
      }
      .empty-icon {
        font-size: 48px;
        margin-bottom: 8px;
        opacity: 0.5;
      }
      .empty-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-secondary);
      }
      .empty-message {
        font-size: 14px;
        color: var(--text-muted);
        max-width: 360px;
      }
      .empty-action {
        margin-top: 12px;
        padding: 8px 20px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-accent);
        background: var(--accent-glow);
        color: var(--accent);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-fast);
        font-family: inherit;
      }
      .empty-action:hover {
        background: var(--accent);
        color: white;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input() icon = "📭";
  @Input() title = "Nothing here";
  @Input() message = "No items to display.";
  @Input() actionLabel = "";
  @Output() action = new EventEmitter<void>();
}
