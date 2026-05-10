'use client'
import { cn } from '@/lib/utils'

const ESTADOS = [
  { valor: 'tranquilo', emoji: '😌', label: 'Tranquilo' },
  { valor: 'activo',    emoji: '😊', label: 'Activo' },
  { valor: 'agitado',   emoji: '😤', label: 'Agitado' },
  { valor: 'triste',    emoji: '😢', label: 'Triste' },
  { valor: 'ansioso',   emoji: '😰', label: 'Ansioso' },
  { valor: 'confuso',   emoji: '😵', label: 'Confuso' },
  { valor: 'dormido',   emoji: '😴', label: 'Dormido' },
]

interface Props {
  valor?: string
  onChange: (v: string) => void
}

export default function MoodSelector({ valor, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {ESTADOS.map(e => (
        <button
          key={e.valor}
          type="button"
          onClick={() => onChange(valor === e.valor ? '' : e.valor)}
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all',
            valor === e.valor
              ? 'border-mafe bg-mafe-claro text-mafe-oscuro scale-105'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
          )}
        >
          <span className="text-2xl">{e.emoji}</span>
          <span>{e.label}</span>
        </button>
      ))}
    </div>
  )
}
