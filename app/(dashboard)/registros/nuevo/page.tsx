import RegistroForm from '@/components/registros/RegistroForm'

export default function NuevoRegistroPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mafe-oscuro">Nuevo registro de turno</h1>
        <p className="text-sm text-gray-500 mt-1">
          Completa la información del residente para este turno
        </p>
      </div>
      <RegistroForm />
    </div>
  )
}
