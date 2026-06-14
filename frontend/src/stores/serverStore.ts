import { create } from 'zustand'
import {
  ReadyOrder,
  AssistanceRequest,
  PendingPayment
} from '@/types/server.types'

interface ServerState {
  readyOrders: ReadyOrder[]
  assistanceRequests: AssistanceRequest[]
  pendingPayments: PendingPayment[]
  isLoading: boolean
  error: string | null
  isConnected: boolean
  activeModal:
    | { type: 'payment'; paymentId: string; tableNumber: string }
    | { type: 'bill'; sessionId: string; tableNumber: string }
    | null

  setReadyOrders: (orders: ReadyOrder[]) => void
  addReadyOrder: (order: ReadyOrder) => void
  updateReadyOrder: (orderId: string, fields: Partial<ReadyOrder>) => void
  removeReadyOrder: (orderId: string) => void

  setAssistanceRequests: (requests: AssistanceRequest[]) => void
  addAssistanceRequest: (request: AssistanceRequest) => void
  resolveAssistanceRequest: (requestId: string) => void

  setPendingPayments: (payments: PendingPayment[]) => void
  addPendingPayment: (payment: PendingPayment) => void
  removePendingPayment: (paymentId: string) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setConnected: (connected: boolean) => void
  openModal: (modal: ServerState['activeModal']) => void
  closeModal: () => void
}

export const useServerStore = create<ServerState>()(
  (set) => ({
    readyOrders: [],
    assistanceRequests: [],
    pendingPayments: [],
    isLoading: false,
    error: null,
    isConnected: false,
    activeModal: null,

    setReadyOrders: (readyOrders) => set({ readyOrders }),
    addReadyOrder: (order) =>
      set(state => ({
        readyOrders: [
          ...state.readyOrders.filter(existing => existing.id !== order.id),
          order
        ]
      })),
    updateReadyOrder: (orderId, fields) =>
      set(state => ({
        readyOrders: state.readyOrders.map(o =>
          o.id === orderId ? { ...o, ...fields } : o
        )
      })),
    removeReadyOrder: (orderId) =>
      set(state => ({
        readyOrders: state.readyOrders.filter(
          o => o.id !== orderId
        )
      })),

    setAssistanceRequests: (assistanceRequests) =>
      set({ assistanceRequests }),
    addAssistanceRequest: (request) =>
      set(state => ({
        assistanceRequests: [
          request,
          ...state.assistanceRequests.filter(existing => existing.id !== request.id)
        ]
      })),
    resolveAssistanceRequest: (requestId) =>
      set(state => ({
        assistanceRequests: state.assistanceRequests.filter(
          r => r.id !== requestId
        )
      })),

    setPendingPayments: (pendingPayments) =>
      set({ pendingPayments }),
    addPendingPayment: (payment) =>
      set(state => ({
        pendingPayments: [
          ...state.pendingPayments.filter(existing => existing.id !== payment.id),
          payment
        ]
      })),
    removePendingPayment: (paymentId) =>
      set(state => ({
        pendingPayments: state.pendingPayments.filter(
          p => p.id !== paymentId
        )
      })),

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setConnected: (isConnected) => set({ isConnected }),
    openModal: (activeModal) => set({ activeModal }),
    closeModal: () => set({ activeModal: null })
  })
)
