import { useState, useEffect, useCallback } from 'react'
import { productsService } from '../services/products.service'
import { getAllFromDB, saveToDB } from '../utils/indexedDB'
import toast from 'react-hot-toast'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await productsService.getAll()
      setProducts(data.products)
      // Cache in IndexedDB
      data.products.forEach(p => saveToDB('products', p))
    } catch (err) {
      // Fallback to cached data
      const cached = await getAllFromDB('products')
      if (cached.length) {
        setProducts(cached)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const addProduct = useCallback(async (data) => {
    const { data: res } = await productsService.create(data)
    setProducts(ps => [...ps, res.product])
    toast.success('Product added successfully')
    return res.product
  }, [])

  const updateProduct = useCallback(async (id, data) => {
    const { data: res } = await productsService.update(id, data)
    setProducts(ps => ps.map(p => p._id === id ? res.product : p))
    toast.success('Product updated')
    return res.product
  }, [])

  const deleteProduct = useCallback(async (id) => {
    await productsService.delete(id)
    setProducts(ps => ps.filter(p => p._id !== id))
    toast.success('Product deleted')
  }, [])

  const lowStockProducts = products.filter(p => p.stock <= p.minStock)

  return {
    products, loading, error, lowStockProducts,
    addProduct, updateProduct, deleteProduct, refetch: fetchProducts
  }
}
