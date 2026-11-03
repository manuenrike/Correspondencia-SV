# Fase 2 — Modernización visual y responsive

Fecha: 3 de noviembre de 2026.

## A. Hallazgos

- Prioridad alta: texto de 7–11 px en metadatos, formularios y controles que dificultaba la lectura.
- Prioridad media: controles compactos por debajo de 44 px, tarjetas con escaso espacio y campos poco distinguibles de la superficie.
- Prioridad media: el dashboard dedicaba su zona principal a un mensaje promocional sin información de recepción.
- Prioridad media: la acumulación de reglas históricas requería restablecer explícitamente el layout de la cabecera del dashboard y los puntos de ruptura.

## B. Cambios realizados

- `layout.css`: sección final formateada, con base móvil y ampliaciones a 600, 761, 1100 y 1360 px. Tipografía legible, tarjetas adaptables, controles principales de al menos 44 px, navegación móvil con desplazamiento propio, formularios y adjuntos que ajustan textos, modales de pantalla completa en teléfono y centrados en pantallas mayores, historial con más separación y respeto por movimiento reducido.
- `theme.css`: colores secundarios más oscuros, bordes de campos más visibles, superficies blancas, sombras suaves y foco cobalto. Se conservan crema #faf9f7, texto #121722, primario #0068f9 y violeta reservado al énfasis.
- `ui.js`: dashboard con acciones institucional y ciudadana y resumen calculado de correspondencias pendientes de recepción para la institución activa. No modifica registros ni estados.
- `index.html`: versiones de recursos de Fase 2 para evitar reutilizar CSS y UI anteriores en caché.
- `tests/phase2.cjs`: pruebas con expediente de asunto largo, siete anchos y siete vistas por ancho, además de contador, tamaño del botón Continuar y movimiento reducido.

No se incorporaron frameworks, dependencias, backend ni cambios de formatos persistidos. No se eliminaron hojas históricas ni se cambiaron las reglas documentales. Las modificaciones son aditivas para permitir revisar y revertir esta fase independientemente.

## C. Resultados

Dashboard con información operativa, jerarquía tipográfica más clara, metadatos legibles, superficies de tarjetas consistentes, campos distinguibles, documentos y seguimiento más cómodos de consultar. En móviles se conserva el espacio del contenido mediante navegación horizontal; en escritorio permanece la barra lateral.

## D. Pruebas ejecutadas

Entorno: Edge headless instalado, contextos aislados, sin modificar el perfil del usuario.

- `tests/phase1.cjs`: aprobado con el nuevo diseño. Incluye envío, fallo de persistencia y rollback, doble envío, PDF/QR, recepción, rechazo y Escape en visor superpuesto.
- `tests/phase2.cjs`: aprobado. Dashboard con datos, 49 combinaciones de vista/ancho sin desbordamiento horizontal, botón Continuar de al menos 44 px y movimiento reducido. Anchos: 320, 375, 390, 430, 768, 1024 y 1440 px. Vistas: inicio, institucional, ciudadana, borradores, instituciones, formulario ciudadano y detalle.
- Inspección visual mediante capturas: dashboard a 1440 y 375 px, formulario ciudadano a 1440 y 320 px, bandeja institucional con tarjeta a 768 px. Se corrigió durante la inspección una regla antigua que colocaba las acciones al lado del texto dentro del dashboard.
- Sin errores JavaScript en las pruebas responsive. La revisión de sintaxis y espacios se realiza antes del commit.

## E. Limitaciones y pendientes

No se certifica WCAG AA completa: siguen pendientes revisión con lector de pantalla, contraste de todos los estados, dispositivos táctiles reales y revisión visual exhaustiva de todas las variantes. Las pruebas no sustituyen impresión, escaneo externo de QR ni verificación manual del visor PDF del navegador. Continúan las limitaciones de demostración y persistencia local descritas en README y en el informe de Fase 1.

La autorización del usuario permite commit y push directos a GitHub. La publicación efectiva depende del despliegue de Hostinger y debe comprobarse contra la URL pública; no se debe confundir el push con un despliegue completado.
