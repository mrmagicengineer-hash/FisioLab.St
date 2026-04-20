import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export function DatosTarjeteroTab({ draftData, isEditing, onFieldChange }: any) {
  
  const renderValue = (value: any) => {
    if (isEditing) return value ?? ''
    return (value && value !== "") ? value : '--'
  }

  // --- UI/UX: Estilo Square & Tipografía Estricta ---
  const boxWrapper = "overflow-hidden rounded-none border border-slate-300 bg-white" 
  
  // Layout para las filas (Patrón Z guiado horizontalmente)
  const rowGrid2 = "grid grid-cols-1 lg:grid-cols-2 border-b border-slate-300 last:border-b-0"
  const rowGrid3 = "grid grid-cols-1 lg:grid-cols-3 border-b border-slate-300 last:border-b-0"
  const cellGrid = "grid grid-cols-[160px_1fr] border-b lg:border-b-0 lg:border-r border-slate-300 last:border-b-0 lg:last:border-r-0"
  const cellGridWide = "grid grid-cols-[160px_1fr] lg:col-span-2 border-b lg:border-b-0 lg:border-r border-slate-300 last:border-b-0 lg:last:border-r-0"
  const cellGridFull = "grid grid-cols-[160px_1fr] border-b border-slate-300 last:border-b-0"

  // Tipografía & Diseño de Celdas
  const labelCell = "flex items-center bg-slate-50 px-4 py-3 border-r border-slate-300"
  const labelText = "text-xs font-semibold text-slate-500 uppercase tracking-wider" 
  
  const valueCell = "flex items-center px-4 py-3 bg-white"
  const valueText = "text-sm font-medium text-slate-900" 
  
  const inputStyle = "text-sm font-medium text-slate-900 h-auto w-full border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:border-transparent shadow-none disabled:bg-transparent disabled:opacity-100 disabled:text-slate-900 placeholder:font-normal placeholder:text-slate-400 rounded-none"
  const selectTriggerClass = "text-sm font-medium text-slate-900 h-auto w-full border-none bg-transparent p-0 focus:ring-0 focus:border-transparent shadow-none rounded-none"
  
  const sectionTitle = "text-lg font-bold text-slate-900 mb-1" 
  const sectionSubheadline = "text-sm font-medium text-slate-500 mb-5" 

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      
      {/* 1. FILIACIÓN Y CONTACTO */}
      <section>
        <h3 className={sectionTitle}>Filiación y Contacto</h3>
        <p className={sectionSubheadline}>Información personal y detalles de localización</p>
        
        <div className={boxWrapper}>
          
          <div className={rowGrid2}>
            <div className={cellGrid}>
              <div className={labelCell}><Label className={labelText}>Ocupación</Label></div>
              <div className={valueCell}>
                <Input placeholder="Ej. Estudiante" value={renderValue(draftData.ocupacion)} disabled={!isEditing} className={inputStyle} onChange={(e) => onFieldChange('ocupacion', e.target.value)} />
              </div>
            </div>
            <div className={cellGrid}>
              <div className={labelCell}><Label className={labelText}>Estado Civil</Label></div>
              <div className={valueCell}>
                {isEditing ? (
                  <Select value={draftData.estadoCivil} onValueChange={(v) => onFieldChange('estadoCivil', v)}>
                    <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                    <SelectContent className="rounded-none border-slate-300">
                      {['Soltero', 'Casado', 'Divorciado', 'Viudo', 'Unión Libre'].map(c => <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : <span className={valueText}>{renderValue(draftData.estadoCivil)}</span>}
              </div>
            </div>
          </div>

          <div className={rowGrid3}>
            <div className={cellGrid}>
              <div className={labelCell}><Label className={labelText}>G. Cultural</Label></div>
              <div className={valueCell}>
                {isEditing ? (
                  <Select value={draftData.grupoCultural} onValueChange={(v) => onFieldChange('grupoCultural', v)}>
                    <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                    <SelectContent className="rounded-none border-slate-300">
                      {['Mestizo', 'Indígena', 'Afroecuatoriano', 'Blanco', 'Montubio', 'Otro'].map(g => <SelectItem key={g} value={g} className="text-sm">{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : <span className={valueText}>{renderValue(draftData.grupoCultural)}</span>}
              </div>
            </div>
            <div className={cellGridWide}>
              <div className={labelCell}><Label className={labelText}>Dirección</Label></div>
              <div className={valueCell}>
                <Input value={renderValue(draftData.direccion)} disabled={!isEditing} className={inputStyle} onChange={(e) => onFieldChange('direccion', e.target.value)} />
              </div>
            </div>
          </div>

          <div className={rowGrid2}>
            <div className={cellGrid}>
              <div className={labelCell}><Label className={labelText}>Tel. Principal</Label></div>
              <div className={valueCell}>
                <Input value={renderValue(draftData.telefonoPrincipal)} disabled={!isEditing} className={inputStyle} onChange={(e) => onFieldChange('telefonoPrincipal', e.target.value)} />
              </div>
            </div>
            <div className={cellGrid}>
              <div className={labelCell}><Label className={labelText}>Tel. Secundario</Label></div>
              <div className={valueCell}>
                <Input value={renderValue(draftData.telefonoSecundario)} disabled={!isEditing} className={inputStyle} onChange={(e) => onFieldChange('telefonoSecundario', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SALUD BASE Y BIOMETRÍA */}
      <section>
        <h3 className={sectionTitle}>Salud Base</h3>
        <p className={sectionSubheadline}>Indicadores iniciales y afiliaciones médicas</p>
        
        <div className={boxWrapper}>
          <div className={rowGrid2}>
            <div className={cellGrid}>
              <div className={labelCell}><Label className={labelText}>Sangre</Label></div>
              <div className={valueCell}>
                 {isEditing ? (
                  <Select value={draftData.tipoSangre} onValueChange={(v) => onFieldChange('tipoSangre', v)}>
                    <SelectTrigger className={`${selectTriggerClass} text-rose-600 font-bold`}><SelectValue placeholder="Ej. O+" /></SelectTrigger>
                    <SelectContent className="rounded-none border-slate-300">
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(s => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : <span className="text-sm font-bold text-rose-600">{renderValue(draftData.tipoSangre)}</span>}
              </div>
            </div>
            <div className={cellGrid}>
              <div className={labelCell}><Label className={labelText}>Seguro</Label></div>
              <div className={valueCell}>
                <Input value={renderValue(draftData.regimenSeguridadSocial)} disabled={!isEditing} className={inputStyle} onChange={(e) => onFieldChange('regimenSeguridadSocial', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 bg-slate-50/50 border-t border-slate-300">
            {/* Espacio reservado para Biometría (Peso, Talla, IMC) */}
            <div className="p-5 text-center text-sm text-slate-400 italic">
              -- Módulo de Biometría pendiente de integración --
            </div>
          </div>
        </div>
      </section>

      {/* 3. FICHA FAMILIAR Y VIVIENDA */}
      <section>
        <h3 className={sectionTitle}>Entorno y Familia</h3>
        <p className={sectionSubheadline}>Datos de vivienda y núcleo familiar</p>
        
        <div className={boxWrapper}>
          <div className={rowGrid3}>
            <div className={cellGrid}>
              <div className={labelCell}><Label className={labelText}>Jefe de Hogar</Label></div>
              <div className={valueCell}>
                <Input value={renderValue(draftData.jefeHogar)} disabled={!isEditing} className={inputStyle} onChange={(e) => onFieldChange('jefeHogar', e.target.value)} />
              </div>
            </div>
            <div className={cellGrid}>
              <div className={labelCell}><Label className={labelText}>Miembros</Label></div>
              <div className={valueCell}>
                <Input type="number" value={draftData.numeroMiembros ?? ''} disabled={!isEditing} className={inputStyle} onChange={(e) => onFieldChange('numeroMiembros', Number(e.target.value))} />
              </div>
            </div>
            <div className={cellGrid}>
              <div className={labelCell}><Label className={labelText}>Tipo Vivienda</Label></div>
              <div className={valueCell}>
                {isEditing ? (
                  <Select value={draftData.tipoVivienda} onValueChange={(v) => onFieldChange('tipoVivienda', v)}>
                    <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                    <SelectContent className="rounded-none border-slate-300">
                      {['Propia', 'Arrendada', 'Compartida', 'Prestada'].map(v => <SelectItem key={v} value={v} className="text-sm">{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : <span className={valueText}>{renderValue(draftData.tipoVivienda)}</span>}
              </div>
            </div>
          </div>

          <div className={cellGridFull}>
            <div className={`${labelCell} items-start pt-4`}><Label className={labelText}>Sanidad</Label></div>
            <div className={valueCell}>
              <Textarea 
                value={renderValue(draftData.condicionesSanitarias)} 
                disabled={!isEditing} 
                className="text-sm font-medium text-slate-900 bg-transparent border-none min-h-[80px] w-full resize-none focus-visible:ring-0 p-0 py-1 disabled:bg-transparent disabled:opacity-100 placeholder:font-normal placeholder:text-slate-400 rounded-none shadow-none"
                onChange={(e) => onFieldChange('condicionesSanitarias', e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}