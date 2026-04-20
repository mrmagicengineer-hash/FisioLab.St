import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Home, Users, Droplets } from "lucide-react";
import type { PatientData } from './types'

type FichaFamiliarTabProps = {
    draftData: PatientData
    isEditing: boolean
    onFieldChange: (field: keyof PatientData, value: string | null) => void
}

export function FichaFamiliarTab({ draftData, isEditing, onFieldChange }: FichaFamiliarTabProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Tarjeta de información General del Hogar */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-slate-800">Composición Familiar</CardTitle>
                            <CardDescription>Datos principales del núcleo familiar del paciente.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="space-y-2">
                        <Label htmlFor="jefeHogar" className="text-slate-600 font-medium">Jefe de Hogar</Label>
                        <Input
                            id="jefeHogar"
                            placeholder="Ej. María Pérez"
                            value={draftData.jefeHogar}
                            onChange={(e) => onFieldChange('jefeHogar', e.target.value)}
                            disabled={!isEditing}
                            className="bg-white focus-visible:ring-[#1A5276]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="numeroMiembros" className="text-slate-600 font-medium">Número de Miembros</Label>
                        <Input
                            id="numeroMiembros"
                            type="number"
                            min="1"
                            placeholder="Ej. 4"
                            value={draftData.numeroMiembros}
                            onChange={(e) => onFieldChange('numeroMiembros', e.target.value)}
                            disabled={!isEditing}
                            className="bg-white focus-visible:ring-[#1A5276]"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Tarjeta de Condiciones de la Vivienda */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                            <Home className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-slate-800">Condiciones de Vivienda</CardTitle>
                            <CardDescription>Información sobre el entorno físico y sanitario.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 gap-6">

                    <div className="space-y-2 md:w-1/2">
                        <Label htmlFor="tipoVivienda" className="text-slate-600 font-medium">
                            Tipo de Vivienda
                        </Label>
                        <Select
                            disabled={!isEditing}
                            value={draftData.tipoVivienda ?? ""}        // ← Corrección aquí
                            onValueChange={(value) => onFieldChange('tipoVivienda', value)}
                        >
                            <SelectTrigger className="bg-white focus:ring-[#1A5276]">
                                <SelectValue placeholder="Seleccione el tipo de vivienda" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Casa propia">Casa propia</SelectItem>
                                <SelectItem value="Casa alquilada">Casa alquilada</SelectItem>
                                <SelectItem value="Departamento">Departamento</SelectItem>
                                <SelectItem value="Cuarto">Cuarto / Habitación</SelectItem>
                                <SelectItem value="Choza/Refugio">Choza / Refugio</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Droplets className="w-4 h-4 text-slate-400" />
                            <Label htmlFor="condicionesSanitarias" className="text-slate-600 font-medium">Condiciones Sanitarias y Entorno</Label>
                        </div>
                        <Textarea
                            id="condicionesSanitarias"
                            placeholder="Describa el acceso a servicios básicos (agua potable, luz, alcantarillado), manejo de desechos y riesgos ambientales cercanos..."
                            value={draftData.condicionesSanitarias}
                            onChange={(e) => onFieldChange('condicionesSanitarias', e.target.value)}
                            disabled={!isEditing}
                            className="min-h-[120px] bg-white resize-y focus-visible:ring-[#1A5276]"
                        />
                        <p className="text-xs text-slate-400">
                            Detalle brevemente si cuenta con agua potable, alcantarillado y electricidad.
                        </p>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}