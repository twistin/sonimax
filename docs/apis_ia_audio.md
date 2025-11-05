# APIs de IA para análisis de audio y soundscapes (2025): comparación técnica, capacidades y precios

## Resumen ejecutivo

El ecosistema de APIs para audio en 2025 ofrece dos grandes familias de capacidades: (i) reconocimiento de voz (speech-to-text, STT) con funciones de enriquecimiento (diarización, detección de idioma, redacción de información personal identificable, análisis conversacional y resúmenes), y (ii) análisis de soundscapes para clasificación y detección de eventos en entornos naturales y antropofónicos. En el primer grupo, los hyperscalers (AWS, Google, Microsoft, IBM) y proveedores especializados (OpenAI, Deepgram, AssemblyAI, Speechmatics) proporcionan transcripción multilingüe, streaming en tiempo real y complementos de inteligencia de audio. En el segundo, la oferta de APIs comerciales maduras es aún limitada; las soluciones viables combinan plataformas especializadas (p. ej., BirdNET para aves) con pipelines personalizados basados en embeddings y modelos de clasificación entrenados sobre datasets públicos (FSC22, DCASE-like), y protocolos no supervisados para descubrimiento de tipos de sonido desconocidos.

Conclusiones clave por caso de uso:
- Transcripción y analítica conversacional: OpenAI Whisper destaca por su relación costo-rendimiento (0,006 USD/min), con opciones de diarización en modelos gpt-4o; AWS Transcribe y Google STT ofrecen escalabilidad, funciones de analítica (AWS) y modelos optimizados (Google), con precios efectivos entre ~0,016 USD/min (Google V2 estándar) y 0,024 USD/min (AWS T1) en volumes iniciales[^1][^3][^11].
- Tiempo real y agentes de voz: Deepgram aporta latencia baja y una API de Agente de Voz unificada, con precios por minuto muy competitivos y add-ons granulares (p. ej., diarización)[^7]. AssemblyAI y Speechmatics proveen streaming robusto y capacidades complementarias (p. ej., sentiment, temas, PII), con políticas de concurrencia claras[^6][^9].
- Soundscapes y bioacústica: No existe, a fecha de este análisis, una API comercial general que resuelva de extremo a extremo la clasificación multiclase natural/antropofónico/biológico y la detección de eventos con soporte y pricing formales. BirdNET ofrece identificación de aves a escala (gratuito, con código para análisis local), útil como especializado de биоacústica; el resto de taxonomías y la detección genérica se implementan con pipelines personalizados sobre datasets como FSC22 y protocolos de clustering exploratorio[^10][^19].
- Cumplimiento y despliegue: Azure aporta una cobertura amplia de cumplimiento, despliegues en contenedores/edge y analítica de contenido post-llamada; IBM Watson ofrece opciones empresariales (IAM, HIPAA, UE). Speechmatics declara opciones Enterprise con on‑prem; Deepgram ofrece autoalojado empresarial; AssemblyAI menciona despliegues autoalojados y residencia de datos UE[^8][^14][^9][^7][^6].

Recomendaciones rápidas:
- Coste limitado y multilingüe: OpenAI Whisper (0,006 USD/min) para batch; Deepgram Nova/Flux para streaming económico; Google V2 estándar para cargas con potencial de escalado (0,016 → 0,004 USD/min en tramos altos)[^1][^7][^11].
- Máximo cumplimiento y edge: Azure AI Speech (contenedores y Content Understanding), IBM Watson (IAM, HIPAA, UE); Speechmatics Enterprise on‑prem; Deepgram/AssemblyAI con opciones autoalojadas/VPC[^8][^14][^9][^7][^6].
- Tiempo real extremo: Deepgram (Voice Agent, WSS) por latencia y add‑ons; AssemblyAI streaming con guardrails; Whisper para escenarios budget-friendly con optimización propia[^7][^6][^1].
- Bioacústica/soundscapes: BirdNET para aves; pipeline personalizado con modelos CNN/Transformers sobre FSC22 y protocolos no supervisados para sonidos desconocidos[^10][^19][^20].

Mapa rápido: OpenAI/Deepgram/AssemblyAI/Speechmatics para eficiencia y analítica integrada; AWS/Google/Azure/IBM para ecosistemas cloud, cumplimiento y operaciones a escala[^1][^7][^6][^9][^3][^11][^8][^14].

## Metodología y alcance

Se revisaron fuentes oficiales de producto y pricing de OpenAI, AWS, Google Cloud, Microsoft Azure, IBM, Deepgram, AssemblyAI y Speechmatics, complementadas con literatura científica y datasets relevantes para soundscapes y bioacústica. El análisis cubre: (i) STT/ASR y enriquecimiento (diarización, PII, sentiment, topics, resúmenes), (ii) funciones de “Audio Intelligence” aplicables a conversacional, (iii) capacidades relevantes para clasificación de sonidos y detección de eventos, (iv) precios y límites de uso, y (v) cumplimiento y modalidades de despliegue.

La evaluación de capacidades se basa en documentación pública y descripciones de modelos/funciones. No se incluyen benchmarks internos ni pruebas de latencia/precisión propias; las afirmaciones cuantitativas de rendimiento se circunscriben a lo publicado por los proveedores y a comparativas de precios y modelos. Se reconocen las siguientes brechas de información: (1) ausencia de precios detallados públicos para IBM Watson; (2) no disponibilidad de un “Audio Intelligence” formal en Google STT más allá de STT; (3) falta de APIs comerciales maduras para clasificación genérica de soundscapes; (4) detalles de pricing para BirdNET orientados a uso masivo de API; (5) ausencia de WER/latencia estandarizados comparables; (6) políticas de residencia de datos detalladas para todos los proveedores[^5][^11][^6][^10][^15].

## Taxonomía de necesidades y criterios de evaluación

Las necesidades se agrupan en tres capas:
- STT/ASR: transcripción de voz a texto, multilingüe, streaming y batch; enriquecimiento (diarización, detección de idioma, formato inteligente, PII, sentiment, topics, resúmenes).
- Audio Intelligence: extracción de señales conversacionales (p. ej., interrupciones, turnos), moderación/guardrails, resumen temático y análisis post-llamada.
- Soundscapes y SED: clasificación de sonido ambiental (natural, antropofónico, biológico), detección de eventos sonoros (Sound Event Detection, SED), auto‑tagging y estimación de calidad del soundscape.

Criterios de evaluación:
- Precisión y latencia (cualitativas, según documentación pública).
- Cobertura de idiomas y modelos especializados (video, teléfono, médico).
- Facilidad de integración: APIs REST/WebSocket, SDKs, streaming.
- Seguridad/compliance: IAM, HIPAA, residencia de datos, on‑prem/edge.
- Pricing y límites: coste por minuto/hora/token y add‑ons.
- Escalabilidad: concurrencia, multicanal, cuotas.
- Ajuste al caso de uso: conversacional, tiempo real, bioacústica/soundscapes.

## Panorama de proveedores y segmentación

El mercado se divide entre hyperscalers y especializados:
- Hyperscalers: AWS Transcribe (incluye analítica de llamadas y resúmenes generativos), Google Cloud Speech-to-Text (V2/V1, modelos estándar, médicos, lote dinámico), Microsoft Azure AI Speech (STT, TTS, traducción, Speaker Recognition, Content Understanding post‑llamada, contenedores/edge), IBM Watson STT (SaaS y opciones empresariales). Aportan integración cloud, compliance y escalabilidad[^2][^11][^8][^14][^13][^15].
- Especializados: OpenAI (Whisper y modelos gpt‑4o para transcripción/diarización, Realtime API), Deepgram (STT/TTS, Voice Agent, Audio Intelligence), AssemblyAI (STT + Speech Understanding, Guardrails, LeMUR), Speechmatics (STT/TTS multilingüe, Enterprise con on‑prem). Aportan rapidez de evolución, pricing competitivo y funciones de inteligencia específicas[^1][^25][^7][^6][^9].

Para entornos on‑prem/edge, Azure (contenedores), Speechmatics (Enterprise on‑prem), Deepgram (self‑hosted) e IBM (opciones empresariales) ofrecen rutas de despliegue alineadas con mayores exigencias de privacidad y latencia[^8][^9][^7][^14][^13].

## Fichas técnicas por proveedor (capacidades, pricing, limitaciones)

### OpenAI Whisper / gpt‑4o (Transcribe, Realtime)

OpenAI ofrece transcripción con Whisper (0,006 USD/min) y modelos gpt‑4o‑transcribe/diarize; además, un modelo “mini” a 0,003 USD/min. La Realtime API permite experiencias de voz bidireccionales, con precios por tokens de audio (100 USD/1M tokens de entrada y 200 USD/1M tokens de salida) y texto (5 USD/1M tokens de entrada; 20 USD/1M tokens de salida). Whisper es idóneo para batch multilingüe de bajo coste; la Realtime API habilita agentes de voz de baja latencia con audio‑in/audio‑out[^1][^25]. Limitaciones: no ofrece clasificación de sonidos ambientales ni SED nativa; para soundscapes se requieren pipelines personalizados.

### AWS Transcribe

AWS Transcribe proporciona STT batch/streaming y un conjunto amplio de funciones de analítica de llamadas, redacción de PII y resúmenes generativos. Pricing escalonado por minutos: T1 0,024 USD/min (primeros 250.000), T2 0,015 USD/min (siguientes 750.000), T3 0,0102 USD/min (siguientes 4M), T4 0,0078 USD/min (>5M). En conversaciones de dos canales, se factura por duración total, no por canal. Ofrece call analytics en tiempo real y post‑llamada, con capacidades como interrupciones, volumen y velocidad de habla; el modelo de lenguaje personalizado (CLM) se factura por separado[^3][^2][^4]. Limitaciones: sin clasificación de sonidos ambientales nativa; funciones de “Audio Intelligence” orientadas a voz/conversacional.

### Google Cloud Speech‑to‑Text

Google STT (V2) ofrece modelos estándar con precios por minuto y descuentos por volumen: 0,016 USD/min (0–500k min/mes), 0,010 USD/min (500k–1M), 0,008 USD/min (1–2M), 0,004 USD/min (>2M). El lote dinámico reduce el coste a ~0,003 USD/min para cargas no urgentes. La V1 mantiene modelos estándar/médicos con free‑tier y variantes con/sin registro de datos; los modelos “enhanced” se integran en la tarificación estándar desde las notas de lanzamiento. Facturación por segundo, con multicanal sumando la longitud de todos los canales[^11][^12][^15][^16][^17]. Limitaciones: no existe un “Audio Intelligence” general de soundscapes; la oferta se centra en STT y variantes por dominio.

### Microsoft Azure AI Speech

Azure AI Speech unifica STT, TTS, traducción y Speaker Recognition, con opciones de despliegue en nube y edge (contenedores). El componente Azure AI Content Understanding proporciona analítica post‑llamada para audio/video (resúmenes, sentiment, temas). Pricing a partir de uso (horas de audio para STT/traducción; caracteres para TTS; transacciones para reconocimiento de oradores). En seguridad, Azure declara más de 100 certificaciones y capacidades empresariales. Limitaciones: sin APIs comerciales dedicadas a SED/clasificación de sonidos ambientales; la analítica de audio se orienta a voz/conversacional[^8][^14][^24][^15].

### IBM Watson Speech to Text

Watson STT ofrece transcripción con personalización de modelos de lenguaje y acústicos, gramáticas, keyword spotting y etiquetas de orador; formatos amplios, interfaces REST/WebSockets y SDKs. En compliance, destaca soporte UE, HIPAA e IAM. A la fecha, no se dispone de tabla oficial de precios en el material revisado. Limitaciones: enfoque en voz; no ofrece clasificación de sonidos ambientales ni SED generalista[^13].

### Deepgram

Deepgram proporciona STT (streaming y pregrabado), TTS, una Voice Agent API y Audio Intelligence (resumen, temas, sentimiento, intenciones). Pricing muy competitivo: streaming Nova‑3/Flux desde 0,0077 USD/min; pregrabado Nova‑3 desde 0,0043 USD/min; add‑ons como diarización (0,002 USD/min), redaction (0,002 USD/min) y entity detection (0,0017 USD/min). Voice Agent API desde 0,08 USD/min (opciones con BYO TTS/LLM). Créditos iniciales gratuitos y planes Growth/Enterprise, con opciones de autoalojado[^7]. Limitaciones: orientado a voz y conversacional; la clasificación de sonidos ambientales requeriría pipeline propio.

### AssemblyAI

AssemblyAI ofrece STT (pregrabado y streaming) y “Speech Understanding” (identificación de locutor, traducción, formato personalizado, entidades, sentiment, capítulos, frases clave, temas, resúmenes), junto con Guardrails (PII, moderación). Pricing por hora: STT Universal ~0,15 USD/h, streaming ~0,15 USD/h; add‑ons con tarifas específicas (p. ej., entidades ~0,08 USD/h, sentiment ~0,02 USD/h). Free tier con créditos y políticas de concurrencia/canales publicadas. Residencia de datos UE y despliegues autoalojados mencionados[^6]. Limitaciones: sin SED/clasificación de sonidos ambientales nativa.

### Speechmatics

Speechmatics ofrece STT/TTS con cobertura de 55+ idiomas, modelos Enhanced/Standard, TTS de baja latencia y planes con límites de concurrencia (p. ej., 2 sesiones real‑time en plan gratuito, 50 en Pro). Pricing Pro desde 0,24 USD/h; plan gratuito con 480 minutos/mes. En Enterprise, declara opciones on‑prem y sin rate limits, con descuentos por volumen y despliegue multirregión[^9]. Limitaciones: foco en voz; la clasificación ambiental requiere pipeline personalizado.

### BirdNET (especializado bioacústica)

BirdNET identifica aves por sonido a escala (apps, web y código Analyzer para ejecución local). Es gratuito y funciona con modelos de deep learning; muestra las especies más probables por segundo. No publica pricing formal de API; la vía práctica de integración masiva es el código local (BirdNET‑Analyzer). Limitaciones: alcance principal en avifauna; no resuelve clasificación multiclase generalista de soundscapes[^10].

## Comparativa transversal de capacidades

Para orientar la selección, se sintetizan las funciones clave. Dado que los proveedores no publican WER ni latencias comparables, la evaluación es cualitativa y basada en documentación oficial.

Para visualizar el mapa de capacidades, la Tabla 1 resume las funciones más relevantes por proveedor.

Tabla 1. Matriz de capacidades por proveedor (selección)
| Proveedor | Transcripción (STT) | Streaming | Diarización | PII/Moderación | Audio Intelligence (no‑STT) | Clasificación sonidos | SED | Despliegue on‑prem/edge |
|---|---|---|---|---|---|---|---|---|
| OpenAI | Sí (Whisper, gpt‑4o) | Sí (Realtime) | Sí (gpt‑4o‑transcribe‑diarize) | No nativo (texto) | No | No | No | No oficial |
| AWS Transcribe | Sí | Sí | Sí (p. ej., en analítica) | Sí (redacción) | Sí (call analytics, resúmenes) | No | No | Cloud |
| Google STT | Sí (V2/V1) | Sí | Limitado (varía por modelo) | Parcial (orientado a STT) | No | No | No | Cloud |
| Azure AI Speech | Sí | Sí | Sí (via modelos/SDKs) | Parcial (vía Content Understanding) | Sí (post‑llamada conversacional) | No | No | Sí (contenedores) |
| IBM Watson STT | Sí | Sí | Sí (speaker labels) | Redacción básica | Parcial (métricas de audio) | No | No | Opciones empresariales |
| Deepgram | Sí | Sí (WSS) | Sí (add‑on) | Sí (redaction) | Sí (resumen, temas, sentimiento) | No | No | Sí (self‑hosted) |
| AssemblyAI | Sí | Sí | Sí | Sí (Guardrails) | Sí (entidades, temas, etc.) | No | No | Sí (autoalojado) |
| Speechmatics | Sí | Sí | Sí | Parcial | Parcial (analytics de uso) | No | No | Sí (Enterprise on‑prem) |
| BirdNET | No STT | N/A | N/A | N/A | No (bioacústica enfocada) | Sí (aves) | Sí (eventos aves) | Sí (local vía Analyzer) |

Nota: “Audio Intelligence (no‑STT)” agrupa funciones de resumen/temas/sentimiento o post‑llamada que no son transcripción pura[^1][^2][^11][^8][^13][^7][^6][^9][^10].

Interpretación: Para flujos conversacionales y de centro de contacto, AWS, Deepgram y AssemblyAI ofrecen el set más amplio de enriquecimiento y guardrails. Para cumplimiento y edge, Azure y Speechmatics destacan. Para soundscapes, el mercado carece de APIs generalistas; se recurre a pipelines personalizados y a BirdNET como especializado.

## Precios y límites de uso

El pricing varía por unidad (minuto, hora, tokens) y modalidad (streaming, batch, add‑ons). La Tabla 2 consolida cifras representativas en USD para configuraciones comunes.

Tabla 2. Comparativa de precios base (selección)
| Proveedor | Unidad | Modalidad/Modelo | Precio base | Observaciones |
|---|---|---|---|---|
| OpenAI | Minuto | Whisper | 0,006/min | Multilingüe; gpt‑4o‑mini‑transcribe ~0,003/min; Realtime API por tokens[^1][^25] |
| AWS Transcribe | Minuto | Standard batch T1 | 0,024/min | T2: 0,015; T3: 0,0102; T4: 0,0078; pago por segundos[^3] |
| Google STT V2 | Minuto | Estándar (0–500k) | 0,016/min | Tramos: 0,010 / 0,008 / 0,004; lote dinámico ~0,003/min[^11] |
| Azure AI Speech | Hora | STT/Traducción | Según uso | Ver página de pricing oficial[^14] |
| IBM Watson STT | — | — | N/D | Sin tabla pública en material revisado[^13] |
| Deepgram | Minuto | STT streaming Nova‑3/Flux | 0,0077/min | Add‑ons: diarización 0,002; redaction 0,002[^7] |
| AssemblyAI | Hora | STT Universal | ~0,15/h | Streaming ~0,15/h; add‑ons por hora (entidades ~0,08; sentiment ~0,02)[^6] |
| Speechmatics | Hora | Pro | ~0,24/h | Free: 480 min/mes; concurrencia 2→50 (Pro) real‑time[^9] |
| BirdNET | — | — | Gratuito | Uso masivo vía código Analyzer; sin pricing API formal[^10] |

Interpretación: Para lotes a gran escala, Google V2 con lote dinámico puede ser competitivo, y OpenAI Whisper ofrece el mínimo costo por minuto. En streaming, Deepgram es especialmente agresivo en precio por minuto y add‑ons; AssemblyAI simplifica la facturación por hora y amplía con “Speech Understanding”.

Límites y condiciones frecuentes:
- Multicanal: Google factura por suma de duraciones de canales; AWS factura por duración total en conversaciones de dos canales (no por canal). Deepgram factura por canal de forma independiente; AssemblyAI factura multicanal multiplicando duración por número de canales[^17][^3][^7][^6].
- Facturación mínima/por segundo: Google factura por segundo; AssemblyAI detalla límites de concurrencia y políticas de streams/minuto; Deepgram publica límites de concurrencia por API[^16][^6][^7].

## Soundscapes y bioacústica: estado del arte y viabilidad con APIs

Clasificar sonidos en natural (geofonía), antropofónico y biológico (biofonía) y detectar eventos en grabaciones ambientales exige modelos y protocolos diferentes a los de STT. La literatura recientes destaca:
- Protocolos no supervisados con índices beta y clustering anidado para descubrir tipos de sonido desconocidos sin anotación extensiva, con validación externa alta (p. ej., DKS con WL 2048 alcanzó ≥0,75 en puntuación normalizada y TPR ~90%)[^19].
- Datasets como FSC22 (27 clases de sonidos forestales) para entrenar clasificadores profundos y establecer benchmarks[^20].
- Enfoques de “AI‑based soundscape analysis” que identifican fuentes de sonido de manera conjunta, evidenciando la necesidad de modelos que integren información espectrotemporal y contexto[^22].
- Estimación automática de calidad del soundscape basada en análisis de audio, útil para monitorizar degradación o cambios de hábitat[^21].

La Tabla 3 sintetiza datasets y herramientas relevantes para pipelines personalizados.

Tabla 3. Datasets y herramientas para soundscapes
| Recurso | Foco | Formato/Contenido | Licencia/Disponibilidad | Uso típico |
|---|---|---|---|---|
| FSC22 (MDPI) | Sonidos forestales | 27 clases, ~2.025 clips | Público | Entrenamiento/benchmark de clasificación[^20] |
| Environmental Noise Dataset (PMC) | Eventos sonoros ambientales | Conjunto para SED/clasificación | Público | Entrenamiento SED y clasificación[^22] |
| BirdNET Analyzer | Bioacústica (aves) | Código para análisis local | Gratuito (GitHub) | Identificación de especies por sonido[^10] |
| seewave (R) | Índices acústicos | Paquete de análisis | Libre | Cálculo de índices beta y métricas[^19] |
| Kaleidoscope Pro | Detección de eventos | Software de detección | Comercial | Segmentación de eventos sonoros[^19] |

Limitaciones de APIs comerciales: No hay soporte nativo general para clasificación multiclase de soundscapes y SED en las APIs evaluadas; BirdNET resuelve aves, pero no el resto de taxocenosis. La viabilidad pasa por pipelines propios: segmentación/detección (Kaleidoscope o filtros), embeddings (p. ej., CNNs en espectrogramas), clasificación (Transformers/CNNs) y auditoría con protocolos no supervisados[^10][^19][^22].

## Arquitecturas de referencia y patrones de integración

Patrón conversacional (tiempo real):
- Streaming STT + LLM + TTS. OpenAI Realtime (audio‑in/out, precios por tokens) y Deepgram Voice Agent (precio por minuto, integración con LLM externo o propio) simplifican la orquestación de agentes de voz con latencia baja y capacidades de enriquecimiento (diarización, PII, sentiment)[^25][^7].

Patrón batch multimodal:
- Transcripción + análisis (entidades, sentiment, capítulos, resúmenes) + almacenamiento. AssemblyAI y Deepgram ofrecen add‑ons para entidades/temas/sentimiento y resúmenes con facturación por hora o tokens; Google STT V2 ofrece precios por minuto con tramo por volumen para escalar lotes[^6][^7][^11].

Patrón soundscapes:
- Detección/segmentación de eventos (Kaleidoscope o filtros) + embeddings + clasificación + validación. Protocolos no supervisados (índices beta + clustering) para descubrimiento de tipos de sonido; datasets FSC22 y similares para entrenamiento supervisado. BirdNET cubre aves; el resto requiere modelos propios[^19][^20][^10].

Seguridad, compliance y despliegue:
- Azure AI Speech integra Content Understanding (post‑llamada) y permite contenedores para edge; IBM Watson ofrece IAM, HIPAA y soporte UE. Speechmatics (Enterprise) y Deepgram (self‑hosted) facilitan on‑prem/VPC; AssemblyAI declara residencia de datos UE y despliegues autoalojados[^8][^13][^9][^7][^6].

## Recomendaciones por caso de uso

- Transcripción de reuniones/centros de contacto a coste ajustado: OpenAI Whisper (0,006 USD/min) para batch multilingüe; Deepgram pregrabado (Nova‑3 ~0,0043 USD/min) cuando se requiera escalado y add‑ons (entidades, redaction); Google V2 estándar para grandes volúmenes por sus tramos de precio decreciente[^1][^7][^11].
- Agentes de voz en tiempo real: Deepgram Voice Agent API por precio/funcionalidad y latencia; AssemblyAI streaming + Guardrails para control de PII/moderación; OpenAI Realtime cuando se priorice audio‑in/out nativo con LLM y costes por tokens controlados[^7][^6][^25].
- Máxima seguridad/compliance/edge: Azure AI Speech (contenedores, Content Understanding) e IBM Watson (HIPAA, UE, IAM); Speechmatics Enterprise on‑prem y Deepgram/AssemblyAI con despliegues autoalojados/VPC[^8][^14][^13][^9][^7][^6].
- Bioacústica/soundscapes: BirdNET para identificación de aves; pipeline personalizado con FSC22/Environmental Noise para otras clases y SED. Aplicar protocolos no supervisados para descubrir tipos de sonido en entornos poco muestreados[^10][^20][^22][^19].
- Moderación/PII y analítica: AssemblyAI (Speech Understanding + Guardrails) y AWS (call analytics con redacción y métricas conversacionales) cuando se necesite analítica de llamadas y cumplimiento regulatorio[^6][^3].

La Tabla 4 resume la selección sugerida.

Tabla 4. Selección recomendada por caso de uso
| Caso de uso | Opción primaria | Alternativas | Justificación |
|---|---|---|---|
| Batch STT low‑cost | OpenAI Whisper | Google V2 estándar; Deepgram pregrabado | Mínimo costo/min; escalado por volumen en Google[^1][^11][^7] |
| Agente de voz tiempo real | Deepgram Voice Agent | AssemblyAI streaming; OpenAI Realtime | Latencia/coste/min + add‑ons; control por tokens en OpenAI[^7][^6][^25] |
| Compliance/edge | Azure AI Speech | IBM Watson; Speechmatics Enterprise; Deepgram/AssemblyAI on‑prem | Contenedores, post‑llamada, IAM/HIPAA/UE; on‑prem/VPC[^8][^14][^13][^9][^7][^6] |
| Bioacústica | BirdNET | Pipeline propio (FSC22 + SED) | Especializado aves; pipeline para otras clases[^10][^20] |
| Moderación/PII | AssemblyAI Guardrails | AWS call analytics | Cobertura de PII/moderación y entidades/temas[^6][^3] |

## Riesgos, limitaciones y cumplimiento

- Cobertura funcional: Las APIs evaluadas no ofrecen, de forma nativa, clasificación de sonidos ambientales general ni SED multiclase; la solución práctica implica modelos propios y datasets específicos. Los proveedores se concentran en STT y analítica conversacional[^6][^11][^10].
- Precisión y rendimiento: No hay métricas estandarizadas (WER/latencia) publicadas comparables entre todos; se recomienda validación propia con corpus representativo.
- Costes ocultos y facturación: Add‑ons (diarización, PII, entidades), multicanal (facturación por suma de canales), diferencias entre batch y streaming, y tokens en Realtime. Revisar cuotas y límites para evitar throttling[^7][^6][^16].
- Compliance y residencia de datos: Verificar HIPAA/IAM/UE y políticas de residencia; Azure y IBM declaran cobertura amplia; Speechmatics, Deepgram y AssemblyAI ofrecen opciones de despliegue privado/VPC/UE[^8][^13][^9][^7][^6].
- Vendor lock‑in: Estandarizar contratos y habilitar rutas de migración (on‑prem/self‑hosted o multicloud) mitigan dependencia.

## Conclusiones y próximos pasos

Selección por objetivo:
- Eficiencia: OpenAI Whisper (batch) y Deepgram (streaming) maximizan relación coste‑prestaciones para STT. Google V2 estándar es competitivo en lotes de gran escala por tramos de precio.
- Cumplimiento/edge: Azure AI Speech y IBM Watson aportan certificaciones y rutas de despliegue; Speechmatics y Deepgram complementan con opciones Enterprise/on‑prem.
- Tiempo real: Deepgram Voice Agent y AssemblyAI streaming destacan; OpenAI Realtime suma audio‑in/out nativo con LLM.
- Soundscapes/bioacústica: BirdNET como punto de partida para aves; el resto requiere pipeline con datasets FSC22/Environmental Noise y protocolos no supervisados para explorar sonidos desconocidos.

Plan de prueba piloto:
- Definir corpus y métricas: WER, latencia extremo a extremo, precisión de diarización, calidad de resúmenes y tasas de detección de eventos para SED.
- Escenarios: batch multilingüe, streaming con PII/guardrails, pipeline de soundscapes (segmentación + clasificación).
- Estimación de coste por escenario: minutos/horas/tokens y add‑ons; validar multicanal y cuotas.
- Checklist de integración: SDKs/REST/WebSocket, límites de concurrencia, formatos de audio, seguridad (IAM, HIPAA, residencia de datos), despliegue (nube/edge/on‑prem).

Roadmap:
- Fase 1: Piloto STT (OpenAI/Deepgram/Google) y analítica (AssemblyAI/AWS).
- Fase 2: Agente de voz tiempo real (Deepgram/OpenAI Realtime) con guardrails.
- Fase 3: Soundscapes (BirdNET + pipeline SED) y validación con protocolos no supervisados.
- Fase 4: Endurecimiento de seguridad/compliance, on‑prem/VPC según necesidades regulatorias.

## Anexos

Glosario:
- STT/ASR: Speech‑to‑Text/Automatic Speech Recognition.
- Diarización: Identificación de hablantes en una grabación.
- PII: Personally Identifiable Information (información personal identificable).
- SED: Sound Event Detection (detección de eventos sonoros).
- Lote dinámico: Procesamiento batch no urgente con descuento de precio.

Resumen de cuotas y límites (extracto):
- Google STT: facturación por segundo; cuotas documentadas y límites por proyecto[^16].
- Deepgram: límites de concurrencia por API (REST/WSS) publicados por servicio[^7].
- AssemblyAI: límites de streams/minuto y políticas de concurrencia detalladas[^6].
- Speechmatics: concurrencia real‑time 2 (free) → 50 (Pro) sesiones; jobs/segundo en archivo[^9].

Fórmulas de coste:
- Minutos a horas: horas = minutos/60.
- Tokens (OpenAI Realtime): coste = (tokens_entrada/1M × tarifa_entrada) + (tokens_salida/1M × tarifa_salida).
- Multicanal (ejemplos): Google suma duración de canales; Deepgram factura cada canal por separado; AssemblyAI multiplica duración por número de canales; AWS Transcribe, en conversaciones de dos canales, factura por duración total[^17][^7][^6][^3].

## Referencias

[^1]: Pricing - OpenAI API. https://platform.openai.com/docs/pricing  
[^2]: Convert Speech to Text - Amazon Transcribe - AWS. https://aws.amazon.com/transcribe/  
[^3]: Amazon Transcribe Pricing. https://aws.amazon.com/transcribe/pricing/  
[^4]: What is Amazon Transcribe? - AWS Documentation. https://docs.aws.amazon.com/transcribe/latest/dg/what-is.html  
[^5]: Speech to Text - IBM Cloud. https://cloud.ibm.com/catalog/services/speech-to-text  
[^6]: Pricing | Production-ready AI Models - AssemblyAI. https://www.assemblyai.com/pricing  
[^7]: Pricing & Plans - Deepgram. https://deepgram.com/pricing  
[^8]: Azure AI Speech | Microsoft Azure. https://azure.microsoft.com/en-us/products/ai-services/ai-speech  
[^9]: Pricing for our Speech API services - Speechmatics. https://www.speechmatics.com/pricing  
[^10]: BirdNET Sound ID – The easiest way to identify birds by sound. https://birdnet.cornell.edu/  
[^11]: Speech-to-Text API Pricing | Google Cloud. https://cloud.google.com/speech-to-text/pricing  
[^12]: Speech-to-Text documentation - Google Cloud. https://cloud.google.com/speech-to-text/docs  
[^13]: Speech to Text - IBM Cloud (product page). https://cloud.ibm.com/catalog/services/speech-to-text  
[^14]: Azure AI Speech pricing. https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/  
[^15]: Release notes for Speech to Text for IBM Cloud. https://cloud.ibm.com/docs/speech-to-text?topic=speech-to-text-release-notes  
[^16]: Quotas and limits | Google Cloud Speech-to-Text. https://cloud.google.com/speech-to-text/quotas  
[^17]: Number of channels | Google Cloud Speech-to-Text. https://cloud.google.com/speech-to-text/docs/multi-channel  
[^18]: Recognize speech by using enhanced models | Cloud Speech-to-Text. https://docs.cloud.google.com/speech-to-text/docs/enhanced-models  
[^19]: A novel protocol for exploratory analysis of unknown sound‑types in large acoustic datasets. Methods in Ecology and Evolution (2025). https://besjournals.onlinelibrary.wiley.com/doi/10.1111/2041-210X.70134  
[^20]: Forest Sound Classification Dataset: FSC22 - MDPI. https://www.mdpi.com/1424-8220/23/4/2032  
[^21]: Automatic soundscape quality estimation using audio analysis (ACM). https://dl.acm.org/doi/10.1145/2769493.2769501  
[^22]: Environmental Noise Dataset for Sound Event Classification and ... https://pmc.ncbi.nlm.nih.gov/articles/PMC12572321/  
[^23]: BirdNET-Analyzer (GitHub repository). https://github.com/kahst/BirdNET-Analyzer  
[^24]: Azure AI Content Understanding audio overview - Microsoft Learn. https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/audio/overview  
[^25]: Introducing the Realtime API - OpenAI. https://openai.com/index/introducing-the-realtime-api/