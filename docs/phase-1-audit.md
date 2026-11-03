# Fase 1: auditoría y correcciones

Fecha: 3 de noviembre de 2026. Alcance: funcionalidad y accesibilidad; sin Fase 2, cambios de esquema, commits ni publicación.

## A. Hallazgos confirmados

- Alta: `show()` carecía de título accesible, foco inicial, confinamiento, aislamiento del fondo y restauración del foco. Los visores superpuestos tampoco compartían el ciclo de teclado; Escape podía cerrar el formulario inferior.
- Alta: un fallo de `save()` después de incorporar un envío dejaba el registro en memoria y retiraba el borrador. Reintentar podía duplicarlo. Ya existía un bloqueo contra clics simultáneos; se conserva.
- Media: el indicador de envío nunca activaba Revisión. El paso persistido se limitaba a 0–1 al reabrir.
- Media: reconstruir los campos del descargo invalidaba el correo de demostración al regresar desde revisión.
- Media: errores de requisitos documentales solo mediante toast; búsquedas, filtros y selectores PDF sin nombre accesible; filtros de bandeja sin estado anunciado.

## Inspección y conservación

Se leyeron README y el sistema de diseño. `index.html` carga únicamente `layout.css` y `theme.css`. Las hojas `styles`, `design`, `palette`, `refinement` y `responsive`, y el script `responsive.js`, son históricos y no se eliminaron. No se encontró otro informe preliminar en el repositorio; los hallazgos se contrastaron directamente con el código.

`app.js` reúne catálogos, sesión simulada, formularios, borradores, expedientes y decisiones. `send-flow.js` agrupa y valida las etapas. `ui.js` produce tarjetas y componentes visuales. `audit.js` conserva responsables y reglas de decisiones; `replies.js` controla conversación, adjuntos y cierre por ausencia de respuesta requerida. `document-actions.js` controla descargas; `pdf-auth.js` conserva originales y genera copias con QR mediante bibliotecas locales. `backups.js` exporta metadatos y blobs y valida archivos antes de restaurar. `confirmations.js` ya empleaba un diálogo nativo con cancelación y foco.

Los metadatos y borradores siguen en localStorage y los PDF originales y derivados en IndexedDB. El envío pasa por información, destino/documentos y revisión; solo la confirmación genera los QR. Recepción y rechazo conservan evento y responsable. Los expedientes ciudadanos siguen sin conversación. No se modificaron identidades de prueba, límites documentales, esquema persistido ni reglas de respuesta.

## B. Cambios

- `modal-accessibility.js`: ciclo compartido para overlays, títulos únicos, foco, Tab/Shift+Tab, Escape, fondo inert y visores superpuestos. Se mantienen los overlays existentes para limitar el impacto; las confirmaciones siguen usando `<dialog>` nativo.
- `app.js`: integración modal, revisión identificada como tercer paso, regreso explícito a documentos, validación de correo conservada al reconstruir, nombres accesibles, estado de navegación y filtros. El envío copia metadatos documentales, revierte cambios en memoria si falla persistencia y bloquea controles mientras procesa.
- `send-flow.js`: errores textuales asociados mediante aria-describedby/aria-invalid, foco al campo y reapertura de revisión después de validar requisitos.
- `replies.js`: nombre accesible del selector PDF.
- `backups.js`: liberación del fondo al finalizar restauración.
- `index.html`: carga del módulo compartido; `theme.css`: foco visible y presentación de errores. Sin rediseño.
- `tests/phase1.cjs`: regresión reproducible con Playwright, contexto aislado y datos de prueba efímeros.

## C. Resultados

El indicador coincide con la revisión real, el retroceso conserva la validación del descargo y el borrador puede reabrirse en revisión. Los errores aparecen junto al control. Los overlays comparten navegación por teclado y el PDF se cierra sin cerrar el expediente. El reintento tras fallo de almacenamiento conserva el borrador sin dejar un envío parcial en memoria.

## D. Verificaciones ejecutadas

Se usó Edge instalado, en modo headless y con perfiles aislados; no se tocaron los datos del perfil del usuario.

- Sintaxis de los once scripts propios: correcta.
- Regresión automatizada: aprobada. Creación institucional, validación obligatoria, carga de PDF generado, revisión, cuota simulada, rollback, doble invocación de envío, QR versión 3, recepción, rechazo justificado, visor PDF superpuesto y Escape.
- Flujo ciudadano adicional en navegador: aprobado. Identidad simulada, correo/código de demostración, PDF, retroceso conservando validación, cierre/reapertura de borrador en revisión y confirmación. Sin errores JavaScript en la ejecución final.
- Teclado: foco dentro del modal con Tab y Shift+Tab, Escape y liberación de inert comprobados. Restauración usa el disparador original o su acción equivalente si render() reemplazó el nodo.
- Anchos 320, 375, 390, 430, 768, 1024 y 1440: sin desbordamiento horizontal del documento en las vistas probadas. No equivale a revisión visual exhaustiva.
- `git diff --check`: sin errores de espacios; Git informa únicamente normalización LF/CRLF.

Ejecución: `node tests/phase1.cjs`, con Playwright disponible y navegador instalado. Opcional: `BROWSER_PATH` con la ruta del ejecutable. En esta sesión se empleó el runtime ya disponible, sin instalar dependencias.

## E. Limitaciones y pendientes

No se certifica conformidad WCAG 2.2 AA completa. Pendientes: lector de pantalla, contraste exhaustivo, revisión visual de todas las vistas, controles táctiles, impresión física del descargo, firma escaneada, conversación con adjuntos de respuesta, respaldo/restauración mediante carpeta real y navegación dentro del visor PDF nativo (incluido Escape desde el iframe). Se comprobó la inserción del iframe y los metadatos de generación QR; no se escaneó el QR con un dispositivo externo ni se verificó visualmente cada página del PDF.

No se implementa seguridad de producción. Siguen pendientes autenticación, autorización por rol/institución, persistencia centralizada, almacenamiento documental seguro, auditoría verificable, hashes de integridad, verificador público QR, firma electrónica e integraciones reales.

La Fase 2 requiere autorización del usuario. No se hicieron commits, push ni merge.
