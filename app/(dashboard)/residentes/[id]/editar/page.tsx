'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Residente } from '@/types'
import ResidenteForm from '@/components/residentes/ResidenteForm'
import Spinner from '@/components/ui/Spinner'

export default function EditarResidentePage() {
  const { id } = useParams<{ id: string }>()
  const [residente, setResidente] = useState<Residente | null>(null)

  useEffect(() => {
    api.get<Residente>(`/residentes/${id}`).then(r => setResidente(r.data))
  }, [id])

  if (!residente) return <Spinner />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mafe-oscuro">Editar residente</h1>
        <p className="text-sm text-gray-500">{residente.nombre} {residente.apellido}</p>
      </div>
      <ResidenteForm residente={residente} modo="editar" />
    </div>
  )
}
