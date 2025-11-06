import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  BarChart3, 
  TrendingUp, 
  Info,
  Loader2,
  Download,
  Save,
  CheckCircle
} from 'lucide-react';
import {
  calculateAllIndices,
  loadAudioFromURL,
  interpretIndices,
  type AcousticIndicesResult
} from '@/lib/acousticIndices';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AcousticIndicesDisplayProps {
  audioUrl: string;
  recordingId?: string;
  onComplete?: (result: AcousticIndicesResult) => void;
}

export default function AcousticIndicesDisplay({
  audioUrl,
  recordingId,
  onComplete
}: AcousticIndicesDisplayProps) {
  const { user } = useAuth();
  const [result, setResult] = useState<AcousticIndicesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Cargar audio
      const audioBuffer = await loadAudioFromURL(audioUrl);

      // Calcular índices
      const indices = calculateAllIndices(audioBuffer, {
        fftSize: 2048,
        numBands: 10,
        minFreq: 2000,
        maxFreq: 8000
      });

      setResult(indices);

      // Callback opcional
      if (onComplete) {
        onComplete(indices);
      }
    } catch (err) {
      console.error('Error calculando índices acústicos:', err);
      setError('Error al calcular índices acústicos. Verifica que el archivo de audio sea válido.');
    } finally {
      setLoading(false);
    }
  };

  const saveToDatabase = async () => {
    if (!result || !recordingId) return;

    setSaving(true);
    setError(null);

    try {
      const interpretation = interpretIndices(result);

      const { error: dbError } = await supabase
        .from('acoustic_indices')
        .insert({
          grabacion_id: recordingId,
          aci: result.aci,
          adi: result.adi,
          bi: result.bi,
          interpretacion: {
            aci: interpretation.aci,
            adi: interpretation.adi,
            bi: interpretation.bi,
            summary: interpretation.summary
          },
          parametros_calculo: {
            fftSize: 2048,
            numBands: 10,
            minFreq: 2000,
            maxFreq: 8000
          },
          duracion_segundos: result.metadata.duration,
          sample_rate: result.metadata.sampleRate,
          usuario_id: user?.id
        });

      if (dbError) throw dbError;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error guardando índices en base de datos:', err);
      setError('Error al guardar en base de datos');
    } finally {
      setSaving(false);
    }
  };

  const exportResults = () => {
    if (!result) return;

    const interpretation = interpretIndices(result);
    
    const exportData = {
      recordingId,
      indices: {
        aci: result.aci,
        aci_normalized: result.aciNormalized,
        adi: result.adi,
        adi_normalized: result.adiNormalized,
        bi: result.bi,
        bi_normalized: result.biNormalized
      },
      interpretation: {
        aci: interpretation.aci,
        adi: interpretation.adi,
        bi: interpretation.bi,
        summary: interpretation.summary
      },
      metadata: result.metadata
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acoustic_indices_${recordingId || 'recording'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!result && !loading && !error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Índices Acústicos
          </CardTitle>
          <CardDescription>
            Calcula ACI, ADI y BI para análisis de paisajes sonoros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Los índices acústicos miden la complejidad, diversidad y actividad biológica
              del paisaje sonoro. Son fundamentales para análisis ecológicos.
            </p>
            <Button onClick={handleCalculate} size="lg">
              <Activity className="w-4 h-4 mr-2" />
              Calcular Índices
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Calculando índices acústicos...
            </p>
            <p className="text-xs text-muted-foreground">
              Esto puede tomar algunos segundos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={handleCalculate} 
            variant="outline" 
            className="mt-4 w-full"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const interpretation = interpretIndices(result);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Índices Acústicos
            </CardTitle>
            <CardDescription>
              Análisis de paisaje sonoro completado
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {recordingId && (
              <Button 
                variant={saved ? "default" : "outline"} 
                size="sm" 
                onClick={saveToDatabase}
                disabled={saving || saved}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : saved ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saved ? 'Guardado' : 'Guardar'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportResults}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={handleCalculate}>
              Recalcular
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="details">Detalles</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Resumen */}
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription className="ml-2">
                {interpretation.summary}
              </AlertDescription>
            </Alert>

            {/* ACI - Acoustic Complexity Index */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold">ACI - Complejidad Acústica</span>
                </div>
                <Badge variant={result.aciNormalized > 0.5 ? "default" : "secondary"}>
                  {result.aci.toFixed(2)}
                </Badge>
              </div>
              <Progress value={result.aciNormalized * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">{interpretation.aci}</p>
            </div>

            {/* ADI - Acoustic Diversity Index */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="font-semibold">ADI - Diversidad Acústica</span>
                </div>
                <Badge variant={result.adiNormalized > 0.5 ? "default" : "secondary"}>
                  {result.adi.toFixed(3)}
                </Badge>
              </div>
              <Progress value={result.adiNormalized * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">{interpretation.adi}</p>
            </div>

            {/* BI - Bioacoustic Index */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span className="font-semibold">BI - Actividad Biológica</span>
                </div>
                <Badge variant={result.biNormalized > 0.5 ? "default" : "secondary"}>
                  {result.bi.toFixed(2)}
                </Badge>
              </div>
              <Progress value={result.biNormalized * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">{interpretation.bi}</p>
            </div>

            {/* Score promedio */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Puntuación General</span>
                <Badge variant="outline" className="text-lg">
                  {((result.aciNormalized + result.adiNormalized + result.biNormalized) / 3 * 100).toFixed(0)}%
                </Badge>
              </div>
              <Progress 
                value={(result.aciNormalized + result.adiNormalized + result.biNormalized) / 3 * 100} 
                className="h-3"
              />
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {/* Valores exactos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">ACI (sin normalizar)</p>
                <p className="text-2xl font-bold text-blue-500">{result.aci.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">ACI (normalizado)</p>
                <p className="text-2xl font-bold">{result.aciNormalized.toFixed(3)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">ADI</p>
                <p className="text-2xl font-bold text-green-500">{result.adi.toFixed(3)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">ADI (normalizado)</p>
                <p className="text-2xl font-bold">{result.adiNormalized.toFixed(3)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">BI (sin normalizar)</p>
                <p className="text-2xl font-bold text-purple-500">{result.bi.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">BI (normalizado)</p>
                <p className="text-2xl font-bold">{result.biNormalized.toFixed(3)}</p>
              </div>
            </div>

            {/* Metadatos */}
            <div className="pt-4 border-t space-y-2">
              <h4 className="font-semibold mb-3">Metadatos del Análisis</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Duración:</span>
                  <span className="ml-2 font-medium">{result.metadata.duration.toFixed(2)}s</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sample Rate:</span>
                  <span className="ml-2 font-medium">{result.metadata.sampleRate} Hz</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Bandas de frecuencia:</span>
                  <span className="ml-2 font-medium">{result.metadata.frequencyBands}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Rango BI:</span>
                  <span className="ml-2 font-medium">
                    {result.metadata.minFrequency / 1000}-{result.metadata.maxFrequency / 1000} kHz
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Calculado:</span>
                  <span className="ml-2 font-medium">
                    {new Date(result.metadata.calculatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription className="ml-2">
                <p className="font-semibold mb-1">Referencias científicas:</p>
                <ul className="text-xs space-y-1">
                  <li>• ACI: Pieretti et al. (2011) - A new methodology to infer the singing activity of an avian community</li>
                  <li>• ADI: Villanueva-Rivera et al. (2011) - A primer of acoustic analysis for landscape ecologists</li>
                  <li>• BI: Boelman et al. (2007) - Multi-trophic invasion resistance in Hawaii</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
