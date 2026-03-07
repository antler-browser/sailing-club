import { useState, useEffect } from 'react'

export interface Equipment {
  id: string
  name: string
  type: string
  category: string
  status: string
  sortOrder: number | null
}

export interface EquipmentByCategory {
  sail: Equipment[]
  kayak: Equipment[]
  wind: Equipment[]
}

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/equipment')
      .then(res => res.json())
      .then(data => {
        setEquipment(data.equipment)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load equipment:', err)
        setLoading(false)
      })
  }, [])

  const byCategory: EquipmentByCategory = {
    sail: equipment.filter(e => e.category === 'sail'),
    kayak: equipment.filter(e => e.category === 'kayak'),
    wind: equipment.filter(e => e.category === 'wind'),
  }

  const equipmentById = new Map(equipment.map(e => [e.id, e]))

  return { equipment, byCategory, equipmentById, loading }
}
