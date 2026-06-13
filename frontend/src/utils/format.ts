export const formatCurrency = (amount: number): string =>
  `₹ ${amount.toFixed(2)}`

export const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
