# Correspondencia SV — auditoría y mejoras operativas

Fecha: 3 de noviembre de 2026. Rama: `feature/ux-ui-operational-improvements`.

## A. Auditoría previa

Se revisaron la estructura del repositorio, README, todos los documentos de `docs/`, las cuatro pruebas existentes y los módulos activos. Solo `layout.css` y `theme.css` se cargan desde `index.html`; las cinco hojas históricas permanecen conservadas y sin carga. La aplicación mantiene HTML, CSS y JavaScript nativo, metadatos en localStorage y PDF en IndexedDB.

| Prioridad | Hallazgo previo | Resolución |
| --- | --- | --- |
| Crítica | El acceso a pendientes abre un único tipo de bandeja; no reúne recepciones y respuestas de la ventanilla. | Proyección «Por atender» con los mismos controles de acceso existentes. |
| Alta | Solo se combinan dirección, búsqueda y estado de recepción. | Fechas, prioridad, documento, institución, respuesta, tipo de correspondencia y orden. |
| Alta | «Recibidas» describe la dirección incluso cuando aún no se confirmó la recepción. | Dirección «Entrante» separada del estado «Pendiente de recepción» o «Recibido». |
| Alta | La finalización de la conversación solo se explica dentro del detalle. | Etiqueta textual «Conversación finalizada» en listado y detalle. |
| Alta | «Lo más reciente» ordena por creación, aunque haya decisiones o respuestas posteriores. | Actividad reciente ordenada por la fecha real de los eventos. |
| Media | El detalle muestra las acciones al final del expediente. | Aviso inicial enlazado a la acción existente y permitida. |
| Media | El formulario no marca todos los campos obligatorios y valida un error por intento. | Marcadores, explicación, errores asociados y resumen enlazado cuando hay varios. |

Las cuatro suites existentes se ejecutaron antes de modificar la aplicación y aprobaron. No se encontraron fallos funcionales previos en esas suites. No hay migraciones ni cambios en los estados persistidos.

## B. Instalación y aplicación de UI UX Pro Max

Se utilizó el mecanismo oficial de Codex, `skill-installer/scripts/install-skill-from-github.py`, con:

```text
--repo nextlevelbuilder/ui-ux-pro-max-skill --path .claude/skills/ui-ux-pro-max
```

Origen: [UI UX Pro Max oficial](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill). La instalación global completa está en `C:/Users/Enrique/.codex/skills/ui-ux-pro-max/`: `SKILL.md`, `data/`, `references/` y `scripts/`. No fue necesario duplicarla en `.agents/` ni añadir archivos de herramientas al sitio. Codex podrá descubrirla automáticamente en el próximo turno; en esta ejecución se leyó directamente desde la instalación.

El primer intento con `python` falló porque Windows lo resolvía al alias de Microsoft Store. Se repitió el instalador con el Python ya incluido en Codex:

```text
C:/Users/Enrique/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe
```

Resultado: instalación correcta y buscador Python ejecutado correctamente, sin instalar Python, paquetes ni dependencias del proyecto. Se leyeron `SKILL.md`, `references/quick-reference.md` y `references/pro-rules.md` completos. La segunda referencia aclara que su checklist está orientado a aplicaciones móviles nativas; se aplicaron a esta web los criterios pertinentes de teclado, contraste, feedback, reflujo y etiquetas. No se impusieron unidades ni patrones de iOS/Android.

Consultas ejecutadas mediante la ruta absoluta de `scripts/search.py`:

| Consulta / modo | Resultado verificado y decisión |
| --- | --- |
| `government document operations dashboard --design-system` | Estilo Accessible & Ethical pertinente; patrón Enterprise Gateway comercial descartado. |
| `internal operations dashboard --design-system` | Estilo Minimalism & Swiss Style pertinente; el patrón volvió a ser comercial. No se encontró un patrón operativo verificado en estas dos consultas: se aplicaron las reglas generales y el diseño existente como referencia. No se persistieron resultados comerciales. |
| `enterprise dashboard minimal --domain style` | Una coincidencia: Minimalism & Swiss Style, aplicable a herramientas empresariales; se tomó jerarquía, claridad y sobriedad, conservando tokens y radios existentes. |
| `combined filters search results --domain ux` | No Results: ayuda para ajustar búsqueda ante resultados vacíos. Autocomplete no se consideró necesario. |
| `focus not obscured --domain ux` | Distinción entre requisito mínimo AA y mejorado AAA; padding de desplazamiento en diálogos y acceso a acciones. |
| `error summary validation --domain ux` | Focusable Error Summary, Error Messages y Error Placement: resumen con foco/enlaces y errores junto a sus controles. |
| `live badge count screen reader --domain ux` | Contextual Live Badge Updates: un estado contextual para los resultados; los números del menú no crean múltiples regiones en vivo. |

Stack detectado: HTML5/CSS3/JavaScript nativo. La skill no ofrece un stack específico para este conjunto; se usaron sus reglas independientes del stack. No se aplicó `html-tailwind`, ni se incorporó Tailwind, otra tipografía, paleta, librería de iconos o animaciones.

## C. Criterios de implementación

### Por atender

`inbox.js` es una proyección de lectura: no registra turnos nuevos ni modifica permisos. Siempre comienza con `canAccessCorrespondence`.

- Recepción: estado `pending` y `isWindowRecipient` verdadero.
- Respuesta: `canReplyToCorrespondence` verdadero, requerimiento vigente y último mensaje con requerimiento emitido por la contraparte. Para el envío inicial se considera el remitente; para mensajes históricos se usa `institution` o `actor.institutionId`.
- Un último requerimiento emitido por la propia institución espera a la contraparte y no se incluye.
- Un mensaje histórico cuyo emisor no puede determinarse no establece una obligación inferida. Sigue visible en su bandeja habitual y conserva todos los permisos anteriores.
- Rechazos, conversaciones finalizadas, correspondencia ciudadana aceptada y expedientes de otras ventanillas quedan fuera.

La obligación de respuesta es una interpretación visual del emisor y requerimiento existentes. El chat sigue permitiendo las acciones anteriores a las dos partes mientras esté abierto; no se introdujo bloqueo por turnos. Se mantiene la resolución histórica de ventanillas de `window-scope.js`.

### Filtros y dashboard

Los filtros se combinan mediante intersección. «Fecha de envío desde/hasta» compara días locales, incluyendo el día final completo; no se presenta como fecha de recepción o última actividad. Un rango invertido muestra un error y cero resultados. La búsqueda incluye asunto, código, institución y ciudadano registrado. Tipo de documento e instituciones se obtienen de los registros accesibles; la prioridad solo filtra valores existentes, sin inventar prioridades para registros antiguos.

«Más filtros» reduce la carga inicial. Los filtros activos se conservan al consultar y cerrar un detalle. «Limpiar filtros» reinicia búsqueda, dirección, estado y filtros adicionales, conservando la ubicación «Por atender» si está activa. Cambiar institución o usuario limpia los criterios para evitar filtros heredados de otro contexto. El contador de resultados se anuncia con una frase completa, sin mover el foco.

Dashboard: los cuatro KPI mantienen sus cálculos reales; el centro operativo muestra recepción y respuesta por atender. La actividad utiliza exclusivamente `events[].at` y `events[].text` de expedientes accesibles, con enlace al detalle. No se fabrican eventos para registros antiguos sin historial ni tendencias.

Refinamiento solicitado tras la revisión: se retiró el bloque duplicado de creación del dashboard. El botón «+ Nueva correspondencia» del encabezado conserva la selección de envío institucional o ciudadano. El resumen «Por atender» ocupa todo el ancho disponible y mantiene su acceso a pendientes.

### Formularios y detalle

Se reutilizan las secciones, validaciones nativas y las comprobaciones de identidad, PDF y descargo. Un fallo con varios campos muestra todos los errores pertinentes del paso y mueve el foco al resumen; con uno, al control. Se conservan las ayudas en `aria-describedby` al retirar el error. «Guardar borrador» llama al mismo guardado existente; no crea otra persistencia. Atrás, Continuar, Revisar envío y Confirmar envío mantienen su función por etapa.

El detalle conserva identificador, asunto, ruta institucional, ventanillas, fecha, prioridad, adjuntos, seguimiento y conversación. El aviso de acción inicial lleva al botón existente de recepción o al campo de respuesta. No ejecuta una decisión por sí solo. Las conversaciones finalizadas no adquieren acciones nuevas.

## D. Verificación ejecutada

Entorno: Microsoft Edge headless instalado, Playwright y Node/Python ya disponibles en Codex. Perfiles aislados; no se tocaron los datos del navegador del usuario. Las pruebas documentales usan un origen localhost temporal; las demás también verifican apertura como archivo local.

| Suite | Resultado / cobertura |
| --- | --- |
| `tests/phase1.cjs` | Aprobada: validación, envío, fallo simulado de almacenamiento, rollback, doble envío, QR, recepción, rechazo y Escape en PDF. |
| `tests/phase2.cjs` | Aprobada: dashboard con datos, 49 combinaciones de vista/ancho, controles principales y movimiento reducido. |
| `tests/window-scope.cjs` | Aprobada: adjuntos eliminados persistentes, origen/destino por ventanilla, documentos, decisiones, conversación, usuarios compartidos, borradores y registros históricos. |
| `tests/premium-ui.cjs` | Aprobada: menú móvil, Tab/Shift+Tab, Escape, selector, campos accesibles, autoguardado, acceso ciudadano desde «Por atender» y confirmaciones destructivas. Se actualizó únicamente la expectativa del destino del atajo. |
| `tests/operational-ui.cjs` | Aprobada: obligaciones reales y emisores ambiguos, filtros combinados, fechas locales hasta medianoche, orden, limpieza, resultados vacíos, actividad, contexto, acciones del detalle, contraste de las etiquetas de estado/atención, foco libre de notificaciones, resumen de errores y recuperación de borrador. Seis vistas y detalle a 320, 375, 390, 768, 1024 y 1440 px; paisaje 720 × 450. |
| `tests/document-regression.cjs` | Aprobada: PDF original idéntico a sus bytes de entrada; copia con QR, dos páginas y pie reservado; adjuntos de respuesta, borrador de respuesta, cierre bilateral; flujo ciudadano con PDF de descargo y correo de demostración; recuperación en revisión; respaldo/restauración de registros, borradores y PDF. |

El respaldo se prueba con escrituras reales en OPFS y archivos JSON/PDF leídos por las funciones existentes. Se vacía el almacén IndexedDB de documentos antes de restaurar para comprobar que los blobs se recuperan del respaldo. Solo se reemplazan el selector de carpeta y la consulta de permisos del navegador. Esto verifica serialización, restauración y acceso a blobs, pero no constituye una prueba del selector nativo o de permisos en una carpeta del escritorio.

Se ejecutan las suites con `node tests/run.cjs`, disponiendo de Playwright y, si se requiere, `BROWSER_PATH` para el navegador. `NODE_PATH` puede apuntar a la instalación existente de módulos. No hay dependencias de ejecución nuevas para el sitio.

Pasada final: seis suites aprobadas, sin errores JavaScript capturados en los navegadores de prueba. `node --check` aprobó los catorce scripts propios de la raíz y `git diff --check` no reportó errores de espacios; únicamente avisos de normalización LF/CRLF de Git en Windows.

### Capturas y revisión visual

Capturas con el mismo conjunto sintético y contextos aislados, a 1440 y 375 px:

- [Dashboard anterior](../artifacts/operational/before-dashboard-1440.png) / [dashboard actualizado](../artifacts/operational/after-dashboard-1440.png).
- [Bandeja anterior](../artifacts/operational/before-tray-1440.png) / [bandeja actualizada](../artifacts/operational/after-tray-1440.png).
- [Bandeja móvil anterior](../artifacts/operational/before-tray-375.png) / [bandeja móvil actualizada](../artifacts/operational/after-tray-375.png).
- [Por atender y filtros móviles](../artifacts/operational/after-filters-375.png), [detalle](../artifacts/operational/after-detail-1440.png) y [formulario móvil](../artifacts/operational/after-form-375.png).

Las capturas son locales y están excluidas de Git por la regla existente `artifacts/`. `tests/capture-operational.cjs` reproduce las capturas finales. Se inspeccionaron visualmente dashboard, filtros, tarjetas y formulario. Durante esta fase se corrigieron un solapamiento nuevo del icono de búsqueda y un acento alterado al escribir el HTML. La primera ejecución de la prueba nueva también corrigió una expectativa errónea del fixture: hay tres recepciones aceptadas entrantes, no cuatro; la cuarta aceptada es saliente. No se cambió el cálculo del KPI.

## E. Checklist y límites

- Se mantiene la paleta de `theme.css`, Inter y sus alternativas sin conexión; SVG consistentes, foco visible, texto e iconos para los estados.
- Se conservan las tarjetas móviles, filas de escritorio, menú nativo, restauración de foco y Escape.
- Nuevos filtros con etiquetas visibles y controles de 44 px; requerimientos y errores asociados a controles; movimiento reducido respetado.
- Sin backend, autenticación, frameworks, nuevas dependencias, cambios de esquema ni alteraciones de recepción, rechazo, conversación, PDF/QR, identidad o descargo.
- El conteo del menú se actualiza al guardar decisiones o respuestas, incluso con el detalle abierto.
- No se afirma cumplimiento integral WCAG 2.2 AA. Pendientes: lector de pantalla humano, zoom nativo del navegador, contraste exhaustivo de todas las variantes, dispositivos táctiles reales, interacción interna del visor PDF, impresión/firma física y lectura del QR con dispositivo externo.
- Se detectó que las notificaciones flotantes preexistentes podían cubrir controles con foco. Ahora cambian de borde cuando es necesario para dejar visible el control enfocado; se verificó el foco en el pie del formulario y en su botón de cierre. Los estados estables se capturan tras desaparecer la notificación. No se certifican todas las combinaciones posibles de contenido y tamaño.
- La prueba de paisaje/reflujo no se presenta como prueba de zoom nativo ni de Dynamic Type. No existe tema oscuro; su checklist no se aplica.

La instalación de la skill fuera del repositorio no modifica la configuración de la aplicación. No se hizo push ni merge; los cambios quedan en la rama de trabajo para revisión.

## Archivos del cambio

Aplicación: `inbox.js` (nuevo), `app.js`, `ui.js`, `audit.js`, `presentation.js`, `send-flow.js`, `index.html`, `layout.css`, `theme.css`.

Pruebas: `tests/operational-fixture.cjs`, `tests/operational-ui.cjs`, `tests/document-regression.cjs`, `tests/run.cjs`, `tests/capture-operational.cjs` (nuevos) y `tests/premium-ui.cjs` (expectativa del atajo).

Documentación: este informe, README y `docs/design-system.md`.
