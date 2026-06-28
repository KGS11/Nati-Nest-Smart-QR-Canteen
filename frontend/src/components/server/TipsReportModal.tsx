'use client'

import { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'
import Loader from '@/components/ui/Loader'

interface TipsReportModalProps {
  onClose: () => void
}

interface TipsReport {
  totalTips: number
  transactionCount: number
  tipsByWaiter: Array<{
    waiterId: string | null
    waiterName: string
    waiterPhone: string
    tipAmount: number
    transactionCount: number
  }>
  tipsByDate: Array<{
    date: string
    tipAmount: number
    transactionCount: number
  }>
}

export default function TipsReportModal({ onClose }: TipsReportModalProps) {
  const [report, setReport] = useState<TipsReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7) // default to last 7 days
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  const fetchReport = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiClient.get(`/reports/tips?startDate=${startDate}&endDate=${endDate}`)
      setReport(res.data?.data || null)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to retrieve tips report.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-surface-raised border border-border-primary rounded-2xl max-w-2xl w-full mx-auto mt-12 p-6 shadow-2xl relative flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-border-primary pb-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Tips Performance Report</h2>
            <p className="text-xs text-text-secondary">Track and analyze waiter tips received</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-2xl font-bold bg-transparent border-0 cursor-pointer leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-4 bg-surface-base/40 p-4 rounded-xl border border-border-primary/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-surface-raised border border-border-primary text-text-primary text-xs rounded-lg p-2 focus:outline-none focus:border-accent-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-surface-raised border border-border-primary text-text-primary text-xs rounded-lg p-2 focus:outline-none focus:border-accent-500"
            />
          </div>
          <button
            type="button"
            onClick={fetchReport}
            className="ml-auto px-4 py-2 bg-surface-overlay hover:bg-surface-overlay/80 text-text-primary text-xs font-bold rounded-lg transition-colors border border-border-secondary"
          >
            Refresh
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader label="Fetching tips data..." />
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="text-center py-6">
            <p className="text-red-400 text-sm mb-4">{error}</p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && report && (
          <div className="space-y-6 overflow-y-auto max-h-[50vh] pr-1 scrollbar-thin">
            
            {/* Summary metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-base p-4 rounded-xl border border-border-primary flex flex-col items-center">
                <span className="text-2xl font-bold text-accent-400">₹ {report.totalTips.toFixed(2)}</span>
                <span className="text-xs text-text-secondary mt-1">Total Tips Earned</span>
              </div>
              <div className="bg-surface-base p-4 rounded-xl border border-border-primary flex flex-col items-center">
                <span className="text-2xl font-bold text-text-primary">{report.transactionCount}</span>
                <span className="text-xs text-text-secondary mt-1">Tips Transactions</span>
              </div>
            </div>

            {/* Waiters breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-secondary border-b border-border-primary pb-1.5 flex items-center gap-1.5">
                <span>👤</span> Breakdown by Waiter
              </h3>
              {report.tipsByWaiter.length === 0 ? (
                <p className="text-xs text-text-tertiary italic py-2 text-center">No tips recorded for this period</p>
              ) : (
                <div className="border border-border-primary rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-primary text-xs font-semibold text-text-secondary bg-surface-raised/50">
                        <th className="py-2 px-3">Waiter</th>
                        <th className="py-2 px-3 text-right">Transactions</th>
                        <th className="py-2 px-3 text-right">Total Tips</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.tipsByWaiter.map((row, idx) => (
                        <tr
                          key={idx}
                          className="text-xs text-text-secondary border-b border-border-primary/30 last:border-b-0 bg-surface-raised/30"
                        >
                          <td className="py-2.5 px-3 font-semibold">{row.waiterName}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-text-secondary">{row.transactionCount}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-accent-400">₹ {row.tipAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Daily breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-secondary border-b border-border-primary pb-1.5 flex items-center gap-1.5">
                <span>📅</span> Daily Tips Summary
              </h3>
              {report.tipsByDate.length === 0 ? (
                <p className="text-xs text-text-tertiary italic py-2 text-center">No tips recorded for this period</p>
              ) : (
                <div className="border border-border-primary rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-primary text-xs font-semibold text-text-secondary bg-surface-raised/50">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Transactions</th>
                        <th className="py-2 px-3 text-right">Tips</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.tipsByDate.map((row, idx) => (
                        <tr
                          key={idx}
                          className="text-xs text-text-secondary border-b border-border-primary/30 last:border-b-0 bg-surface-raised/30"
                        >
                          <td className="py-2.5 px-3 font-medium">{row.date}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-text-secondary">{row.transactionCount}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-accent-400">₹ {row.tipAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border-primary pt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-surface-overlay hover:bg-surface-overlay/80 text-text-primary rounded-xl text-sm font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
