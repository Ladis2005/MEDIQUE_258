import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Order } from '../types'

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reload = useCallback(async () => {
    try {
      setOrders(await api.listOrders())
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar encomendas.')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    reload()
  }, [reload])
  return { orders, loading, error, reload }
}
