# Correspondencia SV

Abre `index.html` en Edge o Chrome para usar la aplicación sin instalación

## Publicación en Hostinger mediante GitHub

El sitio es estático: el punto de entrada es `index.html` en la raíz del repositorio. No requiere compilación, Node.js ni instalación de dependencias en el servidor. Publica los archivos de la raíz y conserva la carpeta `vendor/` con las bibliotecas PDF y QR, además de `modal-accessibility.js`.

En la conexión Git de Hostinger, utiliza este repositorio y la rama `main`. Después de enviar los cambios a GitHub, ejecuta el despliegue desde Hostinger si la conexión no tiene despliegue automático habilitado. Mantén HTTPS habilitado para las funciones de acceso a carpetas del navegador. Las versiones de los recursos modificados en `index.html` se actualizan para evitar que el navegador reutilice las copias anteriores.

Tras publicar, verifica creación, revisión, envío, PDF con QR y cierre de modales con Escape. La aplicación continúa guardando datos por navegador y origen: los datos del archivo local, otro dominio o HTTP no aparecen automáticamente en el sitio HTTPS. Para trasladarlos utiliza el respaldo con su carpeta de documentos.

## Diseño y adaptación

La interfaz usa tarjetas en lugar de tablas para correspondencias, borradores, instituciones, ventanillas y usuarios. Cada expediente muestra su asunto, estado, requisito de respuesta, destino, fecha y adjuntos. Se conservan los filtros y las acciones existentes. Las tarjetas pasan a una columna en teléfonos, los formularios y modales se adaptan a la pantalla y las animaciones respetan la preferencia de movimiento reducido

El estándar visual sigue [Dock](docs/design-system.md). `layout.css` contiene la distribución sin colores y `theme.css` es la única paleta activa. Se utiliza fondo crema, texto oscuro, botones de cobalto y una sola familia tipográfica. Los estilos históricos ya no se cargan. Se mantienen tarjetas compactas, adaptación móvil y movimiento reducido

El envío se organiza mediante `send-flow.js` en tres pasos: Información, Destino y documentos, y Revisión. Cada paso valida sus campos; la correspondencia ciudadana también verifica identidad y descargo. Puedes retroceder sin perder datos o cerrar la ventana; el guardado del borrador es automático. El borrador conserva el paso actual. La verificación de identidad muestra un indicador de consulta y descarta resultados pendientes si se modifica el número o se cierra el formulario. El QR se añade únicamente al confirmar el envío

## Respaldo en ficheros locales

Pulsa **Respaldo** en el encabezado y luego **Conectar carpeta**. Selecciona una carpeta exclusiva y autoriza la escritura. El sistema guarda automáticamente `informacion.json` y una subcarpeta `documentos` con todos los PDF, incluyendo originales y copias con QR. También incluye borradores y respuestas pendientes. Puedes usar **Guardar ahora** y esperar el estado **Respaldo guardado** antes de cerrar

El navegador puede pedir reautorizar la carpeta después de volver a abrir el HTML. Usa **Respaldo → Conectar carpeta** o **Guardar ahora** para conceder el permiso. El guardado interno del navegador continúa funcionando aunque la carpeta esté desconectada

Para recuperar los datos en otro equipo o navegador, copia toda la carpeta y usa **Respaldo → Seleccionar respaldo para restaurar**. Confirma la sustitución de los datos actuales. Conserva juntos `informacion.json` y `documentos`; el JSON por sí solo no contiene los PDF. Esta función requiere Chrome o Edge con soporte para acceso a carpetas locales

Incluye correspondencia institucional y ciudadana, borradores automáticos, directorio de instituciones, ventanillas y usuarios, búsqueda instantánea, filtros, documentos PDF, revisión, recepción, rechazo justificado, conversación y seguimiento con fechas

Usa el selector de institución del encabezado para probar ambos lados de un envío

El selector **Usuario activo** permite elegir al usuario y su ventanilla dentro de la institución. Cada aceptación y rechazo guarda el identificador y nombre del usuario, institución, ventanilla, fecha, hora y motivo de rechazo. Estos datos se muestran en el seguimiento de correspondencia ciudadana e institucional y se conservan en los respaldos. Los eventos antiguos que no guardaron al responsable se indican como usuario no registrado. Es una sesión de demostración; el selector no sustituye una autenticación real

Las bandejas, búsquedas, contadores, borradores y acciones se limitan a la **ventanilla activa**. Un envío dirigido a Correspondencia general no aparece en Gestión documental, aunque ambas pertenezcan a la misma institución. Los usuarios de la misma ventanilla comparten sus expedientes; el remitente consulta los envíos desde su ventanilla de origen. Cambiar de usuario y ventanilla actualiza las bandejas inmediatamente. Los registros antiguos sin identificador de ventanilla se interpretan como pertenecientes a Correspondencia general (o a la primera ventanilla si esta no existe), sin modificar el respaldo ni los datos persistidos.

En el chat institucional, cada institución debe elegir si su mensaje requiere respuesta. La selección se guarda en cada mensaje y el estado general refleja la última selección. Enviar un mensaje con la casilla Requiere respuesta desmarcada finaliza la conversación para ambas instituciones: no se permiten nuevos mensajes ni adjuntos y se conserva todo el historial. La correspondencia inicial sin respuesta requerida tampoco habilita el chat al aceptarla. Tras la recepción inicial, cualquiera de las dos instituciones puede rechazar y cerrar la conversación indicando una justificación. El rechazo impide nuevos mensajes y conserva el historial, los documentos y el responsable del cierre. La correspondencia ciudadana no admite chat

Las respuestas permiten texto, documentos o ambos, con hasta 5 PDF de máximo 50 MB por archivo. Los adjuntos quedan en el mismo historial y los PDF institucionales incluyen su pie de autenticidad con QR, identificando a la institución que responde. Puedes previsualizar y quitar archivos antes de enviar

Antes del envío, el botón **Ver** muestra el PDF original, tal como se adjuntó, sin generar QR. Esto aplica a creación, borradores, revisión, descargo y adjuntos de respuestas pendientes. El QR se incorpora al enviar la correspondencia o respuesta. Después del envío, **Ver** abre la copia con QR, tanto en correspondencia institucional como ciudadana. El visor abre directamente la última página para mostrar el QR abajo a la derecha. Puedes desplazarte por el documento desde el propio visor. Si no se puede generar, se muestra el error en vez de abrir silenciosamente el original

Los registros se conservan en localStorage y los PDF en IndexedDB del mismo navegador y origen. No borres los datos del navegador si deseas conservarlos. Se admiten 5 PDF de hasta 50 MB cada uno; el descargo firmado es un anexo adicional

Hay 5 instituciones, 5 ventanillas por institución, 5 usuarios por ventanilla y 10 ciudadanos de ejemplo. Las bandejas de correspondencia comienzan vacías

Identidades de prueba:

- DUI: 01234567-8, 02345678-9, 03456789-0
- DUI adicionales: 05308231-0, 06186995-4, 05303430-9, 05225248-3, 05396177-6 (nombres ficticios de prueba)
- Pasaporte Salvadoreño: A12345678
- Carnet de residente: R0012345

## Alcance

Es una aplicación HTML de demostración funcional en un navegador, sin backend compartido ni autenticación de usuarios. El cambio de institución simula la sesión del remitente o destinatario

El correo con código es una demostración explícita sin envío real. La firma electrónica requiere integrar un proveedor. La verificación ciudadana consulta datos de ejemplo. El descargo puede imprimirse, firmarse y anexarse como PDF

Los PDF institucionales incorporan un pie en la última página con el QR a la derecha y los datos del registro al enviarse. El visor también prepara esa copia para documentos institucionales enviados anteriormente. El original se conserva por separado y el sello no se duplica en aperturas posteriores. Las bibliotecas PDF y QR se incluyen en `vendor/` para funcionar sin conexión. El QR enlaza a un registro local consultable en el mismo navegador. Para autenticidad real, acceso entre equipos y operación institucional se necesitan un backend, control de acceso, almacenamiento compartido, servicio de correo y firma, y un verificador público con hashes y firmas criptográficas

La vista PDF oculta la barra del visor, pero un navegador no puede impedir que una persona guarde un documento al que tiene acceso

Los catálogos territoriales son una selección de ejemplo. Antes de producción se deben cargar los catálogos oficiales completos y revisar el texto del descargo

No se permite punto final en el resumen de la correspondencia
