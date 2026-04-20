import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  createFamilyAntecedent,
  createPersonalAntecedent,
  getClinicalHistoryByPatientId,
  getClinicalHistoryComplete,
  getFamilyAntecedents,
  getPersonalAntecedents,
  type FamilyAntecedentApiRelationship,
  type FamilyAntecedentDto,
  type PersonalAntecedentApiStatus,
  type PersonalAntecedentApiType,
  type PersonalAntecedentDto
} from '../../data/services/clinicalHistoryService'

type PersonalAntecedentCategory =
  | 'patologicos'
  | 'quirurgicos'
  | 'traumatologicos'
  | 'alergicos'
  | 'farmacologicos'
  | 'gineco-obstetricos'

type PersonalAntecedentStatus = 'ACTIVO' | 'RESUELTO'

type PersonalAntecedentItem = {
  id: string
  category: PersonalAntecedentCategory
  description: string
  cie10Code: string
  cie10Label: string
  status: PersonalAntecedentStatus
}

type FamilyRelationship = 'Padre' | 'Madre' | 'Hermano/a' | 'Abuelo/a'

type FamilyAntecedentItem = {
  id: string
  relationship: FamilyRelationship
  condition: string
  cie10Code: string
  cie10Label: string
}

type Cie10Option = {
  code: string
  label: string
}

type PersonalFormState = {
  description: string
  cie10Code: string
  cie10Label: string
  cie10Query: string
  status: PersonalAntecedentStatus
}

type FamilyFormState = {
  relationship: FamilyRelationship
  condition: string
  cie10Code: string
  cie10Label: string
  cie10Query: string
}

type AntecedentsTabSectionProps = {
  canEditRecord: boolean
  patientId: number | null
  numeroHclHint: string
}

const PERSONAL_CATEGORY_LABELS: Array<{ key: PersonalAntecedentCategory; label: string }> = [
  { key: 'patologicos', label: 'Patologicos' },
  { key: 'quirurgicos', label: 'Quirurgicos' },
  { key: 'traumatologicos', label: 'Traumatologicos' },
  { key: 'alergicos', label: 'Alergicos' },
  { key: 'farmacologicos', label: 'Farmacologicos' },
  { key: 'gineco-obstetricos', label: 'Gineco-obstetricos' }
]

const CIE10_OPTIONS: Cie10Option[] = [
  { code: 'I10', label: 'Hipertension esencial (primaria)' },
  { code: 'J45', label: 'Asma' },
  { code: 'E11', label: 'Diabetes mellitus tipo 2' },
  { code: 'K35.8', label: 'Apendicitis aguda, otras y no especificadas' },
  { code: 'M54.5', label: 'Lumbalgia' },
  { code: 'S93.4', label: 'Esguince de tobillo' },
  { code: 'L20.9', label: 'Dermatitis atopica' },
  { code: 'N80.9', label: 'Endometriosis no especificada' }
]

const INITIAL_PERSONAL_FORM: PersonalFormState = {
  description: '',
  cie10Code: '',
  cie10Label: '',
  cie10Query: '',
  status: 'ACTIVO'
}

const INITIAL_FAMILY_FORM: FamilyFormState = {
  relationship: 'Padre',
  condition: '',
  cie10Code: '',
  cie10Label: '',
  cie10Query: ''
}

const QUICK_ADD_BY_CATEGORY: Record<
  PersonalAntecedentCategory,
  Array<{ description: string; cie10Code: string; cie10Label: string }>
> = {
  patologicos: [
    { description: 'Diabetes mellitus tipo 2', cie10Code: 'E11', cie10Label: 'Diabetes mellitus tipo 2' },
    { description: 'Hipertension esencial', cie10Code: 'I10', cie10Label: 'Hipertension esencial (primaria)' },
    { description: 'Asma', cie10Code: 'J45', cie10Label: 'Asma' }
  ],
  quirurgicos: [
    { description: 'Apendicectomia previa', cie10Code: 'K35.8', cie10Label: 'Apendicitis aguda, otras y no especificadas' },
    { description: 'Colecistectomia', cie10Code: '', cie10Label: '' },
    { description: 'Hernioplastia', cie10Code: '', cie10Label: '' }
  ],
  traumatologicos: [
    { description: 'Esguince de tobillo', cie10Code: 'S93.4', cie10Label: 'Esguince de tobillo' },
    { description: 'Fractura de radio', cie10Code: '', cie10Label: '' },
    { description: 'Luxacion de hombro', cie10Code: '', cie10Label: '' }
  ],
  alergicos: [
    { description: 'Alergia a penicilina', cie10Code: '', cie10Label: '' },
    { description: 'Dermatitis atopica', cie10Code: 'L20.9', cie10Label: 'Dermatitis atopica' },
    { description: 'Alergia alimentaria', cie10Code: '', cie10Label: '' }
  ],
  farmacologicos: [
    { description: 'Uso cronico de antihipertensivos', cie10Code: 'I10', cie10Label: 'Hipertension esencial (primaria)' },
    { description: 'Uso de metformina', cie10Code: 'E11', cie10Label: 'Diabetes mellitus tipo 2' },
    { description: 'Uso de broncodilatadores', cie10Code: 'J45', cie10Label: 'Asma' }
  ],
  'gineco-obstetricos': [
    { description: 'Endometriosis', cie10Code: 'N80.9', cie10Label: 'Endometriosis no especificada' },
    { description: 'Cesarea previa', cie10Code: '', cie10Label: '' },
    { description: 'Aborto espontaneo previo', cie10Code: '', cie10Label: '' }
  ]
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function isFuzzyMatch(query: string, candidate: string): boolean {
  const normalizedQuery = normalizeText(query)
  const normalizedCandidate = normalizeText(candidate)

  if (normalizedCandidate.includes(normalizedQuery)) {
    return true
  }

  let queryIndex = 0
  for (let candidateIndex = 0; candidateIndex < normalizedCandidate.length; candidateIndex += 1) {
    if (normalizedCandidate[candidateIndex] === normalizedQuery[queryIndex]) {
      queryIndex += 1
      if (queryIndex === normalizedQuery.length) {
        return true
      }
    }
  }

  return false
}

function Cie10SearchInput({
  value,
  selectedCode,
  selectedLabel,
  onValueChange,
  onSelect,
  inputId,
  placeholder
}: {
  value: string
  selectedCode: string
  selectedLabel: string
  onValueChange: (value: string) => void
  onSelect: (option: Cie10Option) => void
  inputId: string
  placeholder: string
}) {
  const [isFocused, setIsFocused] = useState(false)

  const suggestions = useMemo(() => {
    const query = value.trim()
    if (!query) {
      return CIE10_OPTIONS.slice(0, 6)
    }

    return CIE10_OPTIONS.filter((option) => {
      const aggregate = `${option.code} ${option.label}`
      return isFuzzyMatch(query, aggregate)
    }).slice(0, 6)
  }, [value])

  const showSuggestions = isFocused && suggestions.length > 0

  return (
    <div className="relative">
      <input
        id={inputId}
        type="text"
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          window.setTimeout(() => {
            setIsFocused(false)
          }, 120)
        }}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
      />

      {selectedCode && selectedLabel && (
        <p className="mt-1 text-xs text-slate-500">Seleccionado: [{selectedCode}] {selectedLabel}</p>
      )}

      {showSuggestions && (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {suggestions.map((option) => (
            <button
              key={option.code}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault()
                onSelect(option)
              }}
              className="w-full rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="font-semibold">{option.code}</span>
              <span className="text-slate-500"> - {option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AntecedentsTabSection({
  canEditRecord,
  patientId,
  numeroHclHint
}: AntecedentsTabSectionProps) {
  const [activeCategory, setActiveCategory] = useState<PersonalAntecedentCategory>('patologicos')
  const [personalAntecedents, setPersonalAntecedents] = useState<PersonalAntecedentItem[]>([])
  const [familyAntecedents, setFamilyAntecedents] = useState<FamilyAntecedentItem[]>([])
  const [resolvedNumeroHcl, setResolvedNumeroHcl] = useState('')
  const [isLoadingAntecedents, setIsLoadingAntecedents] = useState(false)
  const [isSavingPersonal, setIsSavingPersonal] = useState(false)
  const [isSavingFamily, setIsSavingFamily] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [syncInfo, setSyncInfo] = useState('')

  const [showPersonalInlineForm, setShowPersonalInlineForm] = useState(false)
  const [personalForm, setPersonalForm] = useState<PersonalFormState>(INITIAL_PERSONAL_FORM)
  const [isPersonalComboboxFocused, setIsPersonalComboboxFocused] = useState(false)

  const [showFamilyInlineForm, setShowFamilyInlineForm] = useState(false)
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null)
  const [familyForm, setFamilyForm] = useState<FamilyFormState>(INITIAL_FAMILY_FORM)

  const [personalError, setPersonalError] = useState('')
  const [familyError, setFamilyError] = useState('')

  const personalCreatableSuggestions = useMemo(() => {
    const query = personalForm.cie10Query.trim()

    if (!query) {
      return CIE10_OPTIONS.slice(0, 6)
    }

    return CIE10_OPTIONS.filter((option) => {
      const aggregate = `${option.code} ${option.label}`
      return isFuzzyMatch(query, aggregate)
    }).slice(0, 6)
  }, [personalForm.cie10Query])

  function mapPersonalApiTypeToCategory(type: PersonalAntecedentApiType): PersonalAntecedentCategory {
    switch (type) {
      case 'PATOLOGICO':
        return 'patologicos'
      case 'QUIRURGICO':
        return 'quirurgicos'
      case 'TRAUMATOLOGICO':
        return 'traumatologicos'
      case 'ALERGICO':
        return 'alergicos'
      case 'FARMACOLOGICO':
        return 'farmacologicos'
      case 'GINECO_OBSTETRICO':
        return 'gineco-obstetricos'
      default:
        return 'patologicos'
    }
  }

  function mapCategoryToPersonalApiType(category: PersonalAntecedentCategory): PersonalAntecedentApiType {
    switch (category) {
      case 'patologicos':
        return 'PATOLOGICO'
      case 'quirurgicos':
        return 'QUIRURGICO'
      case 'traumatologicos':
        return 'TRAUMATOLOGICO'
      case 'alergicos':
        return 'ALERGICO'
      case 'farmacologicos':
        return 'FARMACOLOGICO'
      case 'gineco-obstetricos':
        return 'GINECO_OBSTETRICO'
      default:
        return 'PATOLOGICO'
    }
  }

  function mapPersonalApiToItem(item: PersonalAntecedentDto): PersonalAntecedentItem {
    const option = CIE10_OPTIONS.find((entry) => entry.code === item.codigoCie10)

    return {
      id: String(item.id),
      category: mapPersonalApiTypeToCategory(item.tipo),
      description: item.descripcion,
      cie10Code: item.codigoCie10 ?? '',
      cie10Label: option?.label ?? '',
      status: item.estado
    }
  }

  function mapRelationshipApiToUi(relationship: FamilyAntecedentApiRelationship): FamilyRelationship {
    switch (relationship) {
      case 'PADRE':
        return 'Padre'
      case 'MADRE':
        return 'Madre'
      case 'HERMANO':
        return 'Hermano/a'
      case 'ABUELO':
        return 'Abuelo/a'
      default:
        return 'Padre'
    }
  }

  function mapRelationshipUiToApi(relationship: FamilyRelationship): FamilyAntecedentApiRelationship {
    switch (relationship) {
      case 'Padre':
        return 'PADRE'
      case 'Madre':
        return 'MADRE'
      case 'Hermano/a':
        return 'HERMANO'
      case 'Abuelo/a':
        return 'ABUELO'
      default:
        return 'PADRE'
    }
  }

  function mapFamilyApiToItem(item: FamilyAntecedentDto): FamilyAntecedentItem {
    const option = CIE10_OPTIONS.find((entry) => entry.code === item.codigoCie10)

    return {
      id: String(item.id),
      relationship: mapRelationshipApiToUi(item.parentesco),
      condition: item.condicion,
      cie10Code: item.codigoCie10 ?? '',
      cie10Label: option?.label ?? ''
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadAntecedents() {
      if (!patientId) {
        setResolvedNumeroHcl('')
        setPersonalAntecedents([])
        setFamilyAntecedents([])
        setLoadError('')
        return
      }

      try {
        setIsLoadingAntecedents(true)
        setLoadError('')

        let hcl = numeroHclHint.trim()
        if (!hcl || hcl === '-') {
          const history = await getClinicalHistoryByPatientId(patientId)
          hcl = history.numeroHcl
        }

        if (!hcl || hcl === '-') {
          throw new Error('No se pudo determinar el numero de historia clinica del paciente.')
        }

        let personal: PersonalAntecedentDto[] = []
        let family: FamilyAntecedentDto[] = []

        try {
          const complete = await getClinicalHistoryComplete(hcl)
          personal = complete.antecedentesPersonales ?? []
          family = complete.antecedentesFamiliares ?? []
        } catch {
          ;[personal, family] = await Promise.all([
            getPersonalAntecedents(hcl),
            getFamilyAntecedents(hcl)
          ])
        }

        if (cancelled) {
          return
        }

        setResolvedNumeroHcl(hcl)
        setPersonalAntecedents(personal.map(mapPersonalApiToItem))
        setFamilyAntecedents(family.map(mapFamilyApiToItem))
      } catch (error) {
        if (cancelled) {
          return
        }

        setResolvedNumeroHcl('')
        setPersonalAntecedents([])
        setFamilyAntecedents([])
        setLoadError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los antecedentes del paciente.'
        )
      } finally {
        if (!cancelled) {
          setIsLoadingAntecedents(false)
        }
      }
    }

    void loadAntecedents()

    return () => {
      cancelled = true
    }
  }, [patientId, numeroHclHint])

  const categoryAntecedents = useMemo(() => {
    return personalAntecedents.filter((item) => item.category === activeCategory)
  }, [personalAntecedents, activeCategory])

  function openPersonalFormForCreate() {
    if (!canEditRecord) {
      return
    }

    setPersonalError('')
    setPersonalForm(INITIAL_PERSONAL_FORM)
    setShowPersonalInlineForm(true)
  }

  async function savePersonalAntecedent() {
    const description = personalForm.description.trim()
    if (!description) {
      setPersonalError('La descripcion es obligatoria.')
      return
    }

    if (!resolvedNumeroHcl) {
      setPersonalError('No se encontro una historia clinica activa para este paciente.')
      return
    }

    try {
      setIsSavingPersonal(true)
      const created = await createPersonalAntecedent(resolvedNumeroHcl, {
        tipo: mapCategoryToPersonalApiType(activeCategory),
        descripcion: description,
        codigoCie10: personalForm.cie10Code || undefined,
        estado: personalForm.status as PersonalAntecedentApiStatus
      })

      setPersonalAntecedents((previous) => [mapPersonalApiToItem(created), ...previous])
      setSyncInfo('Antecedente personal registrado correctamente.')
    } catch (error) {
      setPersonalError(
        error instanceof Error
          ? error.message
          : 'No se pudo registrar el antecedente personal.'
      )
      return
    } finally {
      setIsSavingPersonal(false)
    }

    setShowPersonalInlineForm(false)
    setPersonalForm(INITIAL_PERSONAL_FORM)
    setPersonalError('')
  }

  async function addQuickPersonalAntecedent(template: {
    description: string
    cie10Code: string
    cie10Label: string
  }) {
    if (!canEditRecord) {
      return
    }

    if (!resolvedNumeroHcl) {
      setPersonalError('No se encontro una historia clinica activa para este paciente.')
      return
    }

    const alreadyExists = personalAntecedents.some(
      (item) => item.category === activeCategory && normalizeText(item.description) === normalizeText(template.description)
    )

    if (alreadyExists) {
      setSyncInfo('Ese antecedente ya existe en la categoria activa.')
      return
    }

    try {
      setIsSavingPersonal(true)
      const created = await createPersonalAntecedent(resolvedNumeroHcl, {
        tipo: mapCategoryToPersonalApiType(activeCategory),
        descripcion: template.description,
        codigoCie10: template.cie10Code || undefined,
        estado: 'ACTIVO'
      })

      setPersonalAntecedents((previous) => [mapPersonalApiToItem(created), ...previous])
      setSyncInfo('Antecedente agregado desde sugerencias rapidas.')
    } catch (error) {
      setPersonalError(
        error instanceof Error
          ? error.message
          : 'No se pudo registrar el antecedente personal.'
      )
    } finally {
      setIsSavingPersonal(false)
    }
  }

  function updatePersonalAntecedentStatus(id: string, status: PersonalAntecedentStatus) {
    if (!canEditRecord) {
      return
    }

    setPersonalAntecedents((previous) =>
      previous.map((item) => (item.id === id ? { ...item, status } : item))
    )
    setSyncInfo('Estado actualizado en pantalla. Endpoint de actualizacion pendiente en backend.')
  }

  function deletePersonalAntecedent(id: string) {
    if (!canEditRecord) {
      return
    }

    setPersonalAntecedents((previous) => previous.filter((item) => item.id !== id))
  }

  function openFamilyFormForCreate() {
    if (!canEditRecord) {
      return
    }

    setEditingFamilyId(null)
    setFamilyError('')
    setFamilyForm(INITIAL_FAMILY_FORM)
    setShowFamilyInlineForm(true)
  }

  function openFamilyFormForEdit(item: FamilyAntecedentItem) {
    if (!canEditRecord) {
      return
    }

    setEditingFamilyId(item.id)
    setFamilyError('')
    setFamilyForm({
      relationship: item.relationship,
      condition: item.condition,
      cie10Code: item.cie10Code,
      cie10Label: item.cie10Label,
      cie10Query: item.cie10Code ? `${item.cie10Code} - ${item.cie10Label}` : ''
    })
    setShowFamilyInlineForm(true)
  }

  async function saveFamilyAntecedent() {
    const condition = familyForm.condition.trim()
    if (!condition) {
      setFamilyError('La condicion es obligatoria.')
      return
    }

    if (!resolvedNumeroHcl) {
      setFamilyError('No se encontro una historia clinica activa para este paciente.')
      return
    }

    if (editingFamilyId) {
      const nextItem: FamilyAntecedentItem = {
        id: editingFamilyId,
        relationship: familyForm.relationship,
        condition,
        cie10Code: familyForm.cie10Code,
        cie10Label: familyForm.cie10Label
      }

      setFamilyAntecedents((previous) =>
        previous.map((item) => (item.id === editingFamilyId ? nextItem : item))
      )
      setSyncInfo('Edicion aplicada en pantalla. Endpoint de actualizacion pendiente en backend.')
    } else {
      try {
        setIsSavingFamily(true)
        const created = await createFamilyAntecedent(resolvedNumeroHcl, {
          parentesco: mapRelationshipUiToApi(familyForm.relationship),
          condicion: condition,
          codigoCie10: familyForm.cie10Code || undefined
        })

        setFamilyAntecedents((previous) => [mapFamilyApiToItem(created), ...previous])
        setSyncInfo('Antecedente familiar registrado correctamente.')
      } catch (error) {
        setFamilyError(
          error instanceof Error
            ? error.message
            : 'No se pudo registrar el antecedente familiar.'
        )
        return
      } finally {
        setIsSavingFamily(false)
      }
    }

    setShowFamilyInlineForm(false)
    setEditingFamilyId(null)
    setFamilyForm(INITIAL_FAMILY_FORM)
    setFamilyError('')
  }

  function deleteFamilyAntecedent(id: string) {
    if (!canEditRecord) {
      return
    }

    setFamilyAntecedents((previous) => previous.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-4">
      {resolvedNumeroHcl && (
        <p className="text-xs text-slate-500">Historia clinica activa: <span className="font-semibold text-slate-700">{resolvedNumeroHcl}</span></p>
      )}

      {loadError && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{loadError}</p>
      )}

      {syncInfo && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{syncInfo}</p>
      )}

      <section className="rounded-xl border border-[#1f5563]/15 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1f5563]">Antecedentes personales</h3>
            <p className="text-xs text-slate-500">RF-14: patologicos, quirurgicos, traumatologicos, alergicos, farmacologicos y gineco-obstetricos.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-2">
            {PERSONAL_CATEGORY_LABELS.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => {
                  setActiveCategory(category.key)
                  setShowPersonalInlineForm(false)
                  setPersonalError('')
                }}
                className={`mb-1 block w-full rounded-md px-3 py-2 text-left text-sm ${activeCategory === category.key
                  ? 'bg-[#1f5563]/10 font-semibold text-[#1f5563]'
                  : 'text-slate-600 hover:bg-white'
                  }`}
              >
                {category.label}
              </button>
            ))}
          </aside>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-700">
                Categoria activa: {PERSONAL_CATEGORY_LABELS.find((item) => item.key === activeCategory)?.label}
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={openPersonalFormForCreate}
                disabled={!canEditRecord}
                title={!canEditRecord ? 'Accion deshabilitada para este rol.' : undefined}
              >
                + Anadir antecedente
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Comunes:</span>
              {QUICK_ADD_BY_CATEGORY[activeCategory].map((template) => (
                <button
                  key={`${activeCategory}-${template.description}`}
                  type="button"
                  onClick={() => {
                    void addQuickPersonalAntecedent(template)
                  }}
                  disabled={!canEditRecord || isSavingPersonal}
                  className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  + {template.description}
                </button>
              ))}
            </div>

            {isLoadingAntecedents ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Cargando antecedentes personales...
              </p>
            ) : categoryAntecedents.length === 0 && !showPersonalInlineForm && (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Sin antecedentes en esta categoria.
              </p>
            )}

            {categoryAntecedents.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                {categoryAntecedents.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">{item.description}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.cie10Code ? `CIE-10: ${item.cie10Code}` : 'Sin codigo'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="sr-only" htmlFor={`estado-${item.id}`}>Estado del antecedente</label>
                      <select
                        id={`estado-${item.id}`}
                        value={item.status}
                        onChange={(event) => {
                          updatePersonalAntecedentStatus(item.id, event.target.value as PersonalAntecedentStatus)
                        }}
                        className={`h-8 rounded-md border px-2 text-xs font-semibold ${item.status === 'ACTIVO'
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          }`}
                        disabled={!canEditRecord}
                      >
                        <option value="ACTIVO">Activo</option>
                        <option value="RESUELTO">Resuelto</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => deletePersonalAntecedent(item.id)}
                        disabled={!canEditRecord}
                        className="inline-flex h-8 items-center rounded-md border border-slate-200 px-2 text-xs font-medium text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Eliminar antecedente"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showPersonalInlineForm && (
              <div
                className="rounded-lg border border-[#1f5563]/20 bg-[#1f5563]/5 p-3"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    const target = event.target as HTMLElement
                    if (target.tagName !== 'TEXTAREA') {
                      event.preventDefault()
                      void savePersonalAntecedent()
                    }
                  }
                }}
              >
                <p className="mb-3 text-sm font-semibold text-slate-700">Nuevo antecedente</p>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  <label className="space-y-1 md:col-span-8">
                    <span className="text-xs font-medium text-slate-600">Buscar o crear antecedente</span>
                    <div className="relative">
                      <input
                        autoFocus
                        type="text"
                        value={personalForm.cie10Query}
                        onFocus={() => setIsPersonalComboboxFocused(true)}
                        onBlur={() => {
                          window.setTimeout(() => {
                            setIsPersonalComboboxFocused(false)
                          }, 120)
                        }}
                        onChange={(event) => {
                          const value = event.target.value
                          setPersonalForm((previous) => ({
                            ...previous,
                            cie10Query: value,
                            description: value,
                            cie10Code: '',
                            cie10Label: ''
                          }))
                        }}
                        placeholder="Ej: Apendicitis, Hipertension, Sindrome de XYZ"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      />
                      {isPersonalComboboxFocused && (
                        <div className="absolute left-0 z-20 mt-1 max-h-52 w-full max-w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                          {personalCreatableSuggestions.map((option) => (
                            <button
                              key={option.code}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                setPersonalForm((previous) => ({
                                  ...previous,
                                  description: option.label,
                                  cie10Code: option.code,
                                  cie10Label: option.label,
                                  cie10Query: `${option.code} - ${option.label}`
                                }))
                                setIsPersonalComboboxFocused(false)
                              }}
                              className="w-full rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <span className="font-semibold">{option.label}</span>
                              <span className="text-slate-500"> [{option.code}]</span>
                            </button>
                          ))}

                          {personalForm.cie10Query.trim() && !personalCreatableSuggestions.some((option) => normalizeText(option.label) === normalizeText(personalForm.cie10Query.trim())) && (
                            <button
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                const custom = personalForm.cie10Query.trim()
                                setPersonalForm((previous) => ({
                                  ...previous,
                                  description: custom,
                                  cie10Code: '',
                                  cie10Label: '',
                                  cie10Query: custom
                                }))
                                setIsPersonalComboboxFocused(false)
                              }}
                              className="w-full rounded-md border-t border-slate-100 px-2 py-2 text-left text-sm text-[#1f5563] hover:bg-[#1f5563]/5"
                            >
                              Crear antecedente: "{personalForm.cie10Query.trim()}"
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </label>

                  <fieldset className="space-y-1 md:col-span-4">
                    <legend className="text-xs font-medium text-slate-600">Estado</legend>
                    <select
                      value={personalForm.status}
                      onChange={(event) => {
                        setPersonalForm((previous) => ({
                          ...previous,
                          status: event.target.value as PersonalAntecedentStatus
                        }))
                      }}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="RESUELTO">Resuelto</option>
                    </select>
                  </fieldset>
                </div>

                {personalError && (
                  <p className="mt-2 text-sm text-rose-700">{personalError}</p>
                )}

                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowPersonalInlineForm(false)
                      setPersonalError('')
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    className="bg-[#1f5563] hover:bg-[#154451]"
                    onClick={() => {
                      void savePersonalAntecedent()
                    }}
                    disabled={isSavingPersonal}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#1f5563]/15 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1f5563]">Antecedentes familiares</h3>
            <p className="text-xs text-slate-500">RF-15: padre, madre, hermano/a o abuelo/a y condicion asociada.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={openFamilyFormForCreate}
            disabled={!canEditRecord}
            title={!canEditRecord ? 'Accion deshabilitada para este rol.' : undefined}
          >
            + Anadir antecedente
          </Button>
        </div>

        <div className="mt-3 space-y-2">
          {isLoadingAntecedents ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Cargando antecedentes familiares...
            </p>
          ) : familyAntecedents.length === 0 && !showFamilyInlineForm && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Sin antecedentes familiares.
            </p>
          )}

          {familyAntecedents.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800">
                  <span className="font-semibold">{item.relationship}:</span> {item.condition}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {item.cie10Code ? `[${item.cie10Code}] ${item.cie10Label}` : 'Sin CIE-10'}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 hover:bg-slate-50">
                  ⋮
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6} className="w-36">
                  <DropdownMenuItem onClick={() => openFamilyFormForEdit(item)}>Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteFamilyAntecedent(item.id)}>Eliminar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {showFamilyInlineForm && (
            <div
              className="rounded-lg border border-[#1f5563]/20 bg-[#1f5563]/5 p-3"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  const target = event.target as HTMLElement
                  if (target.tagName !== 'TEXTAREA') {
                    event.preventDefault()
                    void saveFamilyAntecedent()
                  }
                }
              }}
            >
              <p className="mb-3 text-sm font-semibold text-slate-700">
                {editingFamilyId ? 'Editar antecedente familiar' : 'Nuevo antecedente familiar'}
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <label className="space-y-1 md:col-span-3">
                  <span className="text-xs font-medium text-slate-600">Familiar</span>
                  <select
                    value={familyForm.relationship}
                    onChange={(event) => {
                      setFamilyForm((previous) => ({
                        ...previous,
                        relationship: event.target.value as FamilyRelationship
                      }))
                    }}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="Padre">Padre</option>
                    <option value="Madre">Madre</option>
                    <option value="Hermano/a">Hermano/a</option>
                    <option value="Abuelo/a">Abuelo/a</option>
                  </select>
                </label>

                <label className="space-y-1 md:col-span-5">
                  <span className="text-xs font-medium text-slate-600">Condicion</span>
                  <input
                    autoFocus
                    type="text"
                    value={familyForm.condition}
                    onChange={(event) => setFamilyForm((previous) => ({ ...previous, condition: event.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  />
                </label>

                <label className="space-y-1 md:col-span-4">
                  <span className="text-xs font-medium text-slate-600">Codigo CIE-10</span>
                  <Cie10SearchInput
                    inputId="family-cie10"
                    value={familyForm.cie10Query}
                    selectedCode={familyForm.cie10Code}
                    selectedLabel={familyForm.cie10Label}
                    onValueChange={(value) => {
                      setFamilyForm((previous) => ({
                        ...previous,
                        cie10Query: value,
                        cie10Code: '',
                        cie10Label: ''
                      }))
                    }}
                    onSelect={(option) => {
                      setFamilyForm((previous) => ({
                        ...previous,
                        cie10Code: option.code,
                        cie10Label: option.label,
                        cie10Query: `${option.code} - ${option.label}`
                      }))
                    }}
                    placeholder="Busca por codigo o condicion"
                  />
                </label>
              </div>

              {familyError && (
                <p className="mt-2 text-sm text-rose-700">{familyError}</p>
              )}

              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowFamilyInlineForm(false)
                    setEditingFamilyId(null)
                    setFamilyError('')
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-[#1f5563] hover:bg-[#154451]"
                  onClick={() => {
                    void saveFamilyAntecedent()
                  }}
                  disabled={isSavingFamily}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
