import ResidenteForm from '@/components/residentes/ResidenteForm'

export default function NuevoResidentePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mafe-oscuro">Nuevo residente</h1>
        <p className="text-sm text-gray-500 mt-1">Completa la información del nuevo residente</p>
      </div>
      <ResidenteForm modo="crear" />
    </div>
  )
}
