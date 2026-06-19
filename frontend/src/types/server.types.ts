export interface ReadyOrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  specialInstructions: string | null
  status: 'ACTIVE' | 'REJECTED'
}

export interface ReadyOrder {
  id: string
  status: 'READY' | 'PREPARED'
  tableNumber: string
  sessionId: string
  readyAt: string
  items: ReadyOrderItem[]
  subtotal: number
  assignedWaiterId?: string | null
  assignedWaiterName?: string | null
}

export type AssistanceType = 'WATER' | 'BILL' | 'GENERAL' | 'PLATE'
export type AssistanceStatus = 'PENDING' | 'RESOLVED'
export type PaymentMethod = 'CASH' | 'UPI'
export type PaymentStatus = 'PENDING' | 'COMPLETED'

export interface AssistanceRequest {
  id: string
  sessionId: string
  tableNumber: string
  requestType: AssistanceType
  status: AssistanceStatus
  createdAt: string
  resolvedAt: string | null
}

export interface PendingPayment {
  id: string
  sessionId: string
  tableNumber: string
  totalAmount: number
  paymentMethod: PaymentMethod
  status: PaymentStatus
  createdAt: string
}

export interface BillItem {
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface BillSummary {
  tableNumber: string
  totalAmount: number
  itemBreakdown: BillItem[]
  orders: Array<{
    id: string
    items: ReadyOrderItem[]
  }>
}

export interface OrderReadySocketPayload {
  orderId: string
  sessionId: string
  tableNumber: string
  readyAt: string
  items: ReadyOrderItem[]
}

export interface AssistanceNewSocketPayload {
  requestId: string
  sessionId: string
  tableNumber: string
  requestType: AssistanceType
  createdAt: string
  message: string
  payment?: {
    paymentId: string
    totalAmount: number
  }
}

export interface AssistanceResolvedSocketPayload {
  requestId: string
  tableNumber: string
  requestType: AssistanceType
  resolvedAt: string
}

export interface PaymentBillRequestedPayload {
  sessionId: string
  paymentId: string
  tableNumber: string
  totalAmount: number
  requestedAt: string
}

export interface PaymentCompletedPayload {
  paymentId: string
  sessionId: string
  tableNumber: string
  totalAmount: number
  paymentMethod: PaymentMethod
  verifiedAt: string
}

export interface WaiterAssignmentRequest {
  requestId: string
  sessionId: string
  tableNumber: string
  requestedAt: string
}

export interface MyTableSession {
  sessionId: string
  tableNumber: string
  orderCount: number
  pendingRequestsCount: number
}
