import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CashPaymentConfirmation } from "@/components/customer/CashPaymentConfirmation";
import { UpiPaymentDisplay } from "@/components/customer/UpiPaymentDisplay";
import { FeedbackSuccess } from "@/components/customer/feedback/FeedbackSuccess";
import { AssistanceType } from "@/types";

const mocks = vi.hoisted(() => ({
  requestAssistance: vi.fn(),
  apiGet: vi.fn(),
  socketOn: vi.fn(),
  socketOff: vi.fn(),
}));

vi.mock("@/services/customerService", () => ({
  customerService: {
    requestAssistance: mocks.requestAssistance,
  },
}));

vi.mock("@/lib/api-client", () => ({
  default: {
    get: mocks.apiGet,
  },
}));

vi.mock("@/hooks/useSocket", () => ({
  useSocket: () => ({
    socket: {
      on: mocks.socketOn,
      off: mocks.socketOff,
    },
  }),
}));

describe("customer payment and feedback components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mocks.apiGet.mockResolvedValue({
      data: {
        success: true,
        data: { qrDataUrl: "https://example.com/upi.png" },
      },
    });
  });

  it("notifies the server for cash payment and calls the refresh callback", async () => {
    vi.useFakeTimers();
    const onRequested = vi.fn();
    mocks.requestAssistance.mockResolvedValueOnce({});

    render(
      <CashPaymentConfirmation
        sessionId="session-1"
        totalAmount={160}
        onRequested={onRequested}
        onBack={vi.fn()}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /notify waiter/i }));
    });

    expect(mocks.requestAssistance).toHaveBeenCalledWith(AssistanceType.BILL);
    expect(screen.getByText(/Waiter has been notified/i)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(onRequested).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("shows a friendly cash payment error when notification fails", async () => {
    mocks.requestAssistance.mockRejectedValueOnce({ message: "Server unavailable" });

    render(
      <CashPaymentConfirmation
        sessionId="session-1"
        totalAmount={160}
        onRequested={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /notify waiter/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Server unavailable");
  });

  it("renders the UPI payment UI and sends a bill notification after payment", async () => {
    mocks.requestAssistance.mockResolvedValueOnce({});

    render(<UpiPaymentDisplay sessionId="session-1" totalAmount={160} onBack={vi.fn()} />);

    // The new UI shows "Online Payment" heading and a scanner button
    expect(screen.getByText("Online Payment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open camera scanner/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /completed payment/i }));

    await waitFor(() => {
      expect(mocks.requestAssistance).toHaveBeenCalledWith(AssistanceType.BILL);
    });
    expect(screen.getByText(/Payment notification sent/i)).toBeInTheDocument();
  });

  it("shows UPI confirmation when the payment socket event arrives", async () => {
    let confirmPayment: () => void = () => undefined;
    mocks.socketOn.mockImplementation((event: string, callback: () => void) => {
      if (event === "payment:confirmed") {
        confirmPayment = callback;
      }
    });

    render(<UpiPaymentDisplay sessionId="session-1" totalAmount={160} onBack={vi.fn()} />);

    // Wait for the UI to render
    expect(screen.getByText("Online Payment")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /completed payment/i }));
    confirmPayment();

    expect(await screen.findByText(/Payment Confirmed/i)).toBeInTheDocument();
  });

  it("renders rating-specific feedback success content and actions", () => {
    const onContinue = vi.fn();

    render(<FeedbackSuccess rating={5} onContinue={onContinue} />);

    expect(screen.getByText("5/5")).toBeInTheDocument();
    expect(screen.getByText(/great rating/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /catering/i })).toHaveAttribute(
      "href",
      "/customer/catering",
    );

    fireEvent.click(screen.getByRole("button", { name: /finish/i }));
    expect(onContinue).toHaveBeenCalled();
  });
});
