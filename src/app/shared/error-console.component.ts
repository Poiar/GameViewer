import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { ErrorConsoleService } from "../services/error-console.service";

@Component({
  selector: "app-error-console",
  standalone: true,
  template: `
    <div id="vibe-error-console" class="vibe-error-console" [class.vibe-show]="service.isOpen()">
      <div class="vibe-error-head">
        <strong>Vibe Coder Error Console</strong>
        <div class="vibe-error-actions">
          <button (click)="copyErrors()">Copy Errors</button>
          <button (click)="clearErrors()">Clear</button>
          <button (click)="closePanel()">Close</button>
        </div>
      </div>

      <div id="vibe-error-list">
        @for (error of service.errors(); track error.id) {
          <div class="vibe-error-item">
            <b>{{ error.message }}</b>
            <div class="vibe-error-meta">
              {{ error.source || "inline/runtime" }}
              @if (error.line) {
                line {{ error.line }}
              }
              @if (error.col) {
                :{{ error.col }}
              }
              · {{ error.time }}
            </div>
            <pre>{{ error.stack || error.message }}</pre>
          </div>
        }
      </div>

      <div class="vibe-error-note">
        This opens automatically when JavaScript throws. Copy the error and paste it back into your AI.
      </div>
    </div>
  `,
  styles: [
    `
      .vibe-error-console {
        position: fixed;
        right: 18px;
        bottom: 18px;
        width: min(760px, calc(100vw - 36px));
        max-height: min(560px, calc(100vh - 36px));
        background: rgba(10, 11, 16, 0.97);
        color: #f7efdf;
        border: 1px solid rgba(255, 127, 145, 0.55);
        border-radius: 16px;
        box-shadow: 0 28px 80px rgba(0, 0, 0, 0.72);
        z-index: 999999;
        overflow: hidden;
        font-family: system-ui, sans-serif;
        display: none;
      }

      .vibe-error-console.vibe-show {
        display: flex;
        flex-direction: column;
      }

      .vibe-error-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border-bottom: 1px solid #444;
        background: #2a1118;
        flex-shrink: 0;
      }

      .vibe-error-head strong {
        color: #ffd8de;
        font-size: 13px;
      }

      .vibe-error-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .vibe-error-actions button {
        border: 1px solid #555;
        background: #1d1f2a;
        color: #f7efdf;
        border-radius: 8px;
        padding: 6px 8px;
        cursor: pointer;
        font-size: 12px;
        font-family: inherit;
        transition: background 0.15s;
      }

      .vibe-error-actions button:hover {
        background: #2a2d3a;
      }

      #vibe-error-list {
        padding: 12px;
        overflow: auto;
        flex: 1;
      }

      .vibe-error-item {
        border: 1px solid #444;
        background: #111;
        padding: 10px;
        border-radius: 10px;
        margin-bottom: 10px;
      }

      .vibe-error-item b {
        color: #ffd8de;
      }

      .vibe-error-meta {
        color: #aaa;
        font-size: 12px;
        margin-top: 4px;
      }

      .vibe-error-item pre {
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 180px;
        overflow: auto;
        margin: 8px 0 0;
        color: #f7efdf;
        font-size: 12px;
      }

      .vibe-error-note {
        color: #aaa;
        font-size: 12px;
        padding: 0 12px 12px;
        line-height: 1.35;
        flex-shrink: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorConsoleComponent {
  protected readonly service = inject(ErrorConsoleService);

  async copyErrors(): Promise<void> {
    const text = this.service.buildClipboardText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers / non-HTTPS
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }

  clearErrors(): void {
    this.service.clear();
  }

  closePanel(): void {
    this.service.close();
  }
}
