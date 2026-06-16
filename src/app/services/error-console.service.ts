import { Injectable, signal } from "@angular/core";

export interface CapturedError {
  id: number;
  time: string;
  message: string;
  source: string;
  line: number | string;
  col: number | string;
  stack: string;
}

@Injectable({ providedIn: "root" })
export class ErrorConsoleService {
  private nextId = 1;

  readonly errors = signal<CapturedError[]>([]);
  readonly isOpen = signal(false);

  /** Programmatically push an error into the console. */
  push(error: Partial<CapturedError> & { message: string }): void {
    const entry: CapturedError = {
      id: this.nextId++,
      time: new Date().toLocaleTimeString(),
      message: error.message,
      source: error.source ?? "",
      line: error.line ?? "",
      col: error.col ?? "",
      stack: error.stack ?? error.message,
    };

    this.errors.update((arr) => [entry, ...arr]);
    this.isOpen.set(true);
  }

  /** Open the panel without adding an error. */
  open(): void {
    this.isOpen.set(true);
  }

  /** Close the panel. */
  close(): void {
    this.isOpen.set(false);
  }

  /** Clear all captured errors. */
  clear(): void {
    this.errors.set([]);
  }

  /** Build a plain-text representation of all errors for clipboard copy. */
  buildClipboardText(): string {
    if (this.errors().length === 0) return "No captured errors.";
    return this.errors()
      .map(
        (e, i) =>
          `#${i + 1} ${e.time}\n` +
          `${e.message}\n` +
          `${e.source || "inline/runtime"} ${e.line ? "line " + e.line : ""}${e.col ? ":" + e.col : ""}\n` +
          `${e.stack}`,
      )
      .join("\n\n");
  }
}
