# Bibliotecas de JavaScript para visualización de audio (2025): evaluación comparativa, rendimiento y ejemplos de implementación

## Resumen ejecutivo

Este informe analiza, compara y operacionaliza la selección de bibliotecas y APIs de JavaScript para visualizar audio en navegadores en 2025. El foco abarca tres familias de visuales clave —forma de onda en tiempo real, espectrograma y espectro FFT— con recomendaciones pragmáticas por caso de uso y guías de implementación.

Conclusiones clave:
- Reproductor con forma de onda y espectrograma: wavesurfer.js es la opción más directa y madura para visualización de forma de onda, con un ecosistema de plugins maduro que incluye espectrograma, regiones, timeline y grabación; su API tipada (TypeScript) acelera la adopción en proyectos front-end modernos[^1][^2][^3][^4].
- Espectro FFT de alto rendimiento: audioMotion-analyzer ofrece un analizador de espectro en tiempo real de alta resolución, con escalas perceptivas (Bark/Mel), filtros de ponderación, modo de baja resolución para móviles y un footprint minificado cercano a 30 kB; es idóneo para dashboards y experiencias reactivas donde importan la calidad visual y la eficiencia[^7][^8][^9][^10].
- Creative coding y prototipos educativos: p5.js con p5.sound brinda una puerta de entrada muy accesible con p5.FFT (waveform y analyze), perfecta para demos y aprendizaje; no obstante, su documentación carece de métricas comparativas de rendimiento y requiere validación en escenarios exigentes[^11][^12][^13][^14].
- Visualizaciones a medida y control fino: D3.js paired with Web Audio API permite gráficos y transiciones a la carta, ideal para visualizaciones de alta calidad orientadas a datos; exige más implementación manual (escalas, actualizaciones) y tiene particularidades en Safari documentadas por la comunidad[^15][^16][^17][^19].
- Generación y análisis de audio: Tone.js provee una capa musical de alto nivel (transport, sintetizadores, efectos) para enriquecer visuales, mientras que el análisis de frecuencia se obtiene a través del puente con AnalyserNode de Web Audio API[^5][^6][^20][^21].
- Fundamento nativo: Web Audio API, y en particular AnalyserNode, constituye el mínimo común denominador para obtener datos de tiempo y frecuencia, con recomendaciones de renderizado (Canvas) y técnicas de optimización (OffscreenCanvas + Web Workers) para dispositivos de gama media/baja y móviles[^19][^20][^27][^28][^31][^33].

Mapa de decisión rápido:
- FFT “plug-and-play” de alta calidad: audioMotion-analyzer.
- Reproductor de audio con forma de onda y espectrograma: wavesurfer.js + plugin Spectrogram.
- Visualizaciones 3D y efectos especiales: Three.js combinado con Web Audio API (ver ejemplos oficiales de three.js y guía Codrops sobre visualizador 3D)[^40][^41].
- Creative coding/educación: p5.js + p5.sound.
- Dashboard corporativo con alto volumen de绘制 y necesidades de rendimiento: considerar librerías de gráficos de alto rendimiento orientadas a datos (por ejemplo, SciChart.js, LightningChart JS) como capa de visualización, conectadas a AnalyserNode[^36][^37].

Estas recomendaciones se apoyan en documentación oficial, demos y guías técnicas citadas al final del documento.

## Fundamentos técnicos de visualización de audio en la Web

La Web Audio API es el pilar nativo para el procesamiento y análisis de audio en navegadores. Funciona mediante un grafo de nodos (AudioNode) conectados dentro de un contexto (AudioContext): las fuentes (por ejemplo, AudioBufferSourceNode, MediaElementAudioSourceNode, MediaStreamAudioSourceNode) se encadenan a módulos de efectos y análisis, y finalmente al destino (AudioDestinationNode)[^19][^21]. El AnalyserNode, centro de este informe, ofrece datos en tiempo real tanto del dominio del tiempo (waveform) como del dominio de la frecuencia (espectro), que pueden capturarse con getByteTimeDomainData y getByteFrequencyData respectivamente[^20][^27].

Para renderizar, la Canvas API 2D es el caballo de batalla: permite dibujar barras de espectro, formas de onda y trazos osciloscópicos con un control de estilo flexible. Cuando el presupuesto de rendimiento es ajustado —móviles o escenas con alta densidad de píxeles— técnicas como OffscreenCanvas y Web Workers permiten descargar el dibujo del hilo principal, minimizando bloqueos y garbage collection visible[^28][^31][^33].

En términos de análisis, los parámetros críticos son:
- fftSize: determina la resolución en frecuencia y la “ventana” temporal; valores más altos aportan más detalle espectral pero reducen la definición temporal y elevan el coste computacional.
- smoothingTimeConstant: suaviza las fluctuaciones del espectro; valores altos reducen el parpadeo pero增加 latencia visual.
- minDecibels/maxDecibels: ajustan la escala de amplitudes reportadas por el analizador.

Cuando la necesidad es construir un espectrograma —representación tiempo-frecuencia— la técnica estándar es la Transformada de Fourier de Corto Plazo (STFT): se fragmenta la señal en ventanas solapadas, se aplica FFT a cada ventana y se apilan los espectros a lo largo del tiempo. La elección de tamaño de ventana (fftSize) y salto (hop size) determina la resolución tiempo-frecuencia y la carga de CPU[^35][^43].

## Metodología de evaluación

Se evaluaron las bibliotecas por:
- Rendimiento: capacidad de mantener FPS estable y baja latencia en móviles, opciones de control de calidad (modo loRes, limitación de maxFPS), footprint y escalabilidad de instancias.
- Facilidad de uso: API, TypeScript, documentación, ejemplos y ecosistema de plugins.
- Compatibilidad móvil y restricciones de autoplay: políticas de interacción requeridas para iniciar AudioContext y reproducir audio, diferencias entre Safari iOS y Android Chrome.
- Tipos de visualización soportados: espectro FFT, forma de onda, espectrograma, 3D y efectos.

Las conclusiones se basan en documentación oficial, repositorios y ejemplos verificables; no se incluyen benchmarks cruzados con métricas uniformes de FPS/CPU/memoria, que se declaran como brecha de información. Se recomiendan pruebas empíricas propias antes de fijar SLAs de rendimiento en producción.

## Ecosistema y mapa de librerías

El ecosistema se estructura por propósito:
- Visualización dedicada:
  - wavesurfer.js: reproductor y visualizador de forma de onda con plugin de espectrograma, regions, timeline, hover, minimap, record[^1][^2][^3][^4].
  - audioMotion-analyzer: analizador de espectro en tiempo real de alta resolución, escalas perceptivas, filtros de ponderación y efectos visuales[^7][^8][^10].
- Creative coding:
  - p5.js + p5.sound: p5.FFT para waveform y spectrum, ideal para prototipos y enseñanza[^11][^12][^13].
- Visualizaciones a medida (data-driven):
  - D3.js con Web Audio API: control absoluto de escalas, colores y transiciones[^15][^16][^17].
- Capa de audio y síntesis:
  - Web Audio API como base nativa y Tone.js como framework musical de alto nivel (transport, instrumentos, efectos)[^19][^5][^6].
- 3D y gráficos de alto rendimiento:
  - Three.js para escenas 3D reactivas al audio; librerías de gráficos (SciChart.js, LightningChart JS) para visualizar datos de audio con mucha densidad de绘制[^40][^41][^36][^37].

## Evaluación por biblioteca

### wavesurfer.js

Descripción y enfoque. wavesurfer.js está orientada a reproducir y visualizar formas de onda interactivas en la web. Su API en TypeScript, su ecosistema de plugins y su documentación de ejemplos simplifican la construcción de reproductores con anotaciones, líneas de tiempo, miniaturas de navegación y regiones seleccionables[^1][^2][^3][^4].

Plugins clave. Regions permite marcar y seleccionar fragmentos; Timeline añade rejillas y etiquetas temporales; Hover muestra información de posición; Minimap ofrece una navegación compacta; Record graba microfono y renderiza la onda; Spectrogram representa el espectro en el tiempo sobre FFT; Envelope expone controles de fundidos y volumen[^1][^4]. El plugin Spectrogram resuelve, de facto, el caso de uso de espectrograma sin implementar STFT manualmente.

Rendimiento y móvil. El renderizado se apoya en Canvas y procesa datos decodificados de audio; en móviles de gama media/baja conviene evitar resoluciones excesivas y animate a tasas moderadas para mantener FPS. La interacción inicial del usuario suele ser necesaria para iniciar el audio (ver sección de autoplay).

Compatibilidad y casos de uso. wavesurfer.js es idónea para editors, aplicaciones de transcripción y herramientas de annotation donde la selección precisa de regiones y la navegación temporal son centrales. Su foco no es el espectro en tiempo real, aunque el plugin Spectrogram cubre la representación tiempo-frecuencia.

### audioMotion-analyzer

Características y rendimiento. audioMotion-analyzer es un módulo ES6 sin dependencias, con footprint minificado ~30 kB, preparado para pantallas HiDPI y modos de alto rendimiento. Por defecto utiliza fftSize=8192 y smoothing=0.5, con escalas lineales, logarítmicas y perceptivas (Bark y Mel). Ofrece filtros de ponderación (A, B, C, D, ITU-R 468), efectos visuales (barras LED, espectro radial, reflejo), gradientes predefinidos y soporte de múltiples instancias. Incluye maxFPS para limitar la tasa de refresco y loRes para reducir la carga en dispositivos con alta densidad de píxeles y móviles[^7][^8][^10].

Casos de uso. Es la opción recomendada para análisis de espectro en tiempo real de alta calidad, dashboards y experiencias musicalmente reactivas, con un balance excelente entre calidad visual y facilidad de integración. Los ejemplos oficiales incluyen conexión a micrófono y control fino de efectos[^7][^10].

### p5.js + p5.sound

Capacidades de análisis. p5.sound expone p5.FFT con waveform (dominio del tiempo) y analyze (dominio de la frecuencia, rango 0–255). Es simple de usar en el editor web de p5 y permite prototipar visualizadores con muy pocas líneas de código, lo que la hace ideal para educación y creative coding[^11][^12][^13][^14].

Rendimiento y documentación. La documentación y tutoriales existentes no proveen métricas comparativas de rendimiento (FPS/CPU/memoria) ni perfiles de compatibilidad exhaustivos. Es razonable esperar que, para escenas intensivas o múltiples instancias, la optimización recaiga en el desarrollador (reducción de resolución, throttling de FPS, offscreen drawing). Se recomienda validación empírica en dispositivos objetivo.

Compatibilidad móvil. El uso del micrófono exige permisos y gesto de usuario para iniciar el AudioContext; la gestión de estados de reproducción en iOS/Android debe considerarse en el diseño de la UI.

### D3.js para audio

Enfoque y potencia. D3.js es la librería de referencia para visualizaciones data-driven a medida. Combinada con Web Audio API, habilita mapeos sofisticados (d3.scaleLinear, d3.scaleSequential) y transiciones suaves sobre SVG o Canvas, para crear desde espectros estilo LED hasta osciloscopios y visualizaciones circulares[^15][^16][^17].

Consideraciones de implementación. El control fino exige mayor esfuerzo de ingeniería (gestión de escalas, joins de datos, actualizaciones por frames, cálculo de colores). Artículos de la comunidad han señalado inconsistencias de comportamiento en Safari frente a Chrome para ciertas combinaciones de nodos y pipeline de análisis, lo que sugiere realizar pruebas de regresión multi-navegador[^17].

Casos de uso. Es ideal cuando la prioridad es la estética y precisión del gráfico, la narrativa de datos y la interactividad a medida, por ejemplo, en publicaciones interactivas o dashboards analíticos.

### Tone.js (síntesis y transporte musical)

Tone.js no es una librería de visualización, pero complementa las visualizaciones con una capa musical potente: transporte global con sincronización precisa, sintetizadores (Tone.Synth, PolySynth, FMSynth, AMSynth), Sampler, Player y una amplia gama de efectos (Filter, Delay, Distortion, Reverb). Además, facilita el control paramétrico con señales y rampas, y la programación temporal con notación musical (“4n”, “1m”)[^5][^6].

Integración con análisis. Para vincular síntesis y visuales, se crea un AnalyserNode y se conectan los nodos de Tone.js hacia él y al destino. Tone.start() debe invocarse tras un gesto del usuario para cumplir las políticas de autoplay en navegadores móviles y de escritorio[^5][^6].

### Web Audio API (nativo)

La Web Audio API expone los ladrillos fundamentales: AudioContext, nodos fuente, efectos y destinos. AnalyserNode es la pieza central para visualización, con métodos getByteFrequencyData y getByteTimeDomainData para capturar datos de espectro y forma de onda[^19][^20][^27]. Las guías de MDN recomiendan patrones de Canvas para FFT y waveform, y medidas como limitar fftSize, reducir resolución y usar requestAnimationFrame para sincronizar el refresco visual[^27][^19][^21].

Optimización avanzada. Cuando la visualización compite con lógica de UI o cuando el dispositivo móvil sufre bajo FPS, combinar OffscreenCanvas con Web Workers ayuda a descargar el dibujo y aislar el GC del hilo principal, como demuestran tutoriales y ejemplos prácticos[^28][^31][^33].

### Three.js (visualizaciones 3D)

Las visualizaciones 3D se apoyan en un renderer WebGL, cámaras y shaders. Los ejemplos oficiales de three.js incluyen visualizadores webaudio, y guías recientes detallan cómo integrar Web Audio API (AnalyserNode) para mover geometrías, materiales y efectos (p. ej., Fresnel, distorsiones de vértice, partículas) al ritmo del audio[^40][^41]. Casos de uso típicos: música en vivo, sitios inmersivos y experiencias interactivas con alto impacto visual.

### Librerías de gráficos para alto rendimiento

Cuando la prioridad es manejar grandes volúmenes de绘制 con estabilidad (por ejemplo, múltiples series espectrales, ventanas deslizantes, logging histórico), es útil considerar librerías de alto rendimiento como SciChart.js o LightningChart JS, que ofrecen ejemplos de FFT en tiempo real y optimizaciones de rendering. Estas herramientas actúan como capa de visualización y se conectan a los datos que provengan de AnalyserNode o de buffers propios[^36][^37].

## Compatibilidad móvil y restricciones (autoplay, micrófono, Safari)

La mayoría de navegadores móviles requieren un gesto del usuario para iniciar o reanudar el AudioContext y reproducir audio automáticamente (política de autoplay). En práctica, esto significa llamar a Tone.start() o a audioContext.resume() dentro de un event listener de click/tap antes de cualquier reproducción o análisis de micrófono[^5][^21].

En iOS Safari, se han observado limitaciones históricas con flujos en vivo (por ejemplo, streams de Icecast) dentro de audioMotion-analyzer debido a un bug de WebKit; es prudente testear y, de ser necesario, fallback a archivos locales o a otras fuentes como MediaElement[^7][^21][^42]. Para entrada de micrófono, getUserMedia exige permisos explícitos; la experiencia de usuario debe informar y requerir la acción de permitir.

Conviene recordar que, en iOS, WebRTC y navegadores de terceros siguen las reglas del motor WebKit del sistema; la compatibilidad práctica de APIs de tiempo real puede variar por versión y configuración[^42].

## Rendimiento y optimización

Parámetros de AnalyserNode. fftSize y smoothingTimeConstant impactan directamente en la latencia y la estabilidad visual. fftSize altos (p. ej., 2048–8192) aumentan la resolución en frecuencia pero reducen la resolución temporal y elevan el coste; smoothing estabiliza el espectro, pero amortigua la respuesta a transitorios[^20][^27][^35].

Optimizaciones específicas de bibliotecas.
- audioMotion-analyzer: limitar maxFPS para reducir CPU, activar loRes en pantallas de alta densidad y en móviles, y aprovechar escalas perceptivas (Bark/Mel) para adaptar el mapeo a la percepción humana[^7][^8].
- Canvas: reducir resolución del canvas, usar barras con ancho mayor, y agrupar actualizaciones; cuando la carga crece, descargar el dibujo a un Web Worker mediante OffscreenCanvas[^28][^31][^33].
- Diseño del bucle: sincronizar con requestAnimationFrame, evitar trabajo sincronizado costoso en cada frame (por ejemplo, cálculos de color complejos), y mantener arrays prealocados.

Arquitectura para móviles. Minimizar allocations por frame, usar TypedArrays prealocados, y considerar batching o throttling del refresco. En 3D, reducir subdivisiones de geometrías y postprocesos costosos, y mantener el pipeline de audio y renderizado con prioridades claras.

Para operacionalizar estas decisiones, el siguiente resumen agrega recomendaciones por biblioteca.

Tabla 1. Resumen de parámetros de rendimiento y optimizaciones por biblioteca

| Biblioteca            | Parámetros clave                                   | Soporte de optimización             | Recomendaciones prácticas en móviles                         |
|-----------------------|-----------------------------------------------------|-------------------------------------|--------------------------------------------------------------|
| audioMotion-analyzer  | fftSize (p. ej., 8192), smoothing, maxFPS, loRes    | maxFPS, loRes, escalas perceptivas  | Activar loRes, limitar maxFPS a 30–60, usar escalas Mel/Bark[^7][^8] |
| wavesurfer.js         | Resolución de render, plugins (Spectrogram, Regions)| Zoom, minimap, timeline             | Evitar resoluciones excesivas, usar minimap, throttling de animate[^1][^4] |
| p5.js + p5.sound      | fft (p5.FFT), smoothing, resolución de lienzo       | Control de frame rate manual        | Reducir tamaño de lienzo, smoothing moderado, no multiple instances simultáneas[^11][^12] |
| D3 + Web Audio        | Escalas y transiciones (SVG/Canvas)                 | OffscreenCanvas + Worker (manual)   | Preferir Canvas para FPS, usar Worker para dibujo, limitar SVG complejo[^15][^17][^28][^31] |
| Three.js              | fftSize de Analyser, densidad de geometría          | Reducir teselación, postprocesos    | Bajar subdivisiones, evitar postprocesos costosos, limitar draw calls[^40][^41] |

Como se observa, la capacidad de audioMotion para limitar maxFPS y activar loRes, junto con el soporte de escalas perceptivas, ofrece una ventaja inmediata en móviles. En cambio, p5.js y D3 requieren más decisiones de ingeniería para mantener FPS.

Tabla 2. Impacto de fftSize y smoothing en calidad vs. coste

| Parámetro               | Efecto principal                                | Coste/Trade-off                             | Escenarios recomendados                         |
|-------------------------|--------------------------------------------------|----------------------------------------------|-------------------------------------------------|
| fftSize bajo (128–512)  | Respuesta temporal rápida, menor detalle espectral | Menor CPU, espectro “más grueso”            | Visualizaciones reactivas, detección de transitorios[^27][^35] |
| fftSize medio (1024–2048) | Balance tiempo-frecuencia razonable             | CPU moderada                                 | Equalizadores y espectros generales             |
| fftSize alto (4096–8192)| Gran detalle espectral, menos respuesta temporal | Mayor CPU, posible latencia visual           | Análisis fino, audioMotion con loRes en móviles[^7][^35] |
| smoothing alto (≥0.7)   | Suavizado fuerte, menos parpadeo                 | Respuesta más lenta                          | Evitar flicker en cámaras o dashboards[^27][^20] |
| smoothing bajo (≤0.3)   | Respuesta rápida, posible jitter                 | Parpadeo, ruido en barras                    | Música en vivo, visuales hiper-reactivos[^27]   |

## Ejemplos de implementación (patrones y snippets)

Los siguientes patrones muestran cómo integrar las piezas clave de manera práctica y portable.

Espectro FFT con Web Audio + Canvas (vanilla). Se crea un AudioContext, se conecta un MediaElementAudioSourceNode a un AnalyserNode y se dibujan barras en Canvas 2D. Se ajusta fftSize según la resolución deseada y se Usa requestAnimationFrame para sincronizar el dibujo[^27][^28][^31].

```js
// Inicialización básica
const audio = document.querySelector('#audio');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();

analyser.fftSize = 512; // Ajuste fino según caso
analyser.smoothingTimeConstant = 0.6;

const source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

const bufferLength = analyser.frequencyBinCount;
const data = new Uint8Array(bufferLength);
const canvas = document.querySelector('#viz');
const ctx = canvas.getContext('2d');

function draw() {
  analyser.getByteFrequencyData(data);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const barWidth = canvas.width / bufferLength;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const v = data[i];
    const h = (v / 255) * canvas.height;
    ctx.fillStyle = `rgb(${v}, ${128}, ${255 - v})`;
    ctx.fillRect(x, canvas.height - h, barWidth, h);
    x += barWidth;
  }
  requestAnimationFrame(draw);
}
draw();
```

Forma de onda en tiempo real con Web Audio + Canvas (osciloscopio). Se usa getByteTimeDomainData y se dibuja un área con suavizado de curva[^27][^28].

```js
const timeData = new Uint8Array(analyser.fftSize);
function drawWave() {
  analyser.getByteTimeDomainData(timeData);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  const slice = canvas.width / timeData.length;
  for (let i = 0; i < timeData.length; i++) {
    const v = timeData[i] / 128.0 - 1.0; // -1..1
    const y = canvas.height / 2 + v * (canvas.height / 2) * 0.9;
    const x = i * slice;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0ff';
  ctx.stroke();
  requestAnimationFrame(drawWave);
}
drawWave();
```

Espectrograma con wavesurfer.js (plugin Spectrogram). Se crea una instancia de wavesurfer, se activa el plugin Spectrogram y se conecta una fuente de audio o un buffer; el plugin renderiza la representación tiempo-frecuencia usando FFT[^4][^1].

```js
import WaveSurfer from 'wavesurfer.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';

const wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: '#999',
  progressColor: '#555',
  height: 128
});

const spectrogram = wavesurfer.registerPlugin(Spectrogram.create({
  labels: true,
  frequencyMin: 50,   // Ajustar según contenido
  frequencyMax: 10000 // Ajustar según contenido
}));

// Cargar contenido y reproducir
wavesurfer.load('path/to/audio.mp3');
wavesurfer.on('ready', () => wavesurfer.play());
```

Espectrograma DIY (STFT) en Canvas. Implementación educativa: se define fftSize y hopSize, se aplica ventana y se apilan los espectros en un buffer circular para representar el eje temporal. Se recomienda comenzar con fftSize=2048 y hop=fftSize/4, y optimizar según dispositivo[^35][^43].

```js
// Pseudocódigo de alto nivel para STFT en Canvas
const fftSize = 2048;
const hopSize = fftSize / 4;
const fft = new FFT(fftSize); // Implementación de FFT (p. ej., dsp.js, fft.js)
const spectrogramImageData = ctx.createImageData(canvas.width, canvas.height);

// Para cada ventana:
for (let start = 0; start + fftSize <= samples.length; start += hopSize) {
  const segment = samples.subarray(start, start + fftSize);
  const windowed = segment.map((v, i) => v * window[i]);
  const spectrum = fft.realTransform(windowed); // magnitudes por bin
  // Mapear magnitudes a colores y escribir en ImageData (eje X: tiempo, Y: frecuencia)
}
ctx.putImageData(spectrogramImageData, 0, 0);
```

Espectro FFT con audioMotion-analyzer. Se instancia el analizador, se conecta a un elemento <audio> o a un nodo del grafo (oscilador + ganancia) y se personalizan opciones (fftSize, smoothing, escala, maxFPS, loRes)[^7][^10].

```js
import AudioMotionAnalyzer from 'audiomotion-analyzer';

const audioEl = document.querySelector('#player');
const analyzer = new AudioMotionAnalyzer(document.getElementById('container'), {
  source: audioEl,     // o un nodo: analyzer.connectInput(gainNode)
  fftSize: 4096,       // ajustar calidad vs. coste
  smoothing: 0.5,
  mode: 0,             // 0: barras discrete FFT; hasta 240 bandas
  scale: 'mel',        // 'linear' | 'log' | 'bark' | 'mel'
  maxFPS: 60,
  loRes: true          // recomendado en móviles
});
```

Visualizador 3D con Three.js + Web Audio. Se configura renderer, cámara y geometría; un AnalyserNode captura el espectro y controla uniforms de shader o parámetros de transformaciones para pulsar geometrías y shaders al ritmo del audio[^40][^41].

```js
const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w/h, 0.1, 100);
camera.position.set(0, 0, 10);

// Geometría y material
const geo = new THREE.IcosahedronGeometry(2, 3);
const mat = new THREE.ShaderMaterial({ /* ... uniforms: time, audioLevel ... */ });
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);

// Audio
const audio = document.querySelector('#audio');
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.8;
const src = audioCtx.createMediaElementSource(audio);
src.connect(analyser);
analyser.connect(audioCtx.destination);

// Animación
const freq = new Uint8Array(analyser.frequencyBinCount);
function animate() {
  analyser.getByteFrequencyData(freq);
  const level = freq.reduce((a, b) => a + b, 0) / (freq.length * 255);
  mat.uniforms.audioLevel.value = level;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
```

Creative coding con p5.js. p5.FFT simplifica la obtención de spectrum y waveform; se dibujan barras o líneas con mapeos directos de amplitud[^11][^12][^13][^14].

```js
let mic, fft;

function setup() {
  createCanvas(800, 300);
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(0.7, 512); // smoothing, bins
  fft.setInput(mic);
}

function draw() {
  background(0);
  const spectrum = fft.analyze();
  const barW = width / spectrum.length;
  for (let i = 0; i < spectrum.length; i++) {
    const h = map(spectrum[i], 0, 255, 0, height);
    fill(100 + i, 200, 255);
    rect(i * barW, height - h, barW, h);
  }
}
```

Patrón D3 + Web Audio. Se crean escalas lineales para ejes y secuenciales para color; se actualizan atributos de rects o paths por frame con transiciones (cuando corresponda)[^17][^15][^16].

```js
const xScale = d3.scaleLinear().domain([0, N - 1]).range([0, width]);
const yScale = d3.scaleLinear().domain([0, 255]).range([height, 0]);
const colorScale = d3.scaleSequential(d3.interpolateSpectral).domain([0, N]);

const bars = svg.selectAll('rect').data(d3.range(N)).join('rect');

function update(freqData) {
  bars
    .attr('x', (_, i) => xScale(i))
    .attr('y', (_, i) => yScale(freqData[i]))
    .attr('width', barWidth)
    .attr('height', (_, i) => height - yScale(freqData[i]))
    .style('fill', (_, i) => colorScale(i));
}
```

Síntesis y transporte con Tone.js. Se configura un sintetizador o sampler, se conecta a un AnalyserNode para alimentar visuales y se utiliza el Transport para sincronizar eventos con precisión musical[^6][^5].

```js
import * as Tone from 'tone';

const synth = new Tone.Synth().toDestination();
const analyser = Tone.getContext().rawContext.createAnalyser();
synth.connect(analyser);
analyser.connect(Tone.getContext().rawContext.destination);

const transport = Tone.getTransport();
transport.bpm.value = 120;
transport.scheduleRepeat((time) => {
  synth.triggerAttackRelease('C4', '8n', time);
}, '4n');

document.querySelector('#start').addEventListener('click', async () => {
  await Tone.start();
  transport.start();
});
```

Optimización con Web Workers + OffscreenCanvas. Se transfiere el control del canvas al worker y se envían TypedArrays de datos de frecuencia para dibujar fuera del hilo principal, reduciendo bloqueos y mejorando la experiencia en móviles[^31][^33][^28].

```js
// main.js
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker('./worker.js');
worker.postMessage({ canvas: offscreen }, [offscreen]);

function loop() {
  analyser.getByteFrequencyData(data);
  worker.postMessage({ bufferLength, data }, [data.buffer]);
  data = new Uint8Array(bufferLength); // re-alloc simple para siguiente frame
  requestAnimationFrame(loop);
}

// worker.js
let ctx;
onmessage = ({ data }) => {
  if (data.canvas) {
    ctx = data.canvas.getContext('2d');
  } else {
    const { bufferLength, data: arr } = data;
    const barWidth = ctx.canvas.width / bufferLength;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let i = 0; i < bufferLength; i++) {
      const h = (arr[i] / 255) * ctx.canvas.height;
      ctx.fillRect(i * barWidth, ctx.canvas.height - h, barWidth, h);
    }
  }
};
```

Estos patrones cubren los casos más comunes y proporcionan una base robusta para evolucionar hacia soluciones personalizadas.

## Comparativa y selección por caso de uso

Para orientar la decisión, la siguiente matriz resume capacidades y restricciones. Dado que no existen benchmarks uniformes públicos, las valoraciones de rendimiento y compatibilidad se basan en documentación y características declaradas por las bibliotecas.

Tabla 3. Matriz comparativa (capacidades, rendimiento estimado, compatibilidad, requisitos)

| Biblioteca             | Tipos de visualización                    | API/TypeScript | Plugins/Extensiones           | Rendimiento estimado | Compatibilidad móvil          | Autoplay/Micrófono          | Licencia (resumen)         |
|------------------------|--------------------------------------------|----------------|-------------------------------|----------------------|-------------------------------|-----------------------------|----------------------------|
| wavesurfer.js          | Forma de onda, espectrograma (plugin)      | Sí (TypeScript)| Regions, Timeline, Minimap, Record, Hover, Envelope, Spectrogram | Buena (Canvas)       | Amplia, requiere gesto inicial| Requiere gesto para audio   | BSD-3-Clause (ver repositorio)[^2] |
| audioMotion-analyzer   | Espectro FFT (barras/LED, radial, etc.)    | N/A (ESM)      | Filtros de ponderación, escalas (Bark/Mel), loRes, maxFPS | Muy alta (optimizable)| Buena; loRes recomendado; streams en vivo con limitaciones en Safari | Requiere gesto para audio; micrófono con permisos | Licencia abierta (ver repositorio)[^8] |
| p5.js + p5.sound       | Waveform, spectrum, creative coding        | N/A            | p5.sound (p5.FFT)             | Variable (depende de implementación) | Amplia; requiere validación empírica| Requiere gesto para audio; micrófono con permisos | Código abierto (p5.js) |
| D3 + Web Audio         | Barras, LED, osciloscopio, radial (SVG/Canvas) | N/A            | D3 (escalas, transiciones)    | Variable (control fino requiere ingeniería) | Amplia; posibles diferencias en Safari | Requiere gesto para audio; micrófono con permisos | Código abierto (D3.js) |
| Tone.js                | Síntesis, transporte (apoya visuales)      | N/A            | Synths, Sampler, Effects       | Alta (Web Audio nativo) | Amplia; requiere gesto inicial Tone.start()| Requiere gesto para audio   | Código abierto (Tone.js) |
| Three.js               | 3D audio-reactivo (WebGL shaders/partículas)| N/A            | Ejemplos oficiales            | Alta (GPU)           | Amplia; optimización necesaria | Requiere gesto para audio   | Código abierto (three.js) |
| SciChart.js / LightningChart JS | Gráficos de alto rendimiento (FFT, logging) | Sí/Var         | Módulos de charting           | Muy alta (optimizado) | Amplia; validar en móviles     | Requiere gesto para audio   | Comercial (varía por librería)[^36][^37] |

Recomendaciones por caso de uso:
- Reproductor con espectrograma y regiones de anotación: wavesurfer.js + plugins Spectrogram/Regions/Timeline[^4].
- Espectro FFT plug-and-play en tiempo real: audioMotion-analyzer con loRes y maxFPS ajustados[^7].
- Visualizaciones data-driven avanzadas: D3.js + Web Audio con Canvas/OffscreenCanvas[^17][^31].
- Visualizaciones 3D y experiencias inmersivas: Three.js + Web Audio, aplicando simplificación geométrica y control de postprocesos[^40][^41].
- Creative coding y educación: p5.js + p5.sound, con la tranquilidad de prototipar rápido y validar en dispositivos reales[^11].

Limitaciones conocidas y mitigaciones:
- Safari iOS con streams en vivo en audioMotion: fallback a archivos o MediaElement[^7].
- Métricas comparativas ausentes: realizar pruebas internas controladas con perfiles de dispositivos objetivo y documentar resultados.

## Recomendaciones, buenas prácticas y conclusiones

Mejores prácticas transversales:
- Inicialización condicionada por políticas de autoplay: siempre invocar Tone.start() o audioContext.resume() dentro de un gesto de usuario; preparar UI que solicite interacción cuando el estado del contexto sea “suspended”[^5][^21].
- Elección de fftSize y smoothing según caso: fftSize alto para detalle espectral y bajo para respuesta rápida; smoothing para estabilizar el espectro en dashboards y evitar parpadeo[^27][^35].
- Optimización de Canvas/WebGL: reducir resolución del lienzo, limitar maxFPS, usar loRes en pantallas HiDPI, y descargar dibujo con OffscreenCanvas + Worker en dispositivos de gama media/baja[^7][^31][^28][^33].
- Estrategias móviles: desactivar animaciones costosas, evitar SVG complejo en escenas intensivas, y usar escalas perceptivas cuando el objetivo sea la percepción humana (Mel/Bark)[^7].
- Seguridad y permisos: gestionar getUserMedia con explicaciones claras; cargar audio desde el mismo dominio o configurar CORS correctamente para evitar bloqueos en decodificación[^28][^19].

Stack recomendado por objetivo:
- Espectrograma de calidad con reproductor integrado: wavesurfer.js + plugins (Spectrogram, Regions, Timeline)[^4].
- Espectro FFT altamente configurable: audioMotion-analyzer con ajustes de fftSize, smoothing, maxFPS y loRes[^7][^8].
- Experiencia 3D inmersiva: Three.js + Web Audio API + shaders personalizados, con análisis del espectro para controlar uniforms[^40][^41].
- Dashboards y logging de audio de alto rendimiento: considerar SciChart.js o LightningChart JS como capa de visualización, conectadas a buffers y AnalyserNode[^36][^37][^19].

Cierre. Las bibliotecas evaluadas resuelven la mayoría de necesidades de visualización de audio en la web con un balance razonable entre rendimiento y facilidad de uso. Donde no existen métricas comparativas públicas, la recomendación es complementar este informe con pruebas empíricas en los dispositivos y navegadores objetivo, documentando latencia, estabilidad de FPS y uso de CPU antes de fijar compromisos en producción.

## Apéndices

Glosario breve:
- FFT (Fast Fourier Transform): algoritmo eficiente para calcular la Transformada Discreta de Fourier (DFT), que descompone una señal en sus componentes de frecuencia.
- STFT (Short-Time Fourier Transform): método que aplica FFT a ventanas cortas y solapadas de la señal, permitiendo una representación tiempo-frecuencia (espectrograma).
- Windowing (ventaneo): multiplicar la señal por una ventana (Hann, Hamming, Blackman) para reducir fugas espectrales al calcular FFT sobre segmentos.
- Bark/Mel: escalas perceptivas que aproximan la resolución de frecuencia del oído humano.
- smoothingTimeConstant: parámetro de AnalyserNode que controla el suavizado temporal de las magnitudes de frecuencia.
- fftSize: potencia de dos que determina la resolución en frecuencia del AnalyserNode; define el número de bins y la ventana temporal efectiva.

Recursos adicionales:
- Guías y ejemplos de Web Audio y visualizaciones en MDN[^19][^27][^33].
- Tutoriales prácticos con Canvas y Web Workers para visualizadores de audio[^28][^31].

## Brechas de información identificadas

- No se hallaron benchmarks comparativos estandarizados (FPS/CPU/memoria) entre bibliotecas bajo escenarios equivalentes.
- Métricas cuantitativas de compatibilidad móvil (latencia, estabilidad de FPS, consumo de batería) no están reportadas de forma uniforme.
- Documentación oficial de p5.sound sin secciones dedicadas a rendimiento; se recomiendan pruebas internas.
- El soporte exacto de Safari iOS para ciertos flujos (p. ej., streams en vivo en audioMotion) y su interacción con getUserMedia debe validarse por versión.
- Tamaño de bundle y cobertura de features de algunas librerías pueden cambiar según versión; se aconseja fijar versiones y medir footprint en cada proyecto.

---

## Referencias

[^1]: wavesurfer.js | Biblioteca de reproductor y forma de onda. https://wavesurfer.xyz/
[^2]: Repositorio GitHub de wavesurfer.js. https://github.com/katspaugh/wavesurfer.js
[^3]: Ejemplos oficiales de wavesurfer.js. https://wavesurfer.xyz/examples/
[^4]: Plugin Spectrogram de wavesurfer.js (documentación). https://wavesurfer.xyz/examples/#spectrogram
[^5]: Tone.js – Framework Web Audio (sitio oficial). https://tonejs.github.io/
[^6]: Documentación de la API de Tone.js. https://tonejs.github.io/docs/
[^7]: audioMotion-analyzer – Sitio oficial. https://audiomotion.dev/
[^8]: Repositorio GitHub de audioMotion-analyzer. https://github.com/hvianna/audioMotion-analyzer
[^9]: Documentación de audioMotion-analyzer. https://audiomotion.app/docs/
[^10]: Demos oficiales de audioMotion. https://audiomotion.dev/demo/
[^11]: Audio Visualization with p5.js (taller con ejemplos). https://js6450.github.io/audio-viz/index.html
[^12]: Referencia p5.FFT (p5.sound). https://p5js.org/reference/p5.sound/p5.FFT/
[^13]: p5.js Web Editor – Ejemplos de visualizaciones de sonido. https://editor.p5js.org/jonfroehlich/sketches/d2euV09i
[^14]: Audio Visualization in JavaScript with p5.js (Medium). https://nishanc.medium.com/audio-visualization-in-javascript-with-p5-js-cf3bc7f1be07
[^15]: D3.js – Sitio oficial. https://d3js.org/
[^16]: D3 by Observable (documentación y recursos). https://d3js.org/
[^17]: Visualizing Sound With D3 and Web Audio API (Medium). https://medium.com/swlh/visualizing-sound-with-d3-and-web-audio-api-435ffea88f30
[^18]: Audio Visualiser Using D3 (demo y explicación). https://alexzywiak.github.io/audio-visualiser-using-d3/index.html
[^19]: Web Audio API – MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
[^20]: AnalyserNode – MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
[^21]: Getting started with Web Audio API (web.dev). https://web.dev/articles/webaudio-intro
[^22]: Visualizations with Web Audio API – MDN. https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
[^23]: Advanced techniques: Creating and sequencing audio – MDN. https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques
[^24]: MDN Web Audio Examples (GitHub). https://github.com/mdn/webaudio-examples/
[^25]: Web Audio API 1.1 – W3C Specification. https://www.w3.org/TR/webaudio-1.1/
[^26]: Web Audio API Specification (Editorial). http://webaudio.github.io/web-audio-api/
[^27]: Visualizations with Web Audio API – MDN (patrones Canvas). https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
[^28]: Write an audio visualizer from scratch with vanilla JavaScript (LogRocket). https://blog.logrocket.com/audio-visualizer-from-scratch-javascript/
[^29]: Making an Audio Waveform Visualizer with Vanilla JavaScript (CSS-Tricks). https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/
[^30]: How to make an audio visualizer with HTML Canvas API (GeeksforGeeks). https://www.geeksforgeeks.org/html/how-to-make-an-audio-visualizer-with-html-canvas-api/
[^31]: Using Web Workers – MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
[^32]: OffscreenCanvas – MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
[^33]: Visualizations with Web Audio API – MDN (patrones de optimización). https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
[^34]: Creating Audio-Reactive Visuals with Dynamic Particles in Three.js (Codrops). https://tympanus.net/codrops/2023/12/19/creating-audio-reactive-visuals-with-dynamic-particles-in-three-js/
[^35]: Spectral Analysis in JavaScript (Scribbler). https://scribbler.live/2023/08/21/Spectral-Analysis-using-JavaSript.html
[^36]: JavaScript Audio Analyzer FFT Example (SciChart.js Demo). https://www.scichart.com/example/javascript-chart/javascript-audio-analyzer-fft-example/
[^37]: Audio Signal Visualization of MP3 Data with LightningChart JS (Blog). https://lightningchart.com/blog/audio-signal-visualization/
[^38]: Real-time processing Web Audio API (Stack Overflow). https://stackoverflow.com/questions/15678194/real-time-processing-web-audio-api
[^39]: Understanding Audio Frequency Analysis in JavaScript (AddPipe Blog). https://blog.addpipe.com/understanding-audio-frequency-analysis-in-javascript-a-guide-to-using-analysernode-and-getbytefrequencydata/
[^40]: three.js examples (incluye webaudio visualizer). https://threejs.org/examples/
[^41]: Coding a 3D Audio Visualizer with Three.js, GSAP & Web Audio API (Codrops). https://tympanus.net/codrops/2025/06/18/coding-a-3d-audio-visualizer-with-three-js-gsap-web-audio-api/
[^42]: WebRTC Browser Support 2025 (Ant Media). https://antmedia.io/webrtc-browser-support/
[^43]: Spectral Analysis Notebook (Scribbler App). https://app.scribbler.live/?jsnb=./examples/spectral-analysis.jsnb