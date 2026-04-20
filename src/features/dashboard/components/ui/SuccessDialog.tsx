import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle2 } from "lucide-react"

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  onConfirm: () => void;
}

export function SuccessDialog({
  open,
  onOpenChange,
  title = "¡Operación exitosa!",
  description = "El registro se ha guardado correctamente.",
  confirmText = "Continuar",
  onConfirm,
}: SuccessDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md bg-white rounded-2xl shadow-lg border-slate-100">
        <AlertDialogHeader className="flex flex-col items-center text-center space-y-4">
          {/* Icono de éxito con fondo suave */}
          <div className="w-16 h-16 bg-emerald-100/80 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          
          <AlertDialogTitle className="text-xl font-bold text-slate-800">
            {title}
          </AlertDialogTitle>
          
          <AlertDialogDescription className="text-sm text-slate-500">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="sm:justify-center mt-6">
          <AlertDialogAction 
            onClick={onConfirm}
            className="w-full sm:w-auto bg-[#1A5276] hover:bg-[#154360] text-white px-8 rounded-lg transition-colors"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}