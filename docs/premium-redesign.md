# Rediseño premium — informe A–F

Fecha: 3 de noviembre de 2026.

## A. Diagnóstico visual

El diseño anterior conservaba un bloque principal similar a una cabecera promocional, controles predominantemente redondos, métricas y metadatos con distintas escalas, y navegación móvil horizontal. Las hojas activas acumulaban reglas históricas y sobrescrituras que dificultaban prever el resultado de cada componente. Los estados documentales se presentaban mayormente neutros y las bandejas ocupaban varias columnas de tarjetas, con menor facilidad de comparación en escritorio.

Se inspeccionaron README, index, sistema de diseño, estilos activos y componentes generados por app/ui. Se conservaron las correcciones recientes de adjuntos y ventanillas y todos los módulos documentales.

## B. Sistema visual

Se consolidaron `layout.css` y `theme.css` en secciones legibles por responsabilidad y se definieron tokens de color, tipografía, espacio, radio, sombras y movimiento. Paleta gris azulada, blanco y azul `#2563eb`, texto `#0f172a`, estados suaves con texto/icono. Campos y botones rectangulares de bordes suaves; confirmaciones destructivas claramente rojas. Contrastes principales medidos y documentados en `design-system.md`.

Las hojas históricas no se eliminaron. No se añadieron frameworks ni paquetes.

## C. Layout

`index.html` se formateó y reorganizó manteniendo identificadores, selectores de sesión y scripts existentes. Sidebar compacto con espacio activo, directorio y respaldos; header con breadcrumb y cuenta; enlace para saltar al contenido. En móvil se usa un diálogo nativo que contiene el sidebar real, sin duplicar menús ni datos de sesión.

`presentation.js` contiene exclusivamente apertura, cierre, restauración de navegación, acceso al selector de espacio y atajos del dashboard. El estado de `aria-expanded` se sincroniza incluso al pulsar Escape.

## D. Dashboard y bandejas

`app.js` y `ui.js` cambian únicamente composición y texto de interfaz: KPI con iconos SVG, números reales de la ventanilla y contexto; centro de recepción compacto; filas de expedientes en escritorio y tarjetas en móvil. Cada expediente distingue asunto, dirección, tipo, institución, fecha, identificador, prioridad, documentos, estado y respuesta. Búsqueda con icono, filtros alineados y pestañas subrayadas.

El atajo de pendientes abre la bandeja correspondiente al tipo del primer expediente pendiente real. No inventa tendencias ni modifica estados.

## E. Formularios y modales

Formularios alineados, bordes y foco distinguibles, mensajes de error junto al campo, documentos compactos y pie de acciones fijo dentro del scroll. `send-flow.js` anuncia paso actual y completado, y el guardado informa «Guardando cambios», «Borrador guardado» o el error según el resultado existente de persistencia.

En el detalle se reordena solo la presentación: contenido/documentos, eventos de auditoría y respuestas. No se cambian los registros, responsables, mensajes ni sus fechas. Se conservan el manejo del foco y los visores PDF superpuestos.

## F. Verificación y refinamiento

Se realizaron inspecciones visuales mediante capturas de dashboard vacío, bandejas con expedientes temporales de distintos estados, menú móvil, respaldos y formulario ciudadano. Las muestras se crearon en contextos aislados de prueba, nunca como datos del producto.

Pruebas ejecutadas en Edge headless:

- `tests/phase1.cjs`: creación, validación, envío, fallo de persistencia, rollback, doble envío, PDF/QR, recepción, rechazo, Escape y tamaños.
- `tests/phase2.cjs`: dashboard con datos y 49 combinaciones de vista/ancho sin desbordamiento horizontal; control Continuar y movimiento reducido.
- `tests/window-scope.cjs`: eliminación de adjuntos persistida, visibilidad por institución/ventanilla, búsqueda, contadores, documentos, detalle, decisiones, chat, borradores y datos históricos.
- `tests/premium-ui.cjs`: menú móvil a 320, 375, 390, 430 y 768 px, navegación y restauración del sidebar, foco y Escape, selector de espacio, nombres de campos, error visual/textual, autoguardado, atajo ciudadano y cancelación de confirmación destructiva.
- Flujo ciudadano adicional: identidad de prueba, documento y descargo físico PDF, revisión y envío; ambos documentos con QR versión 3, sin errores JavaScript.
- Conversación institucional adicional: envío con respuesta requerida, aceptación, respuesta con PDF y QR, cambio a la institución de origen y respuesta final sin requerimiento adicional; dos mensajes, cuatro eventos, historial conservado y conversación cerrada, sin errores JavaScript.
- Sintaxis de todos los scripts propios y revisión de espacios del diff antes de entregar.

## Alcance y limitaciones

No se cambiaron persistencia, esquema, respaldos, generación de QR, autenticación simulada, reglas de recepción/rechazo/respuesta ni alcance por ventanilla. Los cambios de JavaScript se limitan a presentación, navegación y feedback del guardado existente.

Pendientes: revisión con lector de pantalla y dispositivos táctiles reales, todas las variantes de contraste y contenido, impresión física, escaneo externo de QR y restauración desde una carpeta real. Las verificaciones no certifican WCAG 2.2 AA completa.

La autorización previa del usuario permite enviar directamente los cambios a GitHub; el push y la publicación efectiva se verifican por separado.
