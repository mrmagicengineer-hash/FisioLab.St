import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { clinicalEpisodeService } from '../../data/services/clinicalEpisodeService';
import { getEvaluaciones, type EvaluacionDto, type TreatmentPlanDto } from '../../data/services/clinicalHistoryService';
import { ClipboardPlus, ChevronRight, ChevronDown } from 'lucide-react';
import { CreateEvaluacionClinicaDrawer } from './CreateEvaluacionClinicaDrawer';
import { EvaluationProgressChart } from './EvaluationProgressChart';
import { ProblemasYPlanView } from './ProblemasYPlanView';

export function EpisodeItem({ ep }: { ep: any }) {
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionDto[]>([]);
  const [showDetail, setShowDetail] = useState(false);

  const [evalDrawerOpen, setEvalDrawerOpen] = useState(false);

  const reload = async () => {
    const [data, evals] = await Promise.all([
      clinicalEpisodeService.getFullEpisodeContent(ep.id),
      getEvaluaciones(ep.id).catch(() => [] as EvaluacionDto[]),
    ]);
    setFullData(data);
    setEvaluaciones(evals);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await reload();
      } catch (error) {
        console.error('Error cargando episodio:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep.id]);

  if (isLoading) return <div className="p-4 border animate-pulse bg-slate-50 rounded-lg h-24" />;

  const hasEvaluaciones = evaluaciones.length > 0;
  const problemas: any[] = fullData?.problemas ?? [];
  const planesTratamiento: TreatmentPlanDto[] = (fullData?.planesTratamiento ?? []) as TreatmentPlanDto[];

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm hover:border-slate-300 transition-all overflow-hidden">
      {/* ── Cabecera del episodio ────────────────────────────────────────────── */}
      <div className="p-5">
        <div className="flex flex-col md:flex-row justify-between gap-4">

          {/* Información básica */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                {fullData.numeroEpisodio}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                fullData.estado === 'ABIERTO'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {fullData.estado}
              </span>
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">{fullData.motivoConsulta}</h4>
            <p className="text-xs text-slate-400">
              Apertura: {new Date(fullData.fechaApertura).toLocaleDateString('es-EC')}
            </p>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">

            {/* Evaluación / Reevaluación */}
            <Button
              size="sm"
              variant="outline"
              className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 gap-1.5"
              onClick={() => setEvalDrawerOpen(true)}
            >
              <ClipboardPlus className="w-4 h-4" />
              {hasEvaluaciones ? 'Reevaluar' : 'Evaluación'}
            </Button>

            {/* Ver Detalle — toggle problemas y plan */}
            <Button
              size="sm"
              variant={showDetail ? 'outline' : 'default'}
              className={`gap-1.5 transition ${
                showDetail
                  ? 'border-slate-300 text-slate-700'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
              onClick={() => setShowDetail(v => !v)}
            >
              {showDetail ? (
                <><ChevronDown className="w-4 h-4" />Ocultar</>
              ) : (
                <>Ver Detalle<ChevronRight className="w-4 h-4" /></>
              )}
            </Button>
          </div>
        </div>

        {/* Mini resumen de chips */}
        {(problemas.length > 0 || hasEvaluaciones) && (
          <div className="mt-3 pt-3 border-t border-slate-50 flex gap-3 flex-wrap">
            {problemas.length > 0 && (
              <span className="text-[10px] text-slate-400">
                {problemas.length} problema(s) · {problemas.filter((p: any) => p.estado === 'ACTIVO' || p.estado === 'CRONICO').length} activo(s)
              </span>
            )}
            {planesTratamiento.length > 0 && (
              <span className="text-[10px] text-slate-400">
                {planesTratamiento.length} plan(es)
              </span>
            )}
            {evaluaciones.length > 0 && (
              <span className="text-[10px] text-slate-400">
                {evaluaciones.length} evaluación(es)
              </span>
            )}
          </div>
        )}

        {/* Gráfico de progreso (RF-28) */}
        <EvaluationProgressChart evaluaciones={evaluaciones} />
      </div>

      {/* ── Vista de Problemas y Plan (expandible) ──────────────────────────── */}
      {showDetail && (
        <ProblemasYPlanView
          episodioId={ep.id}
          numeroEpisodio={fullData?.numeroEpisodio ?? ''}
          problemas={problemas}
          planesTratamiento={planesTratamiento}
          onReload={reload}
        />
      )}

      {/* ── Drawer de evaluación física ─────────────────────────────────────── */}
      <CreateEvaluacionClinicaDrawer
        open={evalDrawerOpen}
        onOpenChange={setEvalDrawerOpen}
        episodioId={ep.id}
        numeroEpisodio={fullData?.numeroEpisodio ?? ''}
        motivoConsulta={fullData?.motivoConsulta ?? ''}
        onSuccess={reload}
      />
    </div>
  );
}
