"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import { MaterialIcon } from "@/components/stitch/MaterialIcon";
import { StatePanel } from "@/components/stitch/StatePanel";
import { useSocket } from "@/hooks/useSocket";
import { customerService } from "@/services/customerService";
import { useSessionStore } from "@/stores/sessionStore";
import { AssistanceType } from "@/types";
import { ClientApiError } from "@/types/api";
import { MenuCategory } from "@/types/domain";

// New components
import { CategoryTabBar } from "@/components/customer/menu/CategoryTabBar";
import { PopularItemsSection } from "@/components/customer/menu/PopularItemsSection";
import { SearchOverlay } from "@/components/customer/menu/SearchOverlay";
import { FloatingCartButton } from "@/components/customer/FloatingCartButton";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { CateringEnquiryForm } from "@/components/customer/CateringEnquiryForm";
import { MenuItemCard } from "@/components/modules/customer/MenuItemCard";
import { useCart } from "@/hooks/useCart";
import { MenuItemSkeleton } from "@/components/ui/Skeleton";

export default function CustomerMenuPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const { tableNumber, clearSession, sessionId } = useSessionStore();
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionId) {
      setPaymentCompleted(window.sessionStorage.getItem(`paymentCompleted_${sessionId}`) === "true");
    }
  }, [sessionId]);
  const {
    items,
    isOpen: isCartOpen,
    setIsOpen: setCartOpen,
    addItem,
    updateQuantity,
    updateInstructions,
    clearCart,
  } = useCart();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [serviceBusy, setServiceBusy] = useState<AssistanceType | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCateringFormOpen, setIsCateringFormOpen] = useState(false);

  useEffect(() => {
    const loadMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const menuCategories = await customerService.getMenu();
        setCategories(menuCategories);
      } catch (err) {
        const clientError = err as ClientApiError;
        setError(clientError.message || "Unable to load menu.");
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const accepted = () => setServiceMessage("Order accepted! Kitchen is on it.");
    const preparing = () => setServiceMessage("Your order is being prepared.");
    const ready = () => setServiceMessage("Order is ready!");
    const delivered = () => setServiceMessage("Enjoy your meal!");

    socket.on("order:accepted", accepted);
    socket.on("order:preparing", preparing);
    socket.on("order:ready", ready);
    socket.on("order:delivered", delivered);

    return () => {
      socket.off("order:accepted", accepted);
      socket.off("order:preparing", preparing);
      socket.off("order:ready", ready);
      socket.off("order:delivered", delivered);
    };
  }, [socket]);

  // Track active category as user scrolls
  useEffect(() => {
    if (loading || categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("cat-", "");
            setActiveCategory(id);
          }
        });
      },
      {
        rootMargin: "-120px 0px -60% 0px",
      }
    );

    const sections = document.querySelectorAll(".category-section");
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [loading, categories]);

  const allMenuItems = useMemo(() => {
    return categories.flatMap((category) =>
      (category.items ?? []).map((item) => ({ ...item, category })),
    );
  }, [categories]);

  const quantityFor = (id: string) => items.find((item) => item.id === id)?.quantity ?? 0;
  const instructionsFor = (id: string) =>
    items.find((item) => item.id === id)?.instructions ?? "";

  const placeOrder = async () => {
    if (!items.length) return;

    setPlacingOrder(true);
    setError(null);
    setServiceMessage(null);
    try {
      await customerService.placeOrder(items);
      clearCart();
      router.push("/customer/track");
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const requestService = async (requestType: AssistanceType) => {
    setServiceBusy(requestType);
    setServiceMessage(null);
    setError(null);
    try {
      const response = await customerService.requestAssistance(requestType);
      setServiceMessage(response.message || "Request sent. A server will assist you shortly.");
      if (requestType === AssistanceType.BILL) {
        router.push("/customer/bill");
      }
    } catch (err) {
      const clientError = err as ClientApiError;
      setError(clientError.message || "Unable to send request.");
    } finally {
      setServiceBusy(null);
    }
  };

  const endSession = () => {
    clearCart();
    clearSession();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 px-4 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-surface-raised animate-pulse" />
            <div className="h-5 w-24 bg-surface-raised rounded animate-pulse" />
          </div>
          <div className="h-10 w-10 rounded-full bg-surface-raised animate-pulse" />
        </div>
        {/* Tabs skeleton */}
        <div className="flex gap-2 overflow-x-hidden">
          <div className="h-9 w-20 bg-surface-raised rounded-lg shrink-0 animate-pulse" />
          <div className="h-9 w-24 bg-surface-raised rounded-lg shrink-0 animate-pulse" />
          <div className="h-9 w-16 bg-surface-raised rounded-lg shrink-0 animate-pulse" />
          <div className="h-9 w-28 bg-surface-raised rounded-lg shrink-0 animate-pulse" />
        </div>
        {/* Popular items section skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-32 bg-surface-raised rounded animate-pulse" />
          <div className="flex gap-4 overflow-x-hidden">
            <div className="h-44 w-36 bg-surface-base border border-border-default rounded-2xl shrink-0 animate-pulse" />
            <div className="h-44 w-36 bg-surface-base border border-border-default rounded-2xl shrink-0 animate-pulse" />
            <div className="h-44 w-36 bg-surface-base border border-border-default rounded-2xl shrink-0 animate-pulse" />
          </div>
        </div>
        {/* List items skeleton */}
        <div className="space-y-4 pt-4">
          <div className="h-5 w-24 bg-surface-raised rounded animate-pulse" />
          <MenuItemSkeleton />
          <MenuItemSkeleton />
          <MenuItemSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 pb-32">
      {placingOrder ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-surface-base p-6 shadow-2xl border border-border-default">
            <Loader label="Placing your order..." />
          </div>
        </div>
      ) : null}

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-40 mx-auto max-w-md bg-neutral-950/90 border-b border-border-default backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-brand-950 font-bold">
              {tableNumber ?? "--"}
            </div>
            <h1 className="text-display-xs font-bold text-text-primary">
              Table {tableNumber ?? "--"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary hover:text-text-primary transition-colors hover:bg-surface-raised"
              aria-label="Search menu"
            >
              <MaterialIcon name="search" />
            </button>
            <button
              type="button"
              onClick={endSession}
              className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary hover:text-text-primary transition-colors hover:bg-surface-raised"
              aria-label="Leave table session"
            >
              <MaterialIcon name="logout" />
            </button>
          </div>
        </div>

        {categories.length > 0 && (
          <CategoryTabBar
            categories={categories}
            activeCategory={activeCategory}
            onSelect={(id) => {
              setActiveCategory(id);
              if (id) {
                const element = document.getElementById(`cat-${id}`);
                if (element) {
                  const headerOffset = 130;
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.scrollY - headerOffset;
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                  });
                }
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          />
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pt-[136px]">
        {/* Quick Actions */}
        <div className="grid grid-cols-5 gap-2 px-4 py-4">
          <button
            type="button"
            onClick={() => requestService(AssistanceType.WATER)}
            disabled={Boolean(serviceBusy)}
            className="flex min-h-[48px] flex-col items-center justify-center rounded-xl bg-surface-raised border border-border-default p-2 text-label-xs text-brand-500 shadow-sm active:scale-95 transition-all disabled:opacity-50 hover:border-brand-500/50 hover:bg-surface-base"
          >
            <MaterialIcon name={serviceBusy === AssistanceType.WATER ? "sync" : "water_drop"} className={serviceBusy === AssistanceType.WATER ? "animate-spin" : ""} />
            Water
          </button>
          <button
            type="button"
            onClick={() => requestService(AssistanceType.PLATE)}
            disabled={Boolean(serviceBusy)}
            className="flex min-h-[48px] flex-col items-center justify-center rounded-xl bg-surface-raised border border-border-default p-2 text-label-xs text-brand-500 shadow-sm active:scale-95 transition-all disabled:opacity-50 hover:border-brand-500/50 hover:bg-surface-base"
          >
            <MaterialIcon name={serviceBusy === AssistanceType.PLATE ? "sync" : "restaurant"} className={serviceBusy === AssistanceType.PLATE ? "animate-spin" : ""} />
            Plate
          </button>
          <button
            type="button"
            onClick={() => requestService(AssistanceType.GENERAL)}
            disabled={Boolean(serviceBusy)}
            className="flex min-h-[48px] flex-col items-center justify-center rounded-xl bg-surface-raised border border-border-default p-2 text-label-xs text-brand-500 shadow-sm active:scale-95 transition-all disabled:opacity-50 hover:border-brand-500/50 hover:bg-surface-base"
          >
            <MaterialIcon name={serviceBusy === AssistanceType.GENERAL ? "sync" : "support_agent"} className={serviceBusy === AssistanceType.GENERAL ? "animate-spin" : ""} />
            Help
          </button>
          <button
            type="button"
            onClick={() => requestService(AssistanceType.BILL)}
            disabled={Boolean(serviceBusy) || paymentCompleted}
            className="flex min-h-[48px] flex-col items-center justify-center rounded-xl bg-surface-raised border border-border-default p-2 text-label-xs text-brand-500 shadow-sm active:scale-95 transition-all disabled:opacity-50 hover:border-brand-500/50 hover:bg-surface-base"
          >
            <MaterialIcon name={serviceBusy === AssistanceType.BILL ? "sync" : "receipt_long"} className={serviceBusy === AssistanceType.BILL ? "animate-spin" : ""} />
            Bill
          </button>
          <Link
            href="/customer/feedback"
            className="flex min-h-[48px] flex-col items-center justify-center rounded-xl bg-surface-raised border border-border-default p-2 text-label-xs text-brand-500 shadow-sm active:scale-95 transition-all hover:border-brand-500/50 hover:bg-surface-base"
          >
            <MaterialIcon name="star" />
            Rate
          </Link>
        </div>

        {serviceMessage ? (
          <div className="mx-4 mb-4 rounded-xl border border-semantic_info-500/20 bg-semantic_info-500/10 p-3 text-label-xs text-semantic_info-500">
            {serviceMessage}
          </div>
        ) : null}

        {error ? (
          <div className="mx-4">
            <StatePanel tone="error" title="Menu unavailable" message={error} />
          </div>
        ) : (
          <>
            {/* Popular Items Section */}
            <PopularItemsSection items={allMenuItems} />

            {/* Event Catering Promotion Banner */}
            <div className="mx-4 mb-6 mt-2 overflow-hidden rounded-2xl border border-border-default bg-surface-raised p-5 shadow-lg relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
              <p className="text-label-xs font-extrabold uppercase tracking-widest text-brand-500">Host with Nati Nest</p>
              <h3 className="mt-1 text-display-sm font-bold text-text-primary">Need Catering For Your Event?</h3>
              <p className="mt-1.5 text-body-sm leading-relaxed text-text-secondary">
                Custom menu planning, professional catering setups, and warm hospitality for corporate events, weddings, birthdays, and family gatherings.
              </p>
              <button
                type="button"
                onClick={() => setIsCateringFormOpen(true)}
                className="mt-4 min-h-[44px] rounded-xl bg-brand-500 hover:bg-brand-400 px-4 py-2 text-label-sm font-bold text-brand-950 transition-all active:scale-95 shadow-md shadow-brand-500/10"
              >
                Plan Your Event
              </button>
            </div>

            {/* Category Groups */}
            <div className="space-y-8 pb-12">
              {categories.map((category) => {
                const categoryItems = (category.items ?? []).map((item) => ({ ...item, category }));
                if (categoryItems.length === 0) return null;

                return (
                  <div
                    key={category.id}
                    id={`cat-${category.id}`}
                    className="category-section scroll-mt-[130px]"
                  >
                    <h2 className="text-label-sm font-bold text-text-tertiary px-4 mb-3 uppercase tracking-wider">
                      {category.name}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
                      {categoryItems.map((item) => {
                        const quantity = quantityFor(item.id);
                        return (
                          <div key={item.id} className="space-y-2">
                            <MenuItemCard
                              item={item}
                              quantity={quantity}
                              onAdd={() => addItem(item)}
                              onIncrement={() => updateQuantity(item.id, quantity + 1)}
                              onDecrement={() => updateQuantity(item.id, quantity - 1)}
                            />
                            {quantity > 0 ? (
                              <label className="mt-2 block rounded-xl bg-surface-raised border border-border-default p-3 shadow-sm">
                                <span className="text-label-xs font-semibold text-text-tertiary block mb-1">
                                  Special instructions
                                </span>
                                <input
                                  value={instructionsFor(item.id)}
                                  onChange={(event) => updateInstructions(item.id, event.target.value)}
                                  className="h-10 w-full rounded-lg border border-border-default bg-surface-base px-3 text-body-xs text-text-primary placeholder-text-tertiary outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                  placeholder="Less spicy, no onion..."
                                />
                              </label>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>


      <FloatingCartButton />

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        items={allMenuItems}
        onAdd={addItem}
      />

      <CateringEnquiryForm
        isOpen={isCateringFormOpen}
        onClose={() => setIsCateringFormOpen(false)}
      />
    </div>
  );
}
