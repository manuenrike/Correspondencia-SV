# Segunda pasada de refinamiento visual

Fecha: 3 de noviembre de 2026. Alcance: presentación; sin cambios de reglas, persistencia ni estructura de expedientes.

## Defectos observados y correcciones

- Los KPI del directorio conservaban otra composición y caracteres tipográficos como iconos. Ahora comparten el componente de métricas, tamaños SVG y alineación de números con las bandejas, conservando los valores calculados existentes.
- Los correos de usuarios se partían al competir con las acciones. Las tarjetas separan identidad y correo de la fila de estado/acciones. En la comprobación a 375 px los cinco correos de ejemplo quedaron en una sola línea.
- Las acciones de ventanillas se desbordaban a una segunda fila por falta de espacio. Se compactaron los controles de administración con puntero fino y se mantuvieron 44 px en móvil o con puntero táctil.
- Las búsquedas secundarias reservaban espacio para iconos ausentes. Se unificaron SVG, centrado vertical, separación del texto y botón Limpiar. El filtro puede utilizar el ancho restante sin competir con un botón sobredimensionado.
- A 1024 px el breadcrumb y el espacio de trabajo competían con la cuenta. El header compacto elimina el prefijo redundante y mantiene el contexto institucional en la barra lateral.
- Se corrigió la especificidad que reducía el asunto del expediente; asuntos y revisión utilizan 20 px, títulos de diálogo 24 px y confirmaciones 20 px. Se normalizaron radios e iconos de metadatos y acciones.
- La selección del tipo de envío usa dos opciones equilibradas, iconos del sistema y acciones alineadas. Las acciones repetidas de Continuar en borradores tienen menor peso que la acción primaria de página.
- Edición, revisión, documentos enviados y adjuntos de respuesta comparten composición. Los tamaños pequeños se presentan en KB para evitar «0.00 MB»; tamaños grandes en MB, sin modificar archivos ni límites.
- La revisión marca los dos primeros pasos como completados y mantiene la etapa actual. Se aumentó la legibilidad del indicador móvil.
- Se unificaron la zona de adjuntos de respuesta, el foco de error, los hover y la separación del formulario de alta de usuarios. Se eliminó la sombra del enlace de salto mientras está fuera de pantalla y se acotó el scroll del menú de cuenta en pantallas bajas.

## Verificación visual ejecutada

Se capturaron pantallas antes y después con Edge headless, a 1440 y 375 px de ancho y 1000 px de alto. Se revisaron capturas ampliadas y vistas de conjunto de:

- Dashboard, bandejas institucional y ciudadana, borradores y directorio.
- Cuenta, menú móvil, selección de envío y confirmación destructiva.
- Edición de institución, ventanillas, usuarios, edición/alta de usuario y respaldos.
- Tres etapas del envío institucional y ciudadano, documentos y descargo.
- Expedientes pendientes, recibidos con conversación y rechazados, incluidas capturas tras desplazar los diálogos largos hasta su parte inferior.
- Muestras de hover primario, foco, campo inválido y toast de éxito/error.

Se inspeccionó adicionalmente el header a 1024 px. Las capturas se conservan localmente en `artifacts/visual-polish/`, excluido de Git. Los expedientes y PDF empleados son muestras creadas únicamente en un contexto de navegador aislado.

## Verificación automatizada

- 98 comprobaciones adicionales: cinco vistas principales y nueve diálogos a 320, 375, 390, 430, 768, 1024 y 1440 px, sin desbordamiento horizontal ni errores JavaScript.
- `tests/phase1.cjs`: aprobado — envío, rollback, doble envío, generación PDF/QR, recepción, rechazo y Escape.
- `tests/phase2.cjs`: aprobado — dashboard, 49 combinaciones responsive, controles y movimiento reducido.
- `tests/window-scope.cjs`: aprobado — adjuntos, bandejas y acciones por ventanilla, documentos, borradores y compatibilidad histórica.
- `tests/premium-ui.cjs`: aprobado — menú móvil, foco/Escape, selector de espacio, nombres accesibles, errores, guardado y confirmaciones.
- Sintaxis de los scripts y `git diff --check`: verificados antes de la entrega.

Los cambios de JavaScript se limitan a markup, iconos, composición compartida y formato de tamaños. No se alteraron los procesos de envío, revisión documental, decisiones, QR, respaldo ni alcance por ventanilla.

## Límites de esta revisión

Las comprobaciones automáticas de tamaño no son inspecciones visuales de cada combinación. La inspección visual se efectuó en las capturas y anchos indicados. El marco del visor PDF fue capturado, pero el contenido nativo del iframe apareció en blanco en Edge headless: requiere revisión visual en un navegador interactivo. Las regresiones sí comprobaron la generación de PDF/QR y el ciclo de apertura/cierre del visor.

No se ejecutó una nueva auditoría con lector de pantalla ni pruebas en dispositivos físicos. Esta pasada no certifica WCAG completa ni sustituye aceptación institucional.
