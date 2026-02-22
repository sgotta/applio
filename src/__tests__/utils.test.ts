import { describe, it, expect, vi, afterEach } from "vitest";
import { filenameDateStamp } from "@/lib/utils";

describe("filenameDateStamp", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats date with dashes for en-US", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
    const result = filenameDateStamp("en-US");
    expect(result).toBe("06-15-2025");
  });

  it("formats date with dashes for es-AR", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 15));
    const result = filenameDateStamp("es-AR");
    expect(result).toBe("15-06-2025");
  });

  it("replaces slashes and dots with dashes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1));
    const result = filenameDateStamp("en-US");
    // Should not contain / or .
    expect(result).not.toMatch(/[\/\.]/);
    expect(result).toMatch(/^\d{2}-\d{2}-\d{4}$/);
  });
});
