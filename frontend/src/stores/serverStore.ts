import { create } from 'zustand'
import {
  ReadyOrder,
  AssistanceRequest,
  PendingPayment,
  WaiterAssignmentRequest,
  MyTableSession,
  InProgressOrder
} from '@/types/server.types'

interface ServerState {
  readyOrders: ReadyOrder[]
  inProgressOrders: InProgressOrder[]
  assistanceRequests: AssistanceRequest[]
  pendingPayments: PendingPayment[]
  assignmentRequests: WaiterAssignmentRequest[]
  myTables: MyTableSession[]
  isAcceptingAssignment: boolean
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

  setInProgressOrders: (orders: InProgressOrder[]) => void
  addInProgressOrder: (order: InProgressOrder) => void
  updateInProgressOrder: (orderId: string, fields: Partial<InProgressOrder>) => void
  removeInProgressOrder: (orderId: string) => void

  setAssistanceRequests: (requests: AssistanceRequest[]) => void
  addAssistanceRequest: (request: AssistanceRequest) => void
  resolveAssistanceRequest: (requestId: string) => void

  setPendingPayments: (payments: PendingPayment[]) => void
  addPendingPayment: (payment: PendingPayment) => void
  removePendingPayment: (paymentId: string) => void

  setAssignmentRequests: (requests: WaiterAssignmentRequest[]) => void
  addAssignmentRequest: (request: WaiterAssignmentRequest) => void
  removeAssignmentRequest: (id: string) => void
  setMyTables: (tables: MyTableSession[]) => void
  setAcceptingAssignment: (bool: boolean) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setConnected: (connected: boolean) => void
  openModal: (modal: ServerState['activeModal']) => void
  closeModal: () => void
}

export const useServerStore = create<ServerState>()(
  (set) => ({
    readyOrders: [],
    inProgressOrders: [],
    assistanceRequests: [],
    pendingPayments: [],
    assignmentRequests: [],
    myTables: [],
    isAcceptingAssignment: false,
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

    setInProgressOrders: (inProgressOrders) => set({ inProgressOrders }),
    addInProgressOrder: (order) =>
      set(state => ({
        inProgressOrders: [
          order,
          ...state.inProgressOrders.filter(existing => existing.id !== order.id)
        ]
      })),
    updateInProgressOrder: (orderId, fields) =>
      set(state => ({
        inProgressOrders: state.inProgressOrders.map(o =>
          o.id === orderId ? { ...o, ...fields } : o
        )
      })),
    removeInProgressOrder: (orderId) =>
      set(state => ({
        inProgressOrders: state.inProgressOrders.filter(o => o.id !== orderId)
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

    setAssignmentRequests: (assignmentRequests) => set({ assignmentRequests }),
    addAssignmentRequest: (request) =>
      set(state => ({
        assignmentRequests: [
          ...state.assignmentRequests.filter(existing => existing.requestId !== request.requestId),
          request
        ]
      })),
    removeAssignmentRequest: (id) =>
      set(state => ({
        assignmentRequests: state.assignmentRequests.filter(
          r => r.requestId !== id && r.sessionId !== id
        )
      })),
    setMyTables: (myTables) => set({ myTables }),
    setAcceptingAssignment: (isAcceptingAssignment) => set({ isAcceptingAssignment }),

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setConnected: (isConnected) => set({ isConnected }),
    openModal: (activeModal) => set({ activeModal }),
    closeModal: () => set({ activeModal: null })
  })
)
