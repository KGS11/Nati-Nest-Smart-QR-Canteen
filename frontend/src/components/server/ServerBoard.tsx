'use client'

import { useContext, useEffect, useState } from 'react'
import { SocketContext } from '@/context/SocketContext'
import { useAuthStore } from '@/stores/authStore'
import { useServerStore } from '@/stores/serverStore'
import apiClient from '@/lib/api-client'
import { cn } from '@/utils/cn'

// Components
import { Button } from '@/components/ui/Button'
import Loader from '@/components/ui/Loader'
import ServerConnectionStatus from './ServerConnectionStatus'
import ReadyOrdersPanel from './ReadyOrdersPanel'
import AssistancePanel from './AssistancePanel'
import PendingPaymentsPanel from './PendingPaymentsPanel'
import BillSummaryModal from './BillSummaryModal'
import PaymentVerificationModal from './PaymentVerificationModal'
import { OrderCardSkeleton } from '@/components/ui/Skeleton'

// Types
import {
  ReadyOrder,
  ReadyOrderItem,
  AssistanceRequest,
  PendingPayment,
  OrderReadySocketPayload,
  AssistanceNewSocketPayload,
  AssistanceResolvedSocketPayload,
  PaymentBillRequestedPayload,
  PaymentCompletedPayload
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
  status: 'READY'
  sessionId: string
  readyAt: string
  subtotal?: number
  session: {
    table: {
      tableNumber: string
    }
  }
  items: BackendOrderItem[]
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

const normalizeItem = (item: BackendOrderItem): ReadyOrderItem => ({
  id: item.id,
  name: item.menuItem.name,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  specialInstructions: item.specialInstructions,
  status: item.status
})

const normalizeReadyOrder = (order: BackendReadyOrder): ReadyOrder => ({
  id: order.id,
  status: 'READY',
  sessionId: order.sessionId,
  tableNumber: order.session.table.tableNumber,
  readyAt: order.readyAt,
  items: order.items.map(normalizeItem),
  subtotal:
    order.subtotal ??
    order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
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
  const [activeMobileTab, setActiveMobileTab] = useState<'requests' | 'deliver' | 'payments'>('requests')

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
      const [ordersRes, assistanceRes, paymentsRes] = await Promise.all([
        apiClient.get('/server/orders/ready'),
        apiClient.get('/server/assistance'),
        apiClient.get('/payments/pending')
      ])

      const orders = (ordersRes.data?.data?.orders || []) as BackendReadyOrder[]
      const requests = (assistanceRes.data?.data?.requests || []) as BackendAssistanceRequest[]
      const payments = (paymentsRes.data?.data?.payments || []) as BackendPendingPayment[]

      store.setReadyOrders(orders.map(normalizeReadyOrder))
      store.setAssistanceRequests(requests.map(normalizeAssistanceRequest))
      store.setPendingPayments(payments.map(normalizePendingPayment))
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

    const handleOrderReady = (payload: OrderReadySocketPayload) => {
      const newOrder: ReadyOrder = {
        id: payload.orderId,
        status: 'READY',
        tableNumber: payload.tableNumber,
        sessionId: payload.sessionId,
        readyAt: payload.readyAt,
        items: payload.items,
        subtotal: payload.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      }
      store.addReadyOrder(newOrder)
      addToast(`Order ready  Table ${payload.tableNumber}`, 'ready')
    }

    const handleOrderStatusUpdated = (payload: { orderId: string; status: string }) => {
      if (payload.status === 'DELIVERED') {
        store.removeReadyOrder(payload.orderId)
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
    socket.on('assistance:new', handleAssistanceNew)
    socket.on('assistance:resolved', handleAssistanceResolved)
    socket.on('payment:bill_requested', handlePaymentBillRequested)
    socket.on('payment:completed', handlePaymentCompleted)
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    return () => {
      socket.off('server:joined', handleJoined)
      socket.off('error', handleError)
      socket.off('order:ready', handleOrderReady)
      socket.off('order:status_updated', handleOrderStatusUpdated)
      socket.off('assistance:new', handleAssistanceNew)
      socket.off('assistance:resolved', handleAssistanceResolved)
      socket.off('payment:bill_requested', handlePaymentBillRequested)
      socket.off('payment:completed', handlePaymentCompleted)
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
      addToast(err?.message || 'Failed to deliver order.', 'error')
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
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 shrink-0 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 z-10">
        <h1 className="text-xl font-bold text-zinc-100">Server Dashboard</h1>
        <div className="flex items-center gap-4">
          <ServerConnectionStatus isConnected={store.isConnected} />
          <span className="text-sm font-medium text-zinc-400">
            {user?.name ?? 'Server Staff'}
          </span>
          <Button type="button" variant="secondary" onClick={logout} className="min-h-10 text-xs">
            Logout
          </Button>
        </div>
      </header>

      {/* Main Board Area (Tablet and Desktop only, above 768px) */}
      <div className="hidden md:flex flex-1 overflow-hidden relative">
        {store.isLoading ? (
          <main className="flex-1 overflow-hidden p-4">
            <div className="grid grid-cols-3 gap-4 h-full">
              <div className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 p-4 space-y-4">
                <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </div>
              <div className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 p-4 space-y-4">
                <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </div>
              <div className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 p-4 space-y-4">
                <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </div>
            </div>
          </main>
        ) : !store.isLoading && store.error ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center max-w-sm w-full">
              <p className="text-red-400 text-sm mb-4 font-semibold">{store.error}</p>
              <Button type="button" onClick={fetchAllData} className="w-full">
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <main className="flex-1 overflow-hidden p-4 md:overflow-y-auto lg:overflow-hidden">
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 h-full">
              
              {/* Ready Orders Panel */}
              <div className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden h-[600px] lg:h-full">
                <ReadyOrdersPanel
                  orders={store.readyOrders}
                  onDeliver={handleDeliver}
                  onViewBill={handleOpenBill}
                />
              </div>

              {/* Assistance Requests Panel */}
              <div className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden h-[600px] lg:h-full">
                <AssistancePanel
                  requests={store.assistanceRequests}
                  onResolve={handleResolveAssistance}
                  onViewBill={handleOpenBill}
                  readyOrders={store.readyOrders}
                  pendingPayments={store.pendingPayments}
                  onDeliver={handleDeliver}
                  onVerifyPayment={handleOpenPaymentVerification}
                />
              </div>

              {/* Pending Payments Panel */}
              <div className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden p-4 h-[600px] lg:h-full">
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
      <div className="flex-1 flex flex-col md:hidden overflow-hidden relative bg-zinc-950">
        {store.isLoading ? (
          <div className="p-4 space-y-4">
            <OrderCardSkeleton />
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </div>
        ) : (
          /* Content Area */
          <div className="flex-1 overflow-y-auto pb-24">
          {activeMobileTab === 'requests' && (
            <AssistancePanel
              requests={store.assistanceRequests}
              onResolve={handleResolveAssistance}
              onViewBill={handleOpenBill}
              readyOrders={store.readyOrders}
              pendingPayments={store.pendingPayments}
              onDeliver={handleDeliver}
              onVerifyPayment={handleOpenPaymentVerification}
            />
          )}
          {activeMobileTab === 'deliver' && (
            <ReadyOrdersPanel
              orders={store.readyOrders}
              onDeliver={handleDeliver}
              onViewBill={handleOpenBill}
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
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t border-zinc-800 grid grid-cols-3 pb-safe z-30">
          <button
            onClick={() => setActiveMobileTab('requests')}
            className={cn(
              "flex flex-col items-center justify-center relative focus:outline-none transition-colors",
              activeMobileTab === 'requests' ? "text-amber-400" : "text-zinc-500"
            )}
          >
            <div className="relative">
              <span className="text-xl select-none"></span>
              {store.assistanceRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-zinc-900 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-semibold mt-1">Requests</span>
          </button>

          <button
            onClick={() => setActiveMobileTab('deliver')}
            className={cn(
              "flex flex-col items-center justify-center relative focus:outline-none transition-colors",
              activeMobileTab === 'deliver' ? "text-amber-400" : "text-zinc-500"
            )}
          >
            <div className="relative">
              <span className="text-xl select-none"></span>
              {store.readyOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-zinc-900 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-semibold mt-1">Deliver</span>
          </button>

          <button
            onClick={() => setActiveMobileTab('payments')}
            className={cn(
              "flex flex-col items-center justify-center relative focus:outline-none transition-colors",
              activeMobileTab === 'payments' ? "text-amber-400" : "text-zinc-500"
            )}
          >
            <div className="relative">
              <span className="text-xl select-none"></span>
              {store.pendingPayments.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-zinc-900 animate-pulse" />
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

      {/* Stacking Toasts Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => {
          let bgClass = 'bg-zinc-900 text-zinc-100'
          if (toast.type === 'ready' || toast.type === 'payment') {
            bgClass = 'bg-green-500 text-zinc-950'
          } else if (toast.type === 'assistance') {
            bgClass = 'bg-amber-500 text-zinc-950'
          } else if (toast.type === 'error') {
            bgClass = 'bg-red-500 text-zinc-100'
          }

          return (
            <div
              key={toast.id}
              className={`px-4 py-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-3 border border-black/10 transition-all duration-300 transform translate-y-0 ${bgClass}`}
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
