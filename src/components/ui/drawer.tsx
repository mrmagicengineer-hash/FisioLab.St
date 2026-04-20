import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const DRAWER_SIZE_CLASSES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-[480px]',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-3xl'
} as const

type DrawerSize = keyof typeof DRAWER_SIZE_CLASSES

function Drawer(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root {...props} />
}

function DrawerTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerPortal(props: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        'fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-[2px]',
        'opacity-100 transition-opacity duration-200 ease-out data-closed:opacity-0 data-starting-style:opacity-0',
        className
      )}
      {...props}
    />
  )
}

type DrawerContentProps = DialogPrimitive.Popup.Props & {
  size?: DrawerSize
  /** Hide the default close (X) button in the top-right corner. */
  hideCloseButton?: boolean
}

function DrawerContent({
  className,
  children,
  size = 'md',
  hideCloseButton,
  ...props
}: DrawerContentProps) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DialogPrimitive.Popup
        data-slot="drawer-content"
        className={cn(
          'fixed inset-y-0 right-0 z-70 flex w-full flex-col bg-white shadow-2xl outline-none',
          'translate-x-0 transition-transform duration-200 ease-out data-closed:translate-x-full data-starting-style:translate-x-full',
          DRAWER_SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close
            aria-label="Cerrar"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            <XIcon className="h-5 w-5" aria-hidden="true" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'flex shrink-0 flex-col gap-0.5 border-b border-slate-100 px-6 py-5 pr-14',
        className
      )}
      {...props}
    />
  )
}

function DrawerBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-body"
      className={cn('flex-1 overflow-y-auto px-6 py-5', className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        'flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4',
        className
      )}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-lg font-bold leading-snug text-slate-900', className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-xs text-slate-500', className)}
      {...props}
    />
  )
}

function DrawerBadge({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="drawer-badge"
      className={cn(
        'text-xs font-medium uppercase tracking-widest text-slate-400',
        className
      )}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerBadge
}
export type { DrawerSize }
