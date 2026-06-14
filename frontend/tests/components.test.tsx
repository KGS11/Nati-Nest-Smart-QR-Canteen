import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { EmojiRating } from "@/components/customer/feedback/EmojiRating";
import { PaymentMethodSelector } from "@/components/customer/PaymentMethodSelector";
import { OrderStatusTimeline } from "@/components/customer/tracking/OrderStatusTimeline";
import { FloatingCartButton } from "@/components/customer/FloatingCartButton";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { useCartStore } from "@/stores/cartStore";

// Mock customerService
const mocks = vi.hoisted(() => ({
  placeOrder: vi.fn(),
}));

vi.mock("@/services/customerService", () => ({
  customerService: {
    placeOrder: mocks.placeOrder,
  },
}));

describe("Customer View Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.getState().clearCart();
    useCartStore.setState({ isOpen: false });
  });

  describe("EmojiRating Component", () => {
    it("renders rating labels and star buttons and calls onChange on click", () => {
      const handleChange = vi.fn();
      render(<EmojiRating value={null} onChange={handleChange} />);

      expect(screen.getByText("Good")).toBeInTheDocument();
      expect(screen.getByText("Amazing")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Good"));
      expect(handleChange).toHaveBeenCalledWith(3);

      // Star buttons are rendered
      const stars = screen.getAllByLabelText(/Rate \d stars/i);
      expect(stars).toHaveLength(5);

      fireEvent.click(stars[4]);
      expect(handleChange).toHaveBeenCalledWith(5);
    });

    it("displays the correct rating label for selected value", () => {
      const handleChange = vi.fn();
      render(<EmojiRating value={4} onChange={handleChange} />);
      expect(screen.getAllByText("Great")[0]).toBeInTheDocument();
    });
  });

  describe("PaymentMethodSelector Component", () => {
    it("renders payment options and total amount", () => {
      const handlePaymentRequested = vi.fn();
      render(
        <PaymentMethodSelector
          sessionId="test-session"
          totalAmount={150.5}
          onPaymentRequested={handlePaymentRequested}
        />
      );

      expect(screen.getByText(/Total:\s*Rs\s*150\.50/)).toBeInTheDocument();
      expect(screen.getByText("Pay with Cash")).toBeInTheDocument();
      expect(screen.getByText("Pay Online (UPI)")).toBeInTheDocument();

      // Submit button is disabled initially because no method is selected
      const continueBtn = screen.getByRole("button", { name: /continue/i });
      expect(continueBtn).toBeDisabled();
    });

    it("enables continue button when a method is chosen", () => {
      const handlePaymentRequested = vi.fn();
      render(
        <PaymentMethodSelector
          sessionId="test-session"
          totalAmount={150.5}
          onPaymentRequested={handlePaymentRequested}
        />
      );

      const cashOption = screen.getByText("Pay with Cash").closest("div");
      expect(cashOption).toBeTruthy();
      fireEvent.click(cashOption!);

      const continueBtn = screen.getByRole("button", { name: /continue/i });
      expect(continueBtn).toBeEnabled();
    });
  });

  describe("OrderStatusTimeline Component", () => {
    it("renders vertical status steps", () => {
      render(
        <OrderStatusTimeline
          status={"PREPARING" as any}
          placedAt={new Date().toISOString()}
          acceptedAt={new Date().toISOString()}
          preparingAt={new Date().toISOString()}
          readyAt={null}
          deliveredAt={null}
        />
      );

      expect(screen.getByText("Order Placed")).toBeInTheDocument();
      expect(screen.getByText("Accepted")).toBeInTheDocument();
      expect(screen.getByText("Preparing")).toBeInTheDocument();
      expect(screen.getByText("Ready")).toBeInTheDocument();
      expect(screen.getByText("Delivered")).toBeInTheDocument();
    });
  });

  describe("FloatingCartButton Component", () => {
    it("renders empty state if cart is empty", () => {
      render(<FloatingCartButton />);
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("Empty Cart")).toBeInTheDocument();
      expect(screen.getByText(/Rs\s*0\.00/)).toBeInTheDocument();
    });

    it("renders count and subtotal when items are present", () => {
      useCartStore.getState().addItem({
        id: "item-1",
        name: "Mock Item",
        price: 99.0,
        categoryId: "cat-1",
        isAvailable: true,
      });

      render(<FloatingCartButton />);
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("View Cart")).toBeInTheDocument();
      expect(screen.getByText(/Rs\s*99\.00/)).toBeInTheDocument();
    });

    it("opens the cart drawer on click", () => {
      useCartStore.getState().addItem({
        id: "item-1",
        name: "Mock Item",
        price: 99.0,
        categoryId: "cat-1",
        isAvailable: true,
      });

      render(<FloatingCartButton />);
      const btn = screen.getByRole("button");
      fireEvent.click(btn);
      expect(useCartStore.getState().isOpen).toBe(true);
    });
  });

  describe("CartDrawer Component", () => {
    it("renders empty state when drawer is open and cart is empty", () => {
      useCartStore.setState({ isOpen: true });
      render(<CartDrawer />);
      expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    });

    it("renders items, subtotal, and allows order placement", async () => {
      useCartStore.setState({ isOpen: true });
      useCartStore.getState().addItem({
        id: "item-1",
        name: "Noodles",
        price: 120.0,
        categoryId: "cat-1",
        isAvailable: true,
      });

      render(<CartDrawer />);
      expect(screen.getByText("Noodles")).toBeInTheDocument();
      expect(screen.getAllByText(/120\.00/)[0]).toBeInTheDocument();

      // Click Place Order to trigger confirmation dialog
      const placeOrderBtn = screen.getByRole("button", { name: /place order/i });
      fireEvent.click(placeOrderBtn);

      expect(screen.getByText("Confirm your order?")).toBeInTheDocument();

      // Mock placeOrder success
      mocks.placeOrder.mockResolvedValueOnce({ success: true });

      const confirmBtn = screen.getByRole("button", { name: /confirm/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mocks.placeOrder).toHaveBeenCalledWith([
          expect.objectContaining({ id: "item-1", quantity: 1 }),
        ]);
      });
    });
  });
});
