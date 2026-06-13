import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useExport } from "@/hooks/useExport";

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  default: {
    get: mocks.apiGet,
  },
}));

describe("useExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:nati-nest-export"),
    });
    Object.defineProperty(window.URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("downloads an authenticated report export blob", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const blob = new Blob(["order,data"], { type: "text/csv" });
    mocks.apiGet.mockResolvedValueOnce({ data: blob });
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.downloadExport({ type: "orders", format: "csv", filter: "today" });
    });

    expect(mocks.apiGet).toHaveBeenCalledWith("/reports/export/orders", {
      params: {
        format: "csv",
        filter: "today",
        startDate: undefined,
        endDate: undefined,
      },
      responseType: "blob",
    });
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:nati-nest-export");
    expect(result.current.error).toBeNull();
    clickSpy.mockRestore();
  });

  it("surfaces a friendly export error", async () => {
    mocks.apiGet.mockRejectedValueOnce({ message: "Unable to reach reports service" });
    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.downloadExport({ type: "revenue", format: "xlsx", filter: "this_month" });
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Unable to reach reports service");
    });
    expect(result.current.isExporting).toBe(false);
  });
});
