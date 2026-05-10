'use client'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import api from '@/lib/api'
import { Residente } from '@/types'

type Campos = {
  nombre: string
  apellido: string
  fecha_nacimiento: string
  genero: string
  documento_tipo: string
  documento_numero: string
  habitacion: string
  tipo_sangre: string
  eps: string
  numero_afiliacion: string
  nivel_dependencia: string
  diagnosticos: string
  alergias: string
  dieta_especial: string
  observaciones: string
}

interface Props {
  residente?: Residente
  modo?: 'crear' | 'editar'
}

export default function ResidenteForm({ residente, modo = 'crear' }: Props) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Campos>({
    defaultValues: residente ? {
      nombre:           residente.nombre,
      apellido:         residente.apellido,
      fecha_nacimiento: residente.fecha_nacimiento?.slice(0, 10),
      genero:           residente.genero ?? '',
      documento_tipo:   residente.documento_tipo ?? '',
      documento_numero: residente.documento_numero ?? '',
      habitacion:       residente.habitacion ?? '',
      tipo_sangre:      residente.tipo_sangre ?? '',
      eps:              residente.eps ?? '',
      numero_afiliacion:residente.numero_afiliacion ?? '',
      nivel_dependencia:residente.nivel_dependencia ?? '',
      diagnosticos:     residente.diagnosticos ?? '',
      alergias:         residente.alergias ?? '',
      dieta_especial:   residente.dieta_especial ?? '',
      observaciones:    residente.observaciones ?? '',
    } : {},
  })

  async function onSubmit(data: Campos) {
    setError('')
    setGuardando(true)
    try {
      if (modo === 'crear') {
        const { data: nuevo } = await api.post<Residente>('/residentes', data)
        router.push(`/residentes/${nuevo.id}`)
      } else {
        await api.put(`/residentes/${residente!.id}`, data)
        router.push(`/residentes/${residente!.id}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
      )}

      {/* Datos personales */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Datos personales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input {...register('nombre', { required: 'Requerido' })} className="input-base" />
            {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
            <input {...register('apellido', { required: 'Requerido' })} className="input-base" />
            {errors.apellido && <p className="text-xs text-red-500 mt-1">{errors.apellido.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento *</label>
            <input type="date" {...register('fecha_nacimiento', { required: 'Requerido' })} className="input-base" />
            {errors.fecha_nacimiento && <p className="text-xs text-red-500 mt-1">{errors.fecha_nacimiento.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
            <select {...register('genero')} className="input-base">
              <option value="">Seleccionar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo documento</label>
            <select {...register('documento_tipo')} className="input-base">
              <option value="">Seleccionar</option>
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número documento</label>
            <input {...register('documento_numero')} className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Habitación</label>
            <input {...register('habitacion')} className="input-base" placeholder="Ej: 101" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de sangre</label>
            <select {...register('tipo_sangre')} className="input-base">
              <option value="">Seleccionar</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Datos de salud */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Salud y cuidado</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">EPS</label>
            <input {...register('eps')} className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número afiliación</label>
            <input {...register('numero_afiliacion')} className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de dependencia</label>
            <select {...register('nivel_dependencia')} className="input-base">
              <option value="">Seleccionar</option>
              <option value="independiente">Independiente</option>
              <option value="asistido">Asistido</option>
              <option value="dependiente">Dependiente</option>
              <option value="total">Total</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Diagnósticos principales</label>
          <textarea {...register('diagnosticos')} rows={3} className="input-base resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alergias conocidas</label>
          <textarea {...register('alergias')} rows={2} className="input-base resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dieta especial</label>
          <input {...register('dieta_especial')} className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea {...register('observaciones')} rows={3} className="input-base resize-none" />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="btn-primary">
          {guardando ? 'Guardando...' : modo === 'crear' ? 'Crear residente' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
