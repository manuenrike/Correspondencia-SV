# Persistencia compartida entre equipos

## Alcance

El despliegue de Netlify utiliza una única fuente compartida para instituciones, ventanillas, usuarios, ciudadanos de demostración, correspondencias, eventos, conversaciones, borradores y documentos PDF originales y con QR. El selector de sesión continúa siendo una demostración: todos los visitantes del enlace comparten los datos y pueden elegir un usuario. Este modo público fue solicitado expresamente para datos ficticios.

El navegador conserva una caché y una cola de cambios pendientes para reintentar una conexión fallida. «Guardado compartido» y «Borrador guardado en línea» se muestran cuando el servidor confirmó la operación; una copia local por sí sola no se presenta como guardado en el equipo. Las vistas consultan cambios del servidor cada diez segundos cuando no hay formularios ni documentos abiertos, y al recuperar el foco.

## Servidor

- `@netlify/database`: Postgres administrado por Netlify. Una transacción bloquea la versión de metadatos, comprueba las precondiciones y registra cada solicitud con un identificador idempotente. Los reintentos de una respuesta perdida no duplican un envío.
- `@netlify/blobs`: documentos por fragmentos de 2 MiB, con lectura fuerte y comprobación SHA-256. La transferencia no depende de que un PDF completo quepa dentro de una solicitud de Functions. El original puede tener hasta 50 MB, como antes; el servidor reserva hasta 64 MiB para las copias ampliadas con QR.
- La publicación de un expediente comprueba que todos sus documentos ya estén guardados. Un documento incompleto no habilita el guardado del expediente.
- Dos modificaciones de registros diferentes se conservan. Dos ediciones incompatibles del mismo registro producen un conflicto, sin sobrescribir silenciosamente a otro equipo. «Revisar» conserva una copia local de los cambios pendientes antes de cargar la versión compartida.

Solo la selección del usuario e institución y los datos pendientes de sincronizar pertenecen al dispositivo. Los metadatos confirmados y los documentos residen en el servidor. El filtro por ventanilla mantiene el comportamiento anterior, pero no constituye autorización real del servidor en esta demo pública.

## Despliegue en Netlify

El repositorio incluye `package.json`, `pnpm-lock.yaml` y `netlify.toml`:

1. Conectar el proyecto de Netlify al repositorio y usar la rama `main` para producción.
2. Netlify instala las dependencias, ejecuta `node scripts/build-site.cjs` y publica únicamente `dist/`. No se publican archivos del servidor, pruebas ni archivos de entorno.
3. La dependencia `@netlify/database` y la migración de `netlify/database/migrations/0001_shared_storage/` preparan el almacenamiento según el ciclo de despliegue de Netlify. La disponibilidad de Database depende del plan de la cuenta. Si Netlify informa que no está disponible, es necesario habilitar un plan compatible o conectar otro Postgres antes de publicar esta función.
4. Confirmar en **Data & Storage → Database** que la migración se aplicó y que la función `shared` aparece en el despliegue. No colocar cadenas de conexión ni credenciales en los scripts del navegador.
5. Abrir el sitio desde dos navegadores distintos; crear un expediente con PDF en uno y verificar recepción, visualización y respuesta desde el otro.

La configuración generada por el build activa el guardado compartido también en un dominio personalizado de Netlify. Abrir el HTML directamente, o publicar los archivos raíz en otro host estático, conserva el modo local anterior. En un dominio `netlify.app` sin la función desplegada se muestra un error, nunca una falsa confirmación de persistencia compartida.

Referencias oficiales consultadas: [inicio de Netlify Database](https://docs.netlify.com/build/data-and-storage/netlify-database/getting-started/), [transacciones del cliente](https://docs.netlify.com/build/data-and-storage/netlify-database/api/), [almacenamiento de archivos Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).

## Incorporar información anterior

Al abrir por primera vez el nuevo sitio, si el navegador ya tenía correspondencias o borradores del mismo dominio, aparece **Compartir datos de este navegador**. La acción comprueba los identificadores y sube los PDF antes de incorporar los registros. No reemplaza versiones distintas que ya existan en el equipo. La copia local anterior se conserva.

El código no puede leer automáticamente los datos de otro dominio, otro perfil o un navegador distinto. Los datos de Hostinger y los de Netlify son almacenes diferentes: deben trasladarse con una copia completa de metadatos y documentos. Cambiar el código de un sitio no traslada por sí solo sus datos antiguos.

## Pruebas

Requiere Node 22.12 o posterior y un navegador Chromium disponible para Playwright. En Windows puede indicarse Edge mediante `BROWSER_PATH`.

```text
pnpm install --frozen-lockfile
pnpm test
pnpm test:shared
pnpm build
```

`tests/shared-storage.cjs` utiliza el emulador Postgres de Netlify y dos perfiles aislados. Comprueba transacciones, conflictos, idempotencia, validación, transferencia mayor de 6 MB, PDF/QR, recepción, respuestas, borradores simultáneos, cola persistente tras recarga sin red, catálogos compartidos e importación local. El adaptador de archivos en esas pruebas es en memoria y reproduce el contrato de Blobs; la integración real con Blobs debe verificarse además en un despliegue Netlify.

El emulador PGlite mantiene una sola sesión embebida; la conexión de las pruebas se serializa para respetar esa limitación. En producción las transacciones se ejecutan con sesiones Postgres y bloqueo de fila, además de una comprobación explícita de versión. Las pruebas locales no sustituyen la verificación del plan, las migraciones y los permisos de almacenamiento de la cuenta Netlify.

## Verificación real del despliegue — 4 de noviembre de 2026

La [vista previa del PR 7](https://deploy-preview-7--brilliant-sprinkles-c42b60.netlify.app/) se desplegó correctamente. La función respondió con versión inicial 0; al abrir la aplicación se inicializó el catálogo compartido. Se ejecutó `browserTests` contra esa URL con dos perfiles aislados, utilizando la base Postgres y Blobs reales de Netlify: envío, PDF original y QR, recepción desde otro equipo, respuesta visible en el primero, borradores simultáneos, catálogo de usuarios actualizado, reintento tras desconexión/recarga, importación local y transferencia de un PDF de más de 7 MB. El resultado fue aprobado, sin errores JavaScript capturados. Los registros creados son datos de prueba de la vista previa.

También aprobaron las ocho suites de regresión anteriores. La compilación solo publica los archivos del navegador. La configuración de la demo no incorpora autenticación institucional real ni cambia el plan o los medios de pago de Netlify.
