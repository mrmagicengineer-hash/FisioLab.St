"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right" 
      icons={{
        success: <CircleCheckIcon className="size-4 text-white" />,
        info: <InfoIcon className="size-4 text-white" />,
        warning: <TriangleAlertIcon className="size-4 text-white" />,
        error: <OctagonXIcon className="size-4 text-white" />,
        loading: <Loader2Icon className="size-4 text-slate-500 animate-spin" />,
      }}
      toastOptions={{
        // 1. EL TRUCO: Modificamos el ancho a través de su variable interna segura
        // Esto evita romper las matemáticas de la animación de deslizamiento.
        style: {
          '--width': '380px',
        } as React.CSSProperties,

        classNames: {
          // 2. SOLO cambiamos la capa visual. 
          // Eliminamos los !flex, !p-4, !gap-3. Dejamos que Sonner mantenga su propio layout interno.
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:border group-[.toaster]:border-slate-200 group-[.toaster]:shadow-xl group-[.toaster]:rounded-lg",
          
          // Textos
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:text-slate-900 group-[.toast]:leading-none",
          description: "group-[.toast]:text-xs group-[.toast]:text-slate-500 group-[.toast]:leading-relaxed mt-1",
          
          // Contenedor redondo para el ícono
          icon: "group-[.toast]:flex group-[.toast]:size-6 group-[.toast]:items-center group-[.toast]:justify-center group-[.toast]:rounded-full",
          
          // 3. Bordes laterales gruesos y color de fondo para el círculo
          success: "group-[.toaster]:border-l-[5px] group-[.toaster]:border-l-emerald-500 [&_[data-icon]]:bg-emerald-500",
          error: "group-[.toaster]:border-l-[5px] group-[.toaster]:border-l-red-500 [&_[data-icon]]:bg-red-500",
          warning: "group-[.toaster]:border-l-[5px] group-[.toaster]:border-l-amber-500 [&_[data-icon]]:bg-amber-500",
          info: "group-[.toaster]:border-l-[5px] group-[.toaster]:border-l-blue-500 [&_[data-icon]]:bg-blue-500",
          loading: "group-[.toaster]:border-l-[5px] group-[.toaster]:border-l-slate-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }