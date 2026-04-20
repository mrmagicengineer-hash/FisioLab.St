import { Toaster as Sonner } from "sonner";
import { Loader2, CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";

export function SonnerToaster() {
  return (
    <Sonner
      position="top-right"
      duration={2500}
      // Aseguramos que las animaciones nativas de Sonner estén activas
      icons={{
        // Iconos con sus colores correspondientes
        success: <CheckCircle2 className="size-5 text-emerald-500" />,
        error: <XCircle className="size-5 text-rose-500" />,
        warning: <AlertTriangle className="size-5 text-amber-500" />,
        info: <Info className="size-5 text-blue-500" />,
        loading: <Loader2 className="size-5 text-slate-500 animate-spin shrink-0" />,
      }}
      toastOptions={{
        // 1. CLASE BASE: Define la tarjeta blanca, su sombra y el layout (sin romper a Sonner)
        className: "w-full sm:w-[380px] bg-white border border-slate-200 shadow-lg rounded-md p-4 flex items-start gap-3",
        
        classNames: {
          // 2. BORDES LATERALES: Usamos "!" para forzar el color del borde izquierdo sin matar la animación
          success: "!border-l-[5px] !border-l-emerald-500",
          error: "!border-l-[5px] !border-l-rose-500",
          warning: "!border-l-[5px] !border-l-amber-500",
          info: "!border-l-[5px] !border-l-blue-500",
          loading: "!border-l-[5px] !border-l-slate-400",
          
          // 3. ESTRUCTURA INTERNA: Evita que el texto se superponga al icono
          content: "flex-1 flex flex-col gap-1",
          title: "text-sm font-semibold text-slate-900",
          description: "text-sm text-slate-500",
          icon: "mt-0.5 flex-shrink-0",
        },
      }}
    />
  );
}