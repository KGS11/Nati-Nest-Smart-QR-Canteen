'use client'

import { useContext, useEffect, useState } from 'react'
import { SocketContext } from '@/context/SocketContext'
import { useAuthStore } from '@/stores/authStore'
import { useServerStore } from '@/stores/serverStore'
import apiClient from '@/lib/api-client'
import { cn } from '@/utils/cn'
import { serverService } from '@/services/serverService'

// Components
import { Button } from '@/components/ui/Button'
import Loader from '@/components/ui/Loader'
import ServerConnectionStatus from './ServerConnectionStatus'
import ReadyOrdersPanel from './ReadyOrdersPanel'
import IncomingOrdersPanel from './IncomingOrdersPanel'
import AssistancePanel from './AssistancePanel'
import PendingPaymentsPanel from './PendingPaymentsPanel'
import BillSummaryModal from './BillSummaryModal'
import PaymentVerificationModal from './PaymentVerificationModal'
import { OrderCardSkeleton } from '@/components/ui/Skeleton'
import { MaterialIcon } from '@/components/stitch/MaterialIcon'
import TipsReportModal from './TipsReportModal'
import { AssignmentRequestBanner } from './AssignmentRequestBanner'

import {
  ReadyOrder,
  ReadyOrderItem,
  AssistanceRequest,
  PendingPayment,
  OrderReadySocketPayload,
  AssistanceNewSocketPayload,
  AssistanceResolvedSocketPayload,
  PaymentBillRequestedPayload,
  PaymentCompletedPayload,
  WaiterAssignmentRequest,
  MyTableSession,
  InProgressOrder
} from '@/types/server.types'

interface ActiveToast {
  id: string
  title: string
  type: 'ready' | 'assistance' | 'payment' | 'error'
}

interface BackendOrderItem {
  id: string
  quantity: number
  unitPrice: number
  specialInstructions: string | null
  status: 'ACTIVE' | 'REJECTED'
  menuItem: {
    name: string
  }
}

interface BackendReadyOrder {
  id: string
  status: 'READY' | 'PREPARED'
  sessionId: string
  readyAt: string
  subtotal?: number
  session: {
    table: {
      tableNumber: string
    }
  }
  items: BackendOrderItem[]
  assignedWaiterId?: string | null
  assignedWaiterName?: string | null
}

interface BackendAssistanceRequest {
  id: string
  sessionId: string
  requestType: AssistanceRequest['requestType']
  status: AssistanceRequest['status']
  createdAt: string
  resolvedAt: string | null
  session: {
    table: {
      tableNumber: string
    }
  }
}

interface BackendPendingPayment {
  id: string
  sessionId: string
  totalAmount: number
  paymentMethod: PendingPayment['paymentMethod']
  status: PendingPayment['status']
  createdAt: string
  session: {
    table: {
      tableNumber: string
    }
  }
}

interface BackendInProgressOrder {
  id: string
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING'
  sessionId: string
  placedAt: string
  subtotal?: number
  session: {
    table: {
      tableNumber: string
    }
  }
  items: BackendOrderItem[]
  assignedKitchenName?: string | null
}

const normalizeItem = (item: BackendOrderItem): ReadyOrderItem => ({
  id: item.id,
  name: item.menuItem.name,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  specialInstructions: item.specialInstructions,
  status: item.status
})

const normalizeInProgressOrder = (order: BackendInProgressOrder): InProgressOrder => ({
  id: order.id,
  status: order.status,
  sessionId: order.sessionId,
  tableNumber: order.session.table.tableNumber,
  placedAt: order.placedAt,
  items: order.items.map(normalizeItem),
  subtotal:
    order.subtotal ??
    order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  assignedKitchenName: order.assignedKitchenName
})

const normalizeReadyOrder = (order: BackendReadyOrder): ReadyOrder => ({
  id: order.id,
  status: order.status,
  sessionId: order.sessionId,
  tableNumber: order.session.table.tableNumber,
  readyAt: order.readyAt,
  items: order.items.map(normalizeItem),
  subtotal:
    order.subtotal ??
    order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  assignedWaiterId: order.assignedWaiterId,
  assignedWaiterName: order.assignedWaiterName
})

const normalizeAssistanceRequest = (
  request: BackendAssistanceRequest
): AssistanceRequest => ({
  id: request.id,
  sessionId: request.sessionId,
  tableNumber: request.session.table.tableNumber,
  requestType: request.requestType,
  status: request.status,
  createdAt: request.createdAt,
  resolvedAt: request.resolvedAt
})

const normalizePendingPayment = (payment: BackendPendingPayment): PendingPayment => ({
  id: payment.id,
  sessionId: payment.sessionId,
  tableNumber: payment.session.table.tableNumber,
  totalAmount: payment.totalAmount,
  paymentMethod: payment.paymentMethod,
  status: payment.status,
  createdAt: payment.createdAt
})

export default function ServerBoard() {
  const { socket } = useContext(SocketContext)
  const { user, token, logout } = useAuthStore()
  const store = useServerStore()
  const [toasts, setToasts] = useState<ActiveToast[]>([])
  const [activeMobileTab, setActiveMobileTab] = useState<'incoming' | 'requests' | 'deliver' | 'payments'>('requests')
  const [isTipsOpen, setIsTipsOpen] = useState(false)

  const addToast = (title: string, type: 'ready' | 'assistance' | 'payment' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  const fetchAllData = async () => {
    store.setLoading(true)
    store.setError(null)
    try {
      const [ordersRes, inProgressRes, assistanceRes, paymentsRes, myTablesRes, assignmentRequestsRes] = await Promise.all([
        apiClient.get('/server/orders/ready'),
        apiClient.get('/server/orders/in-progress'),
        apiClient.get('/server/assistance'),
        apiClient.get('/payments/pending'),
        apiClient.get('/server/my-tables'),
        apiClient.get('/server/assignment-requests')
      ])

      const orders = (ordersRes.data?.data?.orders || []) as BackendReadyOrder[]
      const inProgress = (inProgressRes.data?.data?.orders || []) as BackendInProgressOrder[]
      const requests = (assistanceRes.data?.data?.requests || []) as BackendAssistanceRequest[]
      const payments = (paymentsRes.data?.data?.payments || []) as BackendPendingPayment[]
      const myTables = (myTablesRes.data?.data?.myTables || []) as MyTableSession[]
      const assignmentRequests = (assignmentRequestsRes.data?.data?.requests || []) as WaiterAssignmentRequest[]

      store.setReadyOrders(orders.map(normalizeReadyOrder))
      store.setInProgressOrders(inProgress.map(normalizeInProgressOrder))
      store.setAssistanceRequests(requests.map(normalizeAssistanceRequest))
      store.setPendingPayments(payments.map(normalizePendingPayment))
      store.setMyTables(myTables)
      store.setAssignmentRequests(assignmentRequests)
    } catch (err: any) {
      store.setError(err?.message || 'Failed to fetch server dashboard data.')
    } finally {
      store.setLoading(false)
    }
  }

  // Initial Fetch
  useEffect(() => {
    fetchAllData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Socket Connection Setup
  useEffect(() => {
    if (!socket) return

    const joinServer = () => {
      if (token) {
        socket.emit('server:join', {
          staffToken: token
        })
      }
    }

    const handleJoined = () => {
      store.setConnected(true)
    }

    const handleError = () => {
      store.setConnected(false)
    }

    const handleWaiterAssignmentRequest = (payload: WaiterAssignmentRequest) => {
      store.addAssignmentRequest(payload)
      addToast(`New assignment request Table ${payload.tableNumber}`, 'assistance')
    }

    const handleWaiterAssignmentAccepted = (payload: { sessionId: string; tableNumber: string; acceptedBy: string; waiterId?: string; isYours?: boolean }) => {
      store.removeAssignmentRequest(payload.sessionId)
      if (payload.waiterId === user?.id || payload.isYours) {
        fetchAllData()
        addToast(`Table ${payload.tableNumber} assigned to you`, 'ready')
      } else {
        addToast(`Table ${payload.tableNumber} assigned to ${payload.acceptedBy}`, 'ready')
      }
    }

    const handleOrderPrepared = (payload: OrderReadySocketPayload & { assignedWaiterId?: string | null; assignedWaiterName?: string | null }) => {
      const newOrder: ReadyOrder = {
        id: payload.orderId,
        status: 'PREPARED',
        tableNumber: payload.tableNumber,
        sessionId: payload.sessionId,
        readyAt: payload.readyAt,
        items: payload.items,
        subtotal: payload.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        assignedWaiterId: payload.assignedWaiterId ?? null,
        assignedWaiterName: payload.assignedWaiterName ?? null
      }
      store.addReadyOrder(newOrder)
      store.removeInProgressOrder(payload.orderId)
      addToast(`Order prepared Table ${payload.tableNumber}`, 'ready')
    }

    const handleOrderReady = (payload: OrderReadySocketPayload & { assignedWaiterId?: string | null; assignedWaiterName?: string | null }) => {
      const newOrder: ReadyOrder = {
        id: payload.orderId,
        status: 'READY',
        tableNumber: payload.tableNumber,
        sessionId: payload.sessionId,
        readyAt: payload.readyAt,
        items: payload.items,
        subtotal: payload.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        assignedWaiterId: payload.assignedWaiterId ?? null,
        assignedWaiterName: payload.assignedWaiterName ?? null
      }
      store.addReadyOrder(newOrder)
      store.removeInProgressOrder(payload.orderId)
      addToast(`Order ready  Table ${payload.tableNumber}`, 'ready')
    }

    const handleOrderStatusUpdated = (payload: { orderId: string; status: string; assignedKitchenName?: string | null }) => {
      if (payload.status === 'DELIVERED') {
        store.removeReadyOrder(payload.orderId)
      } else if (payload.status === 'CANCELLED') {
        store.removeInProgressOrder(payload.orderId)
      } else {
        store.updateInProgressOrder(payload.orderId, {
          status: payload.status as any,
          ...(payload.assignedKitchenName ? { assignedKitchenName: payload.assignedKitchenName } : {})
        })
      }
    }

    const handleAssistanceNew = (payload: AssistanceNewSocketPayload) => {
      const newRequest: AssistanceRequest = {
        id: payload.requestId,
        sessionId: payload.sessionId,
        tableNumber: payload.tableNumber,
        requestType: payload.requestType,
        status: 'PENDING',
        createdAt: payload.createdAt,
        resolvedAt: null
      }
      store.addAssistanceRequest(newRequest)

      if (payload.requestType === 'BILL' && payload.payment) {
        store.addPendingPayment({
          id: payload.payment.paymentId,
          sessionId: payload.sessionId,
          tableNumber: payload.tableNumber,
          totalAmount: payload.payment.totalAmount,
          paymentMethod: 'CASH',
          status: 'PENDING',
          createdAt: payload.createdAt
        })
      }

      const toastMessage =
        payload.requestType === 'WATER'
          ? ` Water  Table ${payload.tableNumber}`
          : payload.requestType === 'PLATE'
          ? ` Plate  Table ${payload.tableNumber}`
          : payload.requestType === 'BILL'
          ? ` Bill  Table ${payload.tableNumber}`
          : ` Help  Table ${payload.tableNumber}`

      addToast(toastMessage, 'assistance')
    }

    const handleAssistanceResolved = (payload: AssistanceResolvedSocketPayload) => {
      store.resolveAssistanceRequest(payload.requestId)
    }

    const handlePaymentBillRequested = (payload: PaymentBillRequestedPayload) => {
      const exists = store.pendingPayments.some((p) => p.id === payload.paymentId)
      if (!exists) {
        store.addPendingPayment({
          id: payload.paymentId,
          sessionId: payload.sessionId,
          tableNumber: payload.tableNumber,
          totalAmount: payload.totalAmount,
          paymentMethod: 'CASH',
          status: 'PENDING',
          createdAt: payload.requestedAt
        })
      }
    }

    const handlePaymentCompleted = (payload: PaymentCompletedPayload) => {
      store.removePendingPayment(payload.paymentId)
      addToast(` Payment confirmed  Table ${payload.tableNumber}`, 'payment')
    }

    const handleOrderClaimedWaiter = (payload: {
      orderId: string
      assignedWaiterId: string
      assignedWaiterName: string
    }) => {
      store.updateReadyOrder(payload.orderId, {
        assignedWaiterId: payload.assignedWaiterId,
        assignedWaiterName: payload.assignedWaiterName
      })
    }

    const handleReleased = (payload: { orderId: string; role: string; status: string }) => {
      if (payload.role === 'SERVER') {
        store.updateReadyOrder(payload.orderId, {
          assignedWaiterId: null,
          assignedWaiterName: null
        })
      } else if (payload.role === 'KITCHEN') {
        store.removeReadyOrder(payload.orderId)
      }
    }

    const handleNewOrder = (payload: InProgressOrder) => {
      const isMyTable = store.myTables.some(t => t.sessionId === payload.sessionId)
      if (isMyTable) {
        store.addInProgressOrder(payload)
        addToast(`New order placed Table ${payload.tableNumber}`, 'ready')
      }
    }

    const handleOrderItemsUpdated = (payload: { orderId: string; items: ReadyOrderItem[]; subtotal: number }) => {
      store.updateInProgressOrder(payload.orderId, {
        items: payload.items,
        subtotal: payload.subtotal
      })
    }

    const handleConnect = () => {
      store.setConnected(true)
      joinServer()
      fetchAllData()
    }

    const handleDisconnect = () => {
      store.setConnected(false)
    }

    // Join Server room
    joinServer()

    socket.on('server:joined', handleJoined)
    socket.on('error', handleError)
    socket.on('order:ready', handleOrderReady)
    socket.on('order:status_updated', handleOrderStatusUpdated)
    socket.on('order:new', handleNewOrder)
    socket.on('order:items_updated', handleOrderItemsUpdated)
    socket.on('assistance:new', handleAssistanceNew)
    socket.on('assistance:resolved', handleAssistanceResolved)
    socket.on('payment:bill_requested', handlePaymentBillRequested)
    socket.on('payment:completed', handlePaymentCompleted)
    socket.on('order:claimed:waiter', handleOrderClaimedWaiter)
    socket.on('order:released', handleReleased)
    socket.on('waiter:assignment_request', handleWaiterAssignmentRequest)
    socket.on('waiter:assignment_accepted', handleWaiterAssignmentAccepted)
    socket.on('order:prepared', handleOrderPrepared)
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    return () => {
      socket.off('server:joined', handleJoined)
      socket.off('error', handleError)
      socket.off('order:ready', handleOrderReady)
      socket.off('order:status_updated', handleOrderStatusUpdated)
      socket.off('order:new', handleNewOrder)
      socket.off('order:items_updated', handleOrderItemsUpdated)
      socket.off('assistance:new', handleAssistanceNew)
      socket.off('assistance:resolved', handleAssistanceResolved)
      socket.off('payment:bill_requested', handlePaymentBillRequested)
      socket.off('payment:completed', handlePaymentCompleted)
      socket.off('order:claimed:waiter', handleOrderClaimedWaiter)
      socket.off('order:released', handleReleased)
      socket.off('waiter:assignment_request', handleWaiterAssignmentRequest)
      socket.off('waiter:assignment_accepted', handleWaiterAssignmentAccepted)
      socket.off('order:prepared', handleOrderPrepared)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, token])

  // Actions Handlers
  const handleDeliver = async (orderId: string) => {
    const previousOrders = store.readyOrders
    store.removeReadyOrder(orderId)
    try {
      await apiClient.patch(`/server/orders/${orderId}/deliver`)
    } catch (err: any) {
      store.setReadyOrders(previousOrders)
      addToast(err?.response?.data?.message || err?.message || 'Failed to deliver order.', 'error')
    }
  }

  const handleClaim = async (orderId: string) => {
    try {
      await serverService.claimDelivery(orderId)
      store.updateReadyOrder(orderId, {
        assignedWaiterId: user?.id,
        assignedWaiterName: user?.name
      })
      addToast('Delivery claimed successfully', 'ready')
    } catch (err: any) {
      addToast(err?.response?.data?.message || err?.message || 'Failed to claim delivery.', 'error')
    }
  }

  const handleRelease = async (orderId: string) => {
    try {
      await serverService.releaseDelivery(orderId)
      store.updateReadyOrder(orderId, {
        assignedWaiterId: null,
        assignedWaiterName: null
      })
      addToast('Delivery released successfully', 'ready')
    } catch (err: any) {
      addToast(err?.response?.data?.message || err?.message || 'Failed to release delivery.', 'error')
    }
  }

  const handleResolveAssistance = async (requestId: string) => {
    const previousRequests = store.assistanceRequests
    store.resolveAssistanceRequest(requestId)
    try {
      await apiClient.patch(`/server/assistance/${requestId}/resolve`)
    } catch (err: any) {
      store.setAssistanceRequests(previousRequests)
      addToast(err?.message || 'Failed to resolve assistance request.', 'error')
    }
  }

  const handleOpenBill = (sessionId: string) => {
    const orderWithSession = store.readyOrders.find((o) => o.sessionId === sessionId)
    const requestWithSession = store.assistanceRequests.find((r) => r.sessionId === sessionId)
    const paymentWithSession = store.pendingPayments.find((p) => p.sessionId === sessionId)

    const tableNumber =
      orderWithSession?.tableNumber ||
      requestWithSession?.tableNumber ||
      paymentWithSession?.tableNumber ||
      ''

    store.openModal({
      type: 'bill',
      sessionId,
      tableNumber
    })
  }

  const handleOpenPaymentVerification = (paymentId: string, tableNumber: string) => {
    store.openModal({
      type: 'payment',
      paymentId,
      tableNumber
    })
  }

  const handlePaymentVerified = (paymentId: string) => {
    store.removePendingPayment(paymentId)
    store.closeModal()
    addToast('Payment verified successfully', 'ready')
  }

  return (
    <div className="h-screen w-screen bg-surface-base text-text-primary flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 shrink-0 bg-surface-raised border-b border-border-primary flex items-center justify-between px-6 z-10">
        <h1 className="text-xl font-bold text-text-primary">Waiter Dashboard</h1>
        <div className="flex items-center gap-4">
          <ServerConnectionStatus isConnected={store.isConnected} />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsTipsOpen(true)}
            className="min-h-10 text-xs bg-accent-500 hover:bg-accent-400 text-surface-base border-0 font-bold"
          >
            Tips Report
          </Button>
          <span className="text-sm font-medium text-text-secondary">
            {user?.name ?? 'Waiter Staff'}
          </span>
          <Button type="button" variant="secondary" onClick={logout} className="min-h-10 text-xs">
            Logout
          </Button>
        </div>
      </header>

      {/* Assignment Requests Banner */}
      <AssignmentRequestBanner
        requests={store.assignmentRequests}
        onAccept={async (requestId) => {
          try {
            await apiClient.post(`/server/assignment/${requestId}/accept`)
            addToast('Table assignment accepted', 'ready')
            await fetchAllData()
          } catch (err: any) {
            addToast(err?.response?.data?.message || err?.message || 'Failed to accept assignment', 'error')
          }
        }}
      />

      {/* Main Board Area (Tablet and Desktop only, above 768px) */}
      <div className="hidden md:flex flex-1 overflow-hidden relative">
        {store.isLoading ? (
          <main className="flex-1 overflow-hidden p-4">
            <div className="grid grid-cols-3 gap-4 h-full">
              <div className="flex flex-col bg-surface-base rounded-xl border border-border-primary p-4 space-y-4">
                <div className="h-6 w-32 bg-surface-overlay rounded animate-pulse" />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </div>
              <div className="flex flex-col bg-surface-base rounded-xl border border-border-primary p-4 space-y-4">
                <div className="h-6 w-32 bg-surface-overlay rounded animate-pulse" />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </div>
              <div className="flex flex-col bg-surface-base rounded-xl border border-border-primary p-4 space-y-4">
                <div className="h-6 w-32 bg-surface-overlay rounded animate-pulse" />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </div>
            </div>
          </main>
        ) : !store.isLoading && store.error ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="rounded-xl border border-border-primary bg-surface-raised p-6 text-center max-w-sm w-full">
              <p className="text-red-400 text-sm mb-4 font-semibold">{store.error}</p>
              <Button type="button" onClick={fetchAllData} className="w-full">
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <main className="flex-1 overflow-hidden p-4 md:overflow-y-auto lg:overflow-hidden flex flex-col gap-4">
            {/* My Active Tables Grid */}
            {store.myTables.length > 0 && (
              <div className="shrink-0 bg-surface-base/40 border border-border-primary rounded-xl p-4">
                <h2 className="text-sm font-extrabold text-text-secondary tracking-wider uppercase mb-3 flex items-center gap-2">
                  <MaterialIcon name="table_restaurant" className="text-accent-500" />
                  My Active Tables ({store.myTables.length})
                </h2>
                <div className="flex flex-wrap gap-3">
                  {store.myTables.map((table) => (
                    <div
                      key={table.sessionId}
                      className="bg-surface-raised/60 border border-border-primary rounded-lg px-4 py-3 flex items-center justify-between gap-4 min-w-[160px]"
                    >
                      <div>
                        <div className="text-base font-black text-text-primary">Table {table.tableNumber}</div>
                        <div className="text-xs text-text-secondary">
                           {table.orderCount} order{table.orderCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      {table.pendingRequestsCount > 0 && (
                        <span className="flex items-center justify-center bg-red-500/20 text-red-400 border border-red-500/30 font-black text-xs rounded-full px-2 py-0.5 animate-pulse">
                          {table.pendingRequestsCount} Request{table.pendingRequestsCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-4 gap-4 min-h-0 overflow-hidden">
              {/* Incoming Active Orders Panel */}
              <div className="flex flex-col bg-surface-base rounded-xl border border-border-primary overflow-hidden h-[600px] lg:h-full">
                <IncomingOrdersPanel orders={store.inProgressOrders} />
              </div>

              {/* Ready Orders Panel */}
              <div className="flex flex-col bg-surface-base rounded-xl border border-border-primary overflow-hidden h-[600px] lg:h-full">
                <ReadyOrdersPanel
                  orders={store.readyOrders}
                  onDeliver={handleDeliver}
                  onViewBill={handleOpenBill}
                  onClaim={handleClaim}
                  onRelease={handleRelease}
                />
              </div>

              {/* Assistance Requests Panel */}
              <div className="flex flex-col bg-surface-base rounded-xl border border-border-primary overflow-hidden h-[600px] lg:h-full">
                <AssistancePanel
                  requests={store.assistanceRequests}
                  onResolve={handleResolveAssistance}
                  onViewBill={handleOpenBill}
                  readyOrders={store.readyOrders}
                  pendingPayments={store.pendingPayments}
                  onDeliver={handleDeliver}
                  onVerifyPayment={handleOpenPaymentVerification}
                  onClaim={handleClaim}
                  onRelease={handleRelease}
                />
              </div>

              {/* Pending Payments Panel */}
              <div className="flex flex-col bg-surface-base rounded-xl border border-border-primary overflow-hidden p-4 h-[600px] lg:h-full">
                <PendingPaymentsPanel
                  payments={store.pendingPayments}
                  onVerifyPayment={handleOpenPaymentVerification}
                />
              </div>

            </div>
          </main>
        )}
      </div>

      {/* Mobile view block (Below 768px) */}
      <div className="flex-1 flex flex-col md:hidden overflow-hidden relative bg-surface-base">
        {store.isLoading ? (
          <div className="p-4 space-y-4">
            <OrderCardSkeleton />
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </div>
        ) : (
          /* Content Area */
          <div className="flex-1 overflow-y-auto pb-24">
            {/* My Active Tables Grid for Mobile */}
            {store.myTables.length > 0 && (
              <div className="bg-surface-raised/40 border-b border-border-primary p-4">
                <h2 className="text-xs font-extrabold text-text-secondary tracking-wider uppercase mb-2 flex items-center gap-1.5">
                  <MaterialIcon name="table_restaurant" className="text-accent-500 text-sm" />
                  My Active Tables ({store.myTables.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {store.myTables.map((table) => (
                    <div
                      key={table.sessionId}
                      className="bg-surface-raised border border-border-primary rounded-lg px-3 py-2 flex items-center gap-2 text-xs"
                    >
                      <span className="font-bold text-text-primary">T{table.tableNumber}</span>
                      {table.pendingRequestsCount > 0 && (
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeMobileTab === 'incoming' && (
              <IncomingOrdersPanel orders={store.inProgressOrders} />
            )}
            {activeMobileTab === 'requests' && (
              <AssistancePanel
                requests={store.assistanceRequests}
                onResolve={handleResolveAssistance}
                onViewBill={handleOpenBill}
                readyOrders={store.readyOrders}
                pendingPayments={store.pendingPayments}
                onDeliver={handleDeliver}
                onVerifyPayment={handleOpenPaymentVerification}
                onClaim={handleClaim}
                onRelease={handleRelease}
              />
            )}
            {activeMobileTab === 'deliver' && (
              <ReadyOrdersPanel
                orders={store.readyOrders}
                onDeliver={handleDeliver}
                onViewBill={handleOpenBill}
                onClaim={handleClaim}
                onRelease={handleRelease}
              />
            )}
            {activeMobileTab === 'payments' && (
              <div className="p-4">
                <PendingPaymentsPanel
                  payments={store.pendingPayments}
                  onVerifyPayment={handleOpenPaymentVerification}
                />
              </div>
            )}
          </div>
        )}

        {/* Mobile Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface-raised border-t border-border-primary grid grid-cols-4 pb-safe z-30">
          <button
            onClick={() => setActiveMobileTab('incoming')}
            className={cn(
              "flex flex-col items-center justify-center relative focus:outline-none transition-colors",
              activeMobileTab === 'incoming' ? "text-accent-400" : "text-text-tertiary"
            )}
          >
            <div className="relative flex items-center justify-center">
              <MaterialIcon name="receipt_long" className="text-xl" />
              {store.inProgressOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent-500 ring-2 ring-surface-base animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-semibold mt-1">Incoming</span>
          </button>

          <button
            onClick={() => setActiveMobileTab('requests')}
            className={cn(
              "flex flex-col items-center justify-center relative focus:outline-none transition-colors",
              activeMobileTab === 'requests' ? "text-accent-400" : "text-text-tertiary"
            )}
          >
            <div className="relative flex items-center justify-center">
              <MaterialIcon name="support_agent" className="text-xl" />
              {store.assistanceRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-surface-base animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-semibold mt-1">Requests</span>
          </button>

          <button
            onClick={() => setActiveMobileTab('deliver')}
            className={cn(
              "flex flex-col items-center justify-center relative focus:outline-none transition-colors",
              activeMobileTab === 'deliver' ? "text-accent-400" : "text-text-tertiary"
            )}
          >
            <div className="relative flex items-center justify-center">
              <MaterialIcon name="restaurant" className="text-xl" />
              {store.readyOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-surface-base animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-semibold mt-1">Deliver</span>
          </button>

          <button
            onClick={() => setActiveMobileTab('payments')}
            className={cn(
              "flex flex-col items-center justify-center relative focus:outline-none transition-colors",
              activeMobileTab === 'payments' ? "text-accent-400" : "text-text-tertiary"
            )}
          >
            <div className="relative flex items-center justify-center">
              <MaterialIcon name="payments" className="text-xl" />
              {store.pendingPayments.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-surface-base animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-semibold mt-1">Payments</span>
          </button>
        </nav>
      </div>

      {/* Modals rendering */}
      {store.activeModal?.type === 'bill' && (
        <BillSummaryModal
          sessionId={store.activeModal.sessionId}
          tableNumber={store.activeModal.tableNumber}
          onClose={store.closeModal}
          onRequestPaymentVerification={(paymentId) =>
            handleOpenPaymentVerification(paymentId, store.activeModal?.tableNumber || '')
          }
        />
      )}

      {store.activeModal?.type === 'payment' && (
        <PaymentVerificationModal
          paymentId={store.activeModal.paymentId}
          tableNumber={store.activeModal.tableNumber}
          onClose={store.closeModal}
          onVerified={handlePaymentVerified}
          onError={(msg) => addToast(msg, 'error')}
        />
      )}

      {isTipsOpen && (
        <TipsReportModal onClose={() => setIsTipsOpen(false)} />
      )}

      {/* Stacking Toasts Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => {
          let bgClass = 'bg-surface-overlay text-text-primary border border-border-primary'
          if (toast.type === 'ready' || toast.type === 'payment') {
            bgClass = 'bg-semantic_success-500 text-surface-base'
          } else if (toast.type === 'assistance') {
            bgClass = 'bg-accent-500 text-surface-base'
          } else if (toast.type === 'error') {
            bgClass = 'bg-semantic_error-500 text-white'
          }

          return (
            <div
              key={toast.id}
              className={`px-4 py-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-3 transition-all duration-300 transform translate-y-0 ${bgClass}`}
            >
              <span className="text-sm font-bold">{toast.title}</span>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-xs bg-transparent border-0 opacity-70 hover:opacity-100 cursor-pointer font-bold leading-none p-1"
                aria-label="Dismiss"
              >
                
              </button>
            </div>
          )
        })}
      </div>

    </div>
  )
}
