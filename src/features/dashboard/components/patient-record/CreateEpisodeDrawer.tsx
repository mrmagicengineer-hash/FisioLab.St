import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { clinicalEpisodeService } from '../../data/services/clinicalEpisodeService';
import { AddProblemForm } from './AddProblemForm';

type Step = 'episode' | 'problem' | 'done';

export function CreateEpisodeDrawer({
    open,
    onOpenChange,
    numeroHcl,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    numeroHcl: string;
    onSuccess?: () => void;
}) {
    const [step, setStep] = useState<Step>('episode');
    const [loading, setLoading] = useState(false);
    const [motivoConsulta, setMotivoConsulta] = useState('');
    const [createdEpisodioId, setCreatedEpisodioId] = useState<number | null>(null);

    useEffect(() => {
        if (!open) {
            setStep('episode');
            setLoading(false);
            setMotivoConsulta('');
            setCreatedEpisodioId(null);
        }
    }, [open]);

    const handleCreateEpisode = async () => {
        if (!motivoConsulta.trim()) return;
        setLoading(true);
        try {
            const res = await clinicalEpisodeService.createEpisode({
                numeroHcl,
                motivoConsulta: motivoConsulta.trim(),
            });
            const episodioId = res?.id ?? res?.episodioId ?? res?.data?.id;
            if (!episodioId) throw new Error('No se recibió el ID del episodio.');
            setCreatedEpisodioId(episodioId);
            toast.success('Episodio creado', {
                description: `Ahora registra el problema clínico.`,
            });
            setStep('problem');
        } catch (error) {
            toast.error('Error al crear episodio', {
                description: error instanceof Error ? error.message : 'Intente nuevamente.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleProblemSuccess = () => {
        setStep('done');
        onSuccess?.();
        setTimeout(() => onOpenChange(false), 1200);
    };

    const handleSkipProblem = () => {
        onSuccess?.();
        onOpenChange(false);
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent size="md">
                <DrawerHeader className="border-b border-slate-100 bg-white shadow-sm">
                    <div className="flex flex-col gap-1">
                        <DrawerTitle className="text-xl font-bold text-slate-800">
                            Nueva Consulta
                        </DrawerTitle>
                        <span className="text-xs text-slate-500 font-medium uppercase">
                            HCL: {numeroHcl}
                        </span>
                    </div>

                    {/* Stepper */}
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
                        <StepDot
                            n={1}
                            label="Consulta"
                            active={step === 'episode'}
                            done={step === 'problem' || step === 'done'}
                        />
                        <ChevronRight className="h-3 w-3 text-slate-300" />
                        <StepDot
                            n={2}
                            label="Diagnóstico"
                            active={step === 'problem'}
                            done={step === 'done'}
                        />
                    </div>
                </DrawerHeader>

                <DrawerBody className="py-6 px-6 overflow-y-auto space-y-6">
                    {/* ── Paso 1: Motivo de consulta ─────────────────────── */}
                    {step === 'episode' && (
                        <div>
                            <label className="flex items-center text-xs font-bold text-slate-500 uppercase mb-2">
                                Motivo de la Consulta
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <textarea
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#1A5276] focus:ring-2 focus:ring-[#1A5276]/20 resize-none min-h-30 transition"
                                placeholder="Ej: Dolor lumbar agudo con irradiación al miembro inferior derecho..."
                                value={motivoConsulta}
                                onChange={(e) => setMotivoConsulta(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}

                    {/* ── Paso 2: Registro de problema ──────────────────── */}
                    {step === 'problem' && createdEpisodioId !== null && (
                        <div className="space-y-3">
                            
                            <AddProblemForm
                                episodioId={createdEpisodioId}
                                onSuccess={handleProblemSuccess}
                                onCancel={handleSkipProblem}
                            />
                        </div>
                    )}

                    {/* ── Paso done ─────────────────────────────────────── */}
                    {step === 'done' && (
                        <div className="flex flex-col items-center justify-center gap-3 py-12">
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                            <p className="text-sm font-semibold text-slate-700">Consulta registrada correctamente</p>
                        </div>
                    )}
                </DrawerBody>

                {/* Footer solo en paso 1 */}
                {step === 'episode' && (
                    <DrawerFooter className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                        <div className="flex justify-between w-full">
                            <Button
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className={`min-w-40 text-white font-bold transition ${
                                    motivoConsulta.trim()
                                        ? 'bg-[#1A5276] hover:bg-[#154360]'
                                        : 'bg-slate-300 cursor-not-allowed'
                                }`}
                                onClick={handleCreateEpisode}
                                disabled={loading || !motivoConsulta.trim()}
                            >
                                {loading
                                    ? <><Loader2 className="animate-spin mr-2" size={16} />Creando...</>
                                    : <>Siguiente · Problema <ChevronRight size={15} /></>
                                }
                            </Button>
                        </div>
                    </DrawerFooter>
                )}
            </DrawerContent>
        </Drawer>
    );
}

function StepDot({
    n, label, active, done,
}: { n: number; label: string; active: boolean; done: boolean }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition ${
                done
                    ? 'bg-emerald-500 text-white'
                    : active
                        ? 'bg-[#1A5276] text-white'
                        : 'bg-slate-200 text-slate-500'
            }`}>
                {done ? '✓' : n}
            </div>
            <span className={`transition ${active ? 'text-slate-800' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                {label}
            </span>
        </div>
    );
}
