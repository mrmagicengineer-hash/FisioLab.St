import { Button } from '@/components/ui/button'

type ConfirmCriticalChangesModalProps = {
  open: boolean
  isSavingChanges: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmCriticalChangesModal({
  open,
  isSavingChanges,
  onClose,
  onConfirm
}: ConfirmCriticalChangesModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-slate-950/30 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">Confirmar cambios criticos</h3>
        <p className="mt-2 text-sm text-slate-600">
          Estas por actualizar cedula, nombres o telefono principal. Confirma para persistir estos cambios.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Revisar
          </Button>
          <Button
            type="button"
            className="bg-[#4A7FA5] hover:bg-[#3f6d8f]"
            onClick={onConfirm}
            disabled={isSavingChanges}
          >
            Confirmar y guardar
          </Button>
        </div>
      </div>
    </div>
  )
}
