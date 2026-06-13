'use client'

interface ServerConnectionStatusProps {
  isConnected: boolean
}

export default function ServerConnectionStatus({ isConnected }: ServerConnectionStatusProps) {
  return (
    <span
      className={
        isConnected
          ? 'inline-flex min-h-9 items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 text-sm font-semibold text-green-400'
          : 'inline-flex min-h-9 items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 text-sm font-semibold text-red-400'
      }
    >
      <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'animate-pulse bg-green-400' : 'bg-red-400'}`} />
      {isConnected ? 'Live' : 'Reconnecting...'}
    </span>
  )
}
