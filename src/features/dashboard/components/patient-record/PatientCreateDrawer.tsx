import { useState } from 'react'
import { toast } from 'sonner';
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerBadge,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer'
import {
  createPatient,
  type CreatePatientRequest,
  type CreatedPatientDto
} from '../../data/services/patientsService'

const EMPTY_FORM: CreatePatientRequest = {
  cedula: '',
  email: '',
  nombresCompletos: '',
  fechaNacimiento: '',
  genero: '',
  grupoCultural: '',
  estadoCivil: '',
  ocupacion: '',
  regimenSeguridadSocial: '',
  tipoSangre: '',
  telefonoPrincipal: '',
  telefonoSecundario: '',
  direccion: ''
}

type FormErrors = Partial<Record<keyof CreatePatientRequest, string>>

function validate(form: CreatePatientRequest): FormErrors {
  const errors: FormErrors = {}

  if (!/^\d{10}$/.test(form.cedula.trim())) {
    errors.cedula = 'La cédula debe tener 10 dígitos.'
  }
  if (!form.nombresCompletos.trim()) {
    errors.nombresCompletos = 'Este campo es obligatorio.'
  }
  if (!form.fechaNacimiento.trim()) {
    errors.fechaNacimiento = 'La fecha de nacimiento es obligatoria.'
  }
  if (!/^\d{7,15}$/.test(form.telefonoPrincipal.trim())) {
    errors.telefonoPrincipal = 'El teléfono debe tener 7–15 dígitos.'
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'El correo electrónico no es válido.'
  }

  return errors
}

type PatientCreateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (patient: CreatedPatientDto) => void
}

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1A5276] focus:bg-white focus:ring-2 focus:ring-[#1A5276]/20 disabled:cursor-not-allowed disabled:opacity-60'
const inputErrCls =
  'w-full rounded-lg border border-rose-300 bg-rose-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-200'

export function PatientCreateDrawer({ open, onOpenChange, onCreated }: PatientCreateDrawerProps) {
  // Eliminado showSuccess, ahora usamos toast
  const [form, setForm] = useState<CreatePatientRequest>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function set<K extends keyof CreatePatientRequest>(key: K, value: CreatePatientRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setErrors({})
    setSubmitError('')
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm()
    }
    onOpenChange(nextOpen)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSaving(true)
    setSubmitError('')
    
    const promise = (async () => {
      const created = await createPatient(form)
      window.dispatchEvent(
        new CustomEvent('patient-created', {
          detail: {
            patientId: created.id,
            hcl: created.hcl,
            openedAt: new Date().toISOString(),
            clinicalHistoryStatus: 'ABIERTA' as const
          }
        })
      )
      onCreated?.(created)
      resetForm();
      onOpenChange(false);
      return created;
    })();

    toast.promise(promise, {
      loading: 'Registrando paciente en el sistema...',
      success: () => `¡Todo listo! Paciente ${form.nombresCompletos} guardado exitosamente.`,
      error: (err) => {
        const errorMsg = err instanceof Error ? err.message : 'No se pudo registrar el paciente. Revisa cédula o conexión.';
        setSubmitError(errorMsg);
        return 'Ocurrió un error al guardar. Inténtalo de nuevo.';
      }
    });

    promise.finally(() => setIsSaving(false));
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent size="lg">
        <DrawerHeader>
          <DrawerBadge>RF-07</DrawerBadge>
          <DrawerTitle>Registro de nuevo paciente</DrawerTitle>
          <DrawerDescription>
            Los campos marcados con <span className="text-rose-500">*</span> son obligatorios (MSP).
          </DrawerDescription>
        </DrawerHeader>

        <form id="patient-create-form" onSubmit={handleSubmit} noValidate className="contents">
          <DrawerBody>
            {submitError && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {submitError}
              </div>
            )}

            <Section title="1. Identificación">
              <div>
                <Label htmlFor="pc-cedula" required>Cédula</Label>
                <input
                  id="pc-cedula"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.cedula}
                  onChange={(e) => set('cedula', e.target.value)}
                  className={errors.cedula ? inputErrCls : inputCls}
                  aria-invalid={Boolean(errors.cedula)}
                  aria-describedby={errors.cedula ? 'pc-cedula-err' : undefined}
                />
                {errors.cedula && <ErrorText id="pc-cedula-err">{errors.cedula}</ErrorText>}
              </div>

              <div>
                <Label htmlFor="pc-nombres" required>Nombres completos</Label>
                <input
                  id="pc-nombres"
                  type="text"
                  value={form.nombresCompletos}
                  onChange={(e) => set('nombresCompletos', e.target.value)}
                  className={errors.nombresCompletos ? inputErrCls : inputCls}
                  aria-invalid={Boolean(errors.nombresCompletos)}
                  aria-describedby={errors.nombresCompletos ? 'pc-nombres-err' : undefined}
                />
                {errors.nombresCompletos && (
                  <ErrorText id="pc-nombres-err">{errors.nombresCompletos}</ErrorText>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pc-fecha-nac" required>Fecha de nacimiento</Label>
                  <input
                    id="pc-fecha-nac"
                    type="date"
                    value={form.fechaNacimiento}
                    onChange={(e) => set('fechaNacimiento', e.target.value)}
                    className={errors.fechaNacimiento ? inputErrCls : inputCls}
                    aria-invalid={Boolean(errors.fechaNacimiento)}
                  />
                  {errors.fechaNacimiento && <ErrorText>{errors.fechaNacimiento}</ErrorText>}
                </div>
                <div>
                  <Label htmlFor="pc-genero">Género</Label>
                  <select
                    id="pc-genero"
                    value={form.genero}
                    onChange={(e) => set('genero', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Seleccionar</option>
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>
            </Section>

            <Section title="2. Contacto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pc-tel-principal" required>Teléfono principal</Label>
                  <input
                    id="pc-tel-principal"
                    type="text"
                    inputMode="tel"
                    value={form.telefonoPrincipal}
                    onChange={(e) => set('telefonoPrincipal', e.target.value)}
                    className={errors.telefonoPrincipal ? inputErrCls : inputCls}
                    aria-invalid={Boolean(errors.telefonoPrincipal)}
                  />
                  {errors.telefonoPrincipal && <ErrorText>{errors.telefonoPrincipal}</ErrorText>}
                </div>
                <div>
                  <Label htmlFor="pc-tel-sec">Teléfono secundario</Label>
                  <input
                    id="pc-tel-sec"
                    type="text"
                    inputMode="tel"
                    value={form.telefonoSecundario}
                    onChange={(e) => set('telefonoSecundario', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pc-email">Correo electrónico</Label>
                <input
                  id="pc-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={errors.email ? inputErrCls : inputCls}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && <ErrorText>{errors.email}</ErrorText>}
              </div>

              <div>
                <Label htmlFor="pc-direccion">Dirección</Label>
                <textarea
                  id="pc-direccion"
                  value={form.direccion}
                  onChange={(e) => set('direccion', e.target.value)}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </Section>

            <Section title="3. Datos socioeconómicos">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pc-grupo">Grupo cultural</Label>
                  <select
                    id="pc-grupo"
                    value={form.grupoCultural}
                    onChange={(e) => set('grupoCultural', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Mestizo">Mestizo</option>
                    <option value="Indígena">Indígena</option>
                    <option value="Afroecuatoriano">Afroecuatoriano</option>
                    <option value="Montubio">Montubio</option>
                    <option value="Blanco">Blanco</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="pc-civil">Estado civil</Label>
                  <select
                    id="pc-civil"
                    value={form.estadoCivil}
                    onChange={(e) => set('estadoCivil', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Seleccionar</option>
                    <option value="SOLTERO">Soltero/a</option>
                    <option value="CASADO">Casado/a</option>
                    <option value="DIVORCIADO">Divorciado/a</option>
                    <option value="VIUDO">Viudo/a</option>
                    <option value="UNION_LIBRE">Unión libre</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="pc-ocupacion">Ocupación</Label>
                  <input
                    id="pc-ocupacion"
                    type="text"
                    value={form.ocupacion}
                    onChange={(e) => set('ocupacion', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label htmlFor="pc-sangre">Tipo de sangre</Label>
                  <select
                    id="pc-sangre"
                    value={form.tipoSangre}
                    onChange={(e) => set('tipoSangre', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Seleccionar</option>
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="pc-seg-social">Régimen seguridad social</Label>
                  <input
                    id="pc-seg-social"
                    type="text"
                    value={form.regimenSeguridadSocial}
                    onChange={(e) => set('regimenSeguridadSocial', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </Section>
          </DrawerBody>

          <DrawerFooter>
            <DrawerClose
              render={
                <Button type="button" variant="outline" size="sm" disabled={isSaving}>
                  Cancelar
                </Button>
              }
            />
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              aria-busy={isSaving}
              className="bg-[#1A5276] text-white hover:bg-[#154360]"
            >
              {isSaving ? 'Guardando…' : 'Guardar paciente'}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mb-5">
      <legend className="mb-3 text-sm font-semibold text-slate-700">{title}</legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  )
}

function Label({
  htmlFor,
  children,
  required
}: {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
      {children}
      {required && <span className="ml-0.5 text-rose-500" aria-hidden="true">*</span>}
    </label>
  )
}

function ErrorText({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1 text-xs text-rose-700">
      {children}
    </p>
  )
}
