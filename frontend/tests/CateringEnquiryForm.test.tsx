import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CateringEnquiryForm } from "@/components/customer/CateringEnquiryForm";

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  default: {
    post: mocks.apiPost,
  },
}));

const fillValidForm = () => {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Arun Kumar" } });
  fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9876543210" } });
  fireEvent.change(screen.getByLabelText("Event date"), { target: { value: "2099-01-01" } });
  fireEvent.change(screen.getByLabelText("Guests"), { target: { value: "80" } });
  fireEvent.change(screen.getByLabelText("Location"), { target: { value: "Sports Club Hall" } });
  fireEvent.change(screen.getByLabelText(/requirements/i), {
    target: { value: "South Indian buffet" },
  });
};

describe("CateringEnquiryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    const { container } = render(<CateringEnquiryForm isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("validates required customer enquiry fields before submitting", async () => {
    render(<CateringEnquiryForm isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /send enquiry/i }));

    expect(await screen.findByText("Name must be at least 2 characters.")).toBeInTheDocument();
    expect(screen.getByText("Phone must be 10 digits.")).toBeInTheDocument();
    expect(screen.getByText("Event date must be in the future.")).toBeInTheDocument();
    expect(mocks.apiPost).not.toHaveBeenCalled();
  });

  it("submits a valid enquiry to the catering enquiries endpoint", async () => {
    const onClose = vi.fn();
    mocks.apiPost.mockResolvedValueOnce({ data: { success: true } });
    render(<CateringEnquiryForm isOpen onClose={onClose} />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /send enquiry/i }));

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith(
        "/catering/enquiries",
        expect.objectContaining({
          name: "Arun Kumar",
          phone: "9876543210",
          eventDate: "2099-01-01",
          guestCount: 80,
          location: "Sports Club Hall",
          notes: "South Indian buffet",
        }),
      );
    });
    expect(await screen.findByText("Enquiry sent")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows a friendly API error when submission fails", async () => {
    mocks.apiPost.mockRejectedValueOnce({ message: "Server unavailable" });
    render(<CateringEnquiryForm isOpen onClose={vi.fn()} />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /send enquiry/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Server unavailable");
  });
});
