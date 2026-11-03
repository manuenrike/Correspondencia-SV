# Correcciones de adjuntos, revisión y visibilidad por ventanilla

Fecha: 3 de noviembre de 2026.

## Problemas confirmados

- El botón de eliminar un adjunto producía `files.splice is not a function`: el manejador inline resolvía `files` como el input del formulario, en lugar del arreglo de documentos.
- El listado y las acciones estaban limitados por institución, pero no por ventanilla. Por ello un usuario de Gestión documental podía ver correspondencia dirigida a Correspondencia general.
- La revisión repetía el número de paso y agrupaba datos distintos en textos con barras. Las flechas nativas de los selects y el selector de archivos no tenían la misma presentación que los demás controles.

## Cambios

- `app.js`: eliminación delegada por identificador de documento, actualización del borrador y restauración del foco. Los archivos retirados dejan de formar parte del borrador; no se destruyen originales en IndexedDB ni documentos de expedientes enviados. La carga asíncrona mantiene referencia al borrador de origen, para evitar adjuntar a otro formulario si se cierra durante la carga.
- `window-scope.js`: política compartida por institución y ventanilla de origen/destino, usada en bandejas, búsquedas, contadores, borradores, detalle, recepción, rechazo, conversación y resolución de documentos. Los usuarios de una misma ventanilla comparten el acceso. No cambia formatos persistidos; los registros históricos sin ventanilla se interpretan en General o en la primera ventanilla disponible.
- `audit.js`: cambio de sesión actualiza la vista y muestra la ventanilla activa; decisiones comprueban el destino completo.
- `pdf-auth.js` y `replies.js`: resolución de documentos y conversación respetan el alcance por ventanilla.
- `ui.js`: resúmenes compartidos de remitente/destino y datos separados para tipo de documento, modalidad, prioridad y respuesta; contador de recepción por ventanilla.
- `layout.css` y `theme.css`: progreso más sencillo sin encabezado duplicado, adjuntos compactos con papelera, flechas consistentes conservando selects nativos y adaptación móvil de la revisión.
- `index.html`: nuevo módulo y versiones de los recursos modificados para despliegue.

## Verificación

Pruebas en Edge headless, con contextos aislados y PDF generado para pruebas:

- `tests/window-scope.cjs`: elimina un documento mediante clic real, verifica metadatos persistidos y reapertura sin el adjunto, vuelve a adjuntar y envía con QR. Comprueba ventanilla correcta e incorrecta mediante los selectores de sesión, búsqueda, contador, detalle, acceso documental, aceptación, rechazo y habilitación de conversación. Comprueba origen, usuarios de la misma ventanilla, borradores y compatibilidad histórica. Incluye comprobaciones de alcance para correspondencia ciudadana y revisión en siete anchos.
- `tests/phase1.cjs`: regresión de envío, rollback de persistencia, doble envío, PDF/QR, recepción, rechazo y Escape.
- `tests/phase2.cjs`: regresión del dashboard y 49 combinaciones responsive.
- Inspección visual de adjuntos en escritorio y revisión en escritorio y 320 px. Los datos de prueba se crean únicamente en el perfil aislado del navegador.

La visibilidad sigue siendo una regla de la demostración en el navegador. El respaldo completo y el almacenamiento local no se convierten en un sistema de autorización de servidor. Continúan pendientes las verificaciones con lector de pantalla y dispositivos físicos indicadas en los informes anteriores.
