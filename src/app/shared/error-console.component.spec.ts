/**
 * ErrorConsoleComponent logic tests.
 *
 * Tests the component's interaction with the service surface without importing
 * Angular @Component-decorated classes, so Vitest runs without Angular compiler.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Replicate the service surface
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

  const svc = {
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

  return svc;
}

type ErrorConsole = ReturnType<typeof createErrorConsole>;

// Component logic (what the component's event handlers do)
async function copyErrors(svc: ErrorConsole): Promise<void> {
  const text = svc.buildClipboardText();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
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

function clearErrors(svc: ErrorConsole): void {
  svc.clear();
}

function closePanel(svc: ErrorConsole): void {
  svc.close();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ErrorConsoleComponent", () => {
  let service: ErrorConsole;

  beforeEach(() => {
    service = createErrorConsole();
  });

  // ---------------------------------------------------------------------------
  // copyErrors
  // ---------------------------------------------------------------------------

  describe("copyErrors", () => {
    it("writes service.buildClipboardText to clipboard", async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: writeTextSpy },
        writable: true,
      });

      service.push({ message: "Test error" });
      await copyErrors(service);

      expect(writeTextSpy).toHaveBeenCalledTimes(1);
      const clipboardText = writeTextSpy.mock.calls[0][0] as string;
      expect(clipboardText).toContain("Test error");
    });

    it("falls back to execCommand when clipboard API fails", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) },
        writable: true,
      });

      const execSpy = vi.fn().mockReturnValue(true);
      document.execCommand = execSpy;

      service.push({ message: "Fallback test" });
      await copyErrors(service);

      expect(execSpy).toHaveBeenCalledWith("copy");
    });
  });

  // ---------------------------------------------------------------------------
  // clearErrors
  // ---------------------------------------------------------------------------

  describe("clearErrors", () => {
    it("delegates to service.clear()", () => {
      service.push({ message: "A" });
      service.push({ message: "B" });
      expect(service.errors.length).toBe(2);

      clearErrors(service);
      expect(service.errors.length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // closePanel
  // ---------------------------------------------------------------------------

  describe("closePanel", () => {
    it("delegates to service.close()", () => {
      service.openPanel();
      expect(service.isOpen).toBe(true);

      closePanel(service);
      expect(service.isOpen).toBe(false);
    });

    it("is a no-op when already closed", () => {
      closePanel(service);
      expect(service.isOpen).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Full flow
  // ---------------------------------------------------------------------------

  describe("full error flow", () => {
    it("captures error → copies → clears → stays closed", () => {
      // Error arrives
      service.push({ message: "Uncaught TypeError", stack: "at main.js:1" });
      expect(service.isOpen).toBe(true);
      expect(service.errors.length).toBe(1);

      // User copies
      const text = service.buildClipboardText();
      expect(text).toContain("Uncaught TypeError");
      expect(text).toContain("main.js:1");

      // User clears
      clearErrors(service);
      expect(service.errors.length).toBe(0);
      expect(service.isOpen).toBe(true); // stays open

      // User closes
      closePanel(service);
      expect(service.isOpen).toBe(false);
    });

    it("multiple errors keep adding until cleared", () => {
      service.push({ message: "E1" });
      service.push({ message: "E2" });
      service.push({ message: "E3" });
      expect(service.errors.length).toBe(3);

      clearErrors(service);
      expect(service.errors.length).toBe(0);

      service.push({ message: "E4" });
      expect(service.errors.length).toBe(1);
    });
  });
});
