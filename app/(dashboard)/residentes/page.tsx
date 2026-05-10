'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Residente } from '@/types'
import ResidenteCard from '@/components/residentes/ResidenteCard'
import Spinner from '@/components/ui/Spinner'

const ESTADOS = ['todos', 'activo', 'hospitalizado', 'egresado', 'fallecido']

export default function ResidentesPage() {
  const [residentes, setResidentes] = useState<Residente[]>([])
  const [cargando, setCargando] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [estado, setEstado] = useState('todos')
  const [vista, setVista] = useState<'grid' | 'tabla'>('grid')

  useEffect(() => {
    setCargando(true)
    const params = new URLSearchParams()
    if (estado !== 'todos') params.set('estado', estado)
    if (buscar) params.set('buscar', buscar)
    api.get<Residente[]>(`/residentes?${params}`)
      .then(r => setResidentes(r.data))
      .finally(() => setCargando(false))
  }, [estado, buscar])

  return (
    <div>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-mafe-oscuro">Residentes</h1>
          <p className="text-sm text-gray-500">{residentes.length} residente{residentes.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/residentes/nuevo" className="btn-primary text-sm self-start sm:self-auto">
          + Nuevo residente
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar por nombre o documento..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          className="input-base sm:max-w-xs"
        />
        <div className="flex gap-1 flex-wrap">
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => setEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                estado === e
                  ? 'bg-mafe text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {(['grid','tabla'] as const).map(v => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                vista === v ? 'bg-mafe text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {v === 'grid' ? '⊞ Tarjetas' : '☰ Tabla'}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {cargando ? <Spinner /> : residentes.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-lg font-medium mb-1">Sin resultados</p>
          <p className="text-sm">No hay residentes que coincidan con los filtros.</p>
        </div>
      ) : vista === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {residentes.map(r => <ResidenteCard key={r.id} r={r} />)}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {['Nombre','Habitación','Edad','Estado','Dependencia','EPS',''].map(h => (
                  <th key={h} className="pb-3 font-medium text-gray-500 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {residentes.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium pr-4">{r.nombre} {r.apellido}</td>
                  <td className="py-3 text-gray-500 pr-4">{r.habitacion ?? '—'}</td>
                  <td className="py-3 text-gray-500 pr-4">{r.edad} años</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.estado === 'activo' ? 'bg-green-100 text-green-700'
                      : r.estado === 'hospitalizado' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500 pr-4 capitalize">{r.nivel_dependencia ?? '—'}</td>
                  <td className="py-3 text-gray-500 pr-4">{r.eps ?? '—'}</td>
                  <td className="py-3">
                    <Link href={`/residentes/${r.id}`} className="text-mafe hover:underline text-xs">
                      Ver perfil →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
