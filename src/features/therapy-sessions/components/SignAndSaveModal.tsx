import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogMedia,
} from '@/components/ui/alert-dialog'
import { Loader2Icon, PenLineIcon, ShieldAlertIcon } from 'lucide-react'

type Props = {
  open:        boolean
  onOpenChange: (open: boolean) => void
  onConfirm:   () => Promise<void>
  patientName: string
  costo:       number
  isLoading:   boolean
}

export function SignAndSaveModal({
  open,
  onOpenChange,
  onConfirm,
  patientName,
  costo,
  isLoading,
}: Props) {
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = async () => {
    await onConfirm()
    setConfirmed(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmed(false)
    onOpenChange(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-50">
            <ShieldAlertIcon className="text-amber-600" />
          </AlertDialogMedia>
          <AlertDialogTitle>Confirmar Firma Electrónica</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-left">
            <span className="block">
              Está a punto de firmar la sesión de <strong>{patientName}</strong> con
              un costo de <strong>${costo.toFixed(2)}</strong>.
            </span>
            <span className="block font-medium text-rose-600">
              Esta acción es irreversible. Una vez firmada, ningún campo podrá ser editado
              y el costo será enviado automáticamente a facturación.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-amber-600"
          />
          <span className="text-sm text-slate-700">
            Confirmo que he revisado toda la información clínica y que la sesión
            está completa y lista para ser firmada.
          </span>
        </label>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!confirmed || isLoading}
            className="bg-[#1A5276] text-white hover:bg-[#1A5276]/90 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Firmando...
              </>
            ) : (
              <>
                <PenLineIcon className="mr-2 h-4 w-4" />
                Guardar y Firmar
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
