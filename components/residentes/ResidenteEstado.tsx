import { cn } from '@/lib/utils'

const CONFIG: Record<string, { label: string; class: string }> = {
  activo:        { label: 'Activo',        class: 'bg-green-100 text-green-700' },
  hospitalizado: { label: 'Hospitalizado', class: 'bg-yellow-100 text-yellow-700' },
  egresado:      { label: 'Egresado',      class: 'bg-gray-100 text-gray-600' },
  fallecido:     { label: 'Fallecido',     class: 'bg-red-100 text-red-600' },
}

export default function ResidenteEstado({ estado }: { estado: string }) {
  const cfg = CONFIG[estado] ?? { label: estado, class: 'bg-gray-100 text-gray-600' }
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', cfg.class)}>
      {cfg.label}
    </span>
  )
}
