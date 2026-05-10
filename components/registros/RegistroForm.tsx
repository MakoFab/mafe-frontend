'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import api from '@/lib/api'
import { Residente } from '@/types'
import MoodSelector from './MoodSelector'

interface Campos {
  residente_id: string
  turno: string
  desayuno_pct: number | ''
  almuerzo_pct: number | ''
  cena_pct: number | ''
  hidratacion: string
  bano_realizado: boolean
  higiene_oral: boolean
  cambio_ropa: boolean
  movilidad: string
  actividad_fisica: string
  estado_emocional: string
  horas_sueno: number | ''
  calidad_sueno: string
  miccion: string
  deposicion: boolean
  observaciones: string
  novedades: string
  tipo: string
}

function detectarTurno(): string {
  const h = new Date().getHours()
  if (h >= 6 && h < 14)  return 'mañana'
  if (h >= 14 && h < 22) return 'tarde'
  return 'noche'
}

function SliderPct({ label, name, register }: { label: string; name: any; register: any }) {
  const [val, setVal] = useState<number>(0)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <label className="font-medium text-gray-700">{label}</label>
        <span className={`font-bold ${val >= 75 ? 'text-green-600' : val >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
          {val}%
        </span>
      </div>
      <input
        type="range" min={0} max={100} step={5}
        value={val}
        {...register(name, { valueAsNumber: true })}
        onChange={e => setVal(Number(e.target.value))}
        className="w-full accent-mafe-oscuro"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>0%</span><span>50%</span><span>100%</span>
      </div>
    </div>
  )
}

export default function RegistroForm({ residenteId }: { residenteId?: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [residentes, setResidentes] = useState<Residente[]>([])

  const { register, handleSubmit, control, watch, setValue } = useForm<Campos>({
    defaultValues: {
      residente_id: residenteId ?? '',
      turno: detectarTurno(),
      bano_realizado: false,
      higiene_oral: false,
      cambio_ropa: false,
      deposicion: false,
      tipo: 'general',
    },
  })

  useEffect(() => {
    if (!residenteId) {
      api.get<Residente[]>('/residentes?estado=activo')
        .then(r => setResidentes(r.data))
    }
  }, [residenteId])

  const estadoEmocional = watch('estado_emocional')

  async function onSubmit(data: Campos) {
    setError('')
    setGuardando(true)
    try {
      await api.post('/registros', {
        ...data,
        desayuno_pct: data.desayuno_pct === '' ? null : data.desayuno_pct,
        almuerzo_pct: data.almuerzo_pct === '' ? null : data.almuerzo_pct,
        cena_pct:     data.cena_pct     === '' ? null : data.cena_pct,
        horas_sueno:  data.horas_sueno  === '' ? null : data.horas_sueno,
      })
      router.push('/registros')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar el registro')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
      )}

      {/* Residente y turno */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Información del turno</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!residenteId && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Residente *</label>
              <select {...register('residente_id', { required: true })} className="input-base">
                <option value="">Seleccionar residente</option>
                {residentes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} {r.apellido} — Hab. {r.habitacion ?? '?'}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turno *</label>
            <select {...register('turno', { required: true })} className="input-base">
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
              <option value="noche">Noche</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select {...register('tipo')} className="input-base">
              <option value="general">General</option>
              <option value="medico">Médico</option>
              <option value="terapia">Terapia</option>
              <option value="social">Social</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alimentación */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Alimentación</h2>
        <SliderPct label="Desayuno" name="desayuno_pct" register={register} />
        <SliderPct label="Almuerzo" name="almuerzo_pct" register={register} />
        <SliderPct label="Cena"     name="cena_pct"     register={register} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hidratación</label>
          <div className="flex gap-2">
            {['buena', 'regular', 'insuficiente'].map(h => (
              <label key={h} className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" value={h} {...register('hidratacion')} className="accent-mafe-oscuro" />
                <span className="text-sm capitalize">{h}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Higiene */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Higiene y movilidad</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {([
            ['bano_realizado', '🚿 Baño realizado'],
            ['higiene_oral',   '🦷 Higiene oral'],
            ['cambio_ropa',    '👕 Cambio de ropa'],
            ['deposicion',     '🚽 Deposición'],
          ] as const).map(([campo, etiqueta]) => (
            <label key={campo} className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" {...register(campo)} className="w-4 h-4 accent-mafe-oscuro rounded" />
              <span className="text-sm">{etiqueta}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Movilidad</label>
            <select {...register('movilidad')} className="input-base">
              <option value="">Sin registrar</option>
              <option value="independiente">Independiente</option>
              <option value="asistida">Asistida</option>
              <option value="en_cama">En cama</option>
              <option value="en_silla">En silla</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Micción</label>
            <select {...register('miccion')} className="input-base">
              <option value="">Sin registrar</option>
              <option value="normal">Normal</option>
              <option value="incontinencia">Incontinencia</option>
              <option value="retencion">Retención</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Actividad física</label>
            <input {...register('actividad_fisica')} className="input-base" placeholder="Ej: caminata 10 min, ejercicios de silla..." />
          </div>
        </div>
      </div>

      {/* Estado emocional */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Estado emocional</h2>
        <Controller
          name="estado_emocional"
          control={control}
          render={() => (
            <MoodSelector
              valor={estadoEmocional}
              onChange={v => setValue('estado_emocional', v)}
            />
          )}
        />
      </div>

      {/* Sueño */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Sueño (turno anterior)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horas de sueño</label>
            <input
              type="number" min={0} max={24} step={0.5}
              {...register('horas_sueno', { valueAsNumber: true })}
              className="input-base"
              placeholder="Ej: 7.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calidad del sueño</label>
            <select {...register('calidad_sueno')} className="input-base">
              <option value="">Sin registrar</option>
              <option value="buena">Buena</option>
              <option value="regular">Regular</option>
              <option value="mala">Mala</option>
            </select>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800">Observaciones</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones generales</label>
          <textarea {...register('observaciones')} rows={3} className="input-base resize-none"
            placeholder="Comportamiento, comentarios del residente, actividades realizadas..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Novedades <span className="text-red-500">(alertas / incidencias)</span>
          </label>
          <textarea {...register('novedades')} rows={2} className="input-base resize-none border-orange-200 focus:ring-orange-400"
            placeholder="Caída, queja, comportamiento inusual..." />
        </div>
      </div>

      <div className="flex gap-3 justify-end pb-6">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="btn-primary">
          {guardando ? 'Guardando...' : '✓ Guardar registro'}
        </button>
      </div>
    </form>
  )
}
