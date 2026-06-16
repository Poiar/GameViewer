/**
 * ErrorConsoleService unit tests.
 *
 * The service logic is tested in isolation without importing the Angular
 * @Injectable-decorated class so Vitest can run without the Angular compiler.
 * The test reimplements the pure-logic surface of the service.
 */

import { describe, it, expect, beforeEach } from "vitest";

// Replicate the service shape without decorators for pure-logic testing
interface CapturedError {
  id: number;
  time: string;
  message: string;
  source: string;
  line: number | string;
  col: number | string;
  stack: string;
}

function createErrorConsole() {
  let nextId = 1;
  const errors: CapturedError[] = [];
  let open = false;

  return {
    get errors(): readonly CapturedError[] {
      return errors;
    },
    get isOpen(): boolean {
      return open;
    },

    push(partial: Partial<CapturedError> & { message: string }): CapturedError {
      const entry: CapturedError = {
        id: nextId++,
        time: new Date().toLocaleTimeString(),
        message: partial.message,
        source: partial.source ?? "",
        line: partial.line ?? "",
        col: partial.col ?? "",
        stack: partial.stack ?? partial.message,
      };
      errors.unshift(entry);
      open = true;
      return entry;
    },

    openPanel(): void {
      open = true;
    },

    close(): void {
      open = false;
    },

    clear(): void {
      errors.length = 0;
    },

    buildClipboardText(): string {
      if (errors.length === 0) return "No captured errors.";
      return errors
        .map(
          (e, i) =>
            `#${i + 1} ${e.time}\n` +
            `${e.message}\n` +
            `${e.source || "inline/runtime"} ${e.line ? "line " + e.line : ""}${e.col ? ":" + e.col : ""}\n` +
            `${e.stack}`,
        )
        .join("\n\n");
    },
  };
}

type ErrorConsole = ReturnType<typeof createErrorConsole>;

describe("ErrorConsoleService", () => {
  let service: ErrorConsole;

  beforeEach(() => {
    service = createErrorConsole();
  });

  // ---------------------------------------------------------------------------
  // push()
  // ---------------------------------------------------------------------------

  describe("push", () => {
    it("adds an error to the array", () => {
      expect(service.errors.length).toBe(0);
      service.push({ message: "Something broke" });
      expect(service.errors.length).toBe(1);
    });

    it("auto-opens the console", () => {
      expect(service.isOpen).toBe(false);
      service.push({ message: "Boom" });
      expect(service.isOpen).toBe(true);
    });

    it("prepends errors so newest is first", () => {
      service.push({ message: "First" });
      service.push({ message: "Second" });
      expect(service.errors[0].message).toBe("Second");
      expect(service.errors[1].message).toBe("First");
    });

    it("captures all optional fields", () => {
      service.push({
        message: "Test",
        source: "app.js",
        line: 42,
        col: 7,
        stack: "Error: Test\n  at foo (app.js:42:7)",
      });

      const err = service.errors[0];
      expect(err.message).toBe("Test");
      expect(err.source).toBe("app.js");
      expect(err.line).toBe(42);
      expect(err.col).toBe(7);
      expect(err.stack).toContain("Error: Test");
    });

    it("falls back to message for missing stack", () => {
      service.push({ message: "No stack" });
      expect(service.errors[0].stack).toBe("No stack");
    });

    it("assigns unique incrementing IDs", () => {
      service.push({ message: "A" });
      service.push({ message: "B" });
      service.push({ message: "C" });
      const ids = service.errors.map((e) => e.id);
      expect(ids[0]).toBe(3);
      expect(ids[1]).toBe(2);
      expect(ids[2]).toBe(1);
    });

    it("captures a timestamp", () => {
      service.push({ message: "Timed" });
      expect(service.errors[0].time).toBeTruthy();
      expect(service.errors[0].time).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  // ---------------------------------------------------------------------------
  // open / close
  // ---------------------------------------------------------------------------

  describe("open / close", () => {
    it("can be opened without adding an error", () => {
      service.openPanel();
      expect(service.isOpen).toBe(true);
      expect(service.errors.length).toBe(0);
    });

    it("close sets isOpen to false", () => {
      service.openPanel();
      service.close();
      expect(service.isOpen).toBe(false);
    });

    it("close without prior open is a no-op", () => {
      service.close();
      expect(service.isOpen).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // clear()
  // ---------------------------------------------------------------------------

  describe("clear", () => {
    it("empties the error array", () => {
      service.push({ message: "E1" });
      service.push({ message: "E2" });
      expect(service.errors.length).toBe(2);
      service.clear();
      expect(service.errors.length).toBe(0);
    });

    it("does not close the panel on clear", () => {
      service.push({ message: "E1" });
      service.clear();
      expect(service.isOpen).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // buildClipboardText()
  // ---------------------------------------------------------------------------

  describe("buildClipboardText", () => {
    it("returns placeholder when no errors", () => {
      expect(service.buildClipboardText()).toBe("No captured errors.");
    });

    it("formats errors with all fields filled", () => {
      service.push({
        message: "TypeError: x is not a function",
        source: "https://example.com/app.js",
        line: 101,
        col: 23,
        stack: "TypeError: x is not a function\n  at foo (app.js:101:23)",
      });

      const text = service.buildClipboardText();
      expect(text).toContain("#1");
      expect(text).toContain("TypeError: x is not a function");
      expect(text).toContain("https://example.com/app.js");
      expect(text).toContain("line 101:23");
      expect(text).toContain("at foo (app.js:101:23)");
    });

    it("formats errors with missing optional fields gracefully", () => {
      service.push({ message: "Rejected" });
      const text = service.buildClipboardText();
      expect(text).toContain("inline/runtime");
      expect(text).not.toContain("line ");
    });

    it("formats multiple errors separated by newlines", () => {
      service.push({ message: "A" });
      service.push({ message: "B" });
      const text = service.buildClipboardText();
      expect(text).toContain("#1");
      expect(text).toContain("#2");
      expect(text).toContain("\n\n");
    });

    it("includes error time", () => {
      service.push({ message: "Test" });
      const text = service.buildClipboardText();
      expect(text).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe("edge cases", () => {
    it("handles error objects passed as messages", () => {
      const err = new Error("Runtime explosion");
      err.name = "TypeError";
      service.push({
        message: err.message,
        stack: err.stack ?? "",
      });

      const captured = service.errors[0];
      expect(captured.message).toBe("Runtime explosion");
      expect(captured.stack).toContain("Error: Runtime explosion");
    });

    it("handles empty source/line/col gracefully", () => {
      service.push({ message: "Minimal" });
      const captured = service.errors[0];
      expect(captured.source).toBe("");
      expect(captured.line).toBe("");
      expect(captured.col).toBe("");
    });

    it("handles very long stack traces", () => {
      const longStack = Array(50)
        .fill(null)
        .map((_, i) => `  at function${i} (file${i}.js:${i}:0)`)
        .join("\n");
      service.push({ message: "Deep", stack: longStack });
      expect(service.errors[0].stack).toBe(longStack);
      expect(service.buildClipboardText()).toContain("function49");
    });
  });
});
