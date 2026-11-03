# Correspondencia SV — Modern Institutional SaaS

Sistema vigente desde el rediseño premium del 3 de noviembre de 2026. La referencia Dock de style-reference.md se conserva como documento histórico.

## Principios y responsabilidades

Interfaz de trabajo sobria, densidad equilibrada y estados reconocibles por icono y texto. Las superficies grandes son neutras; azul para acciones, colores semánticos para estados.

- layout.css: reset, estructura, medidas, responsive y animaciones, organizados por componente.
- theme.css: tokens, Inter con alternativas del sistema, colores, bordes, sombras y estados.
- ui.js: componentes compartidos, filas de expedientes, resúmenes y feedback de guardado.
- presentation.js: menú móvil nativo, selector de espacio y atajos de navegación. No persiste datos.

Solo layout.css y theme.css se cargan desde index.html. Las hojas históricas se conservan sin cargarse.

## Tokens

| Uso | Token | Valor |
| --- | --- | --- |
| Fondo | --color-canvas | #f8fafc |
| Superficie | --color-surface | #ffffff |
| Superficie secundaria | --color-surface-muted | #f1f5f9 |
| Texto | --color-ink | #0f172a |
| Texto secundario | --color-secondary | #526176 |
| Metadatos auxiliares | --color-muted | #64748b |
| Acción / hover | --color-primary / --color-primary-hover | #2563eb / #1d4ed8 |
| Bordes de superficies | --color-border | #e2e8f0 |
| Bordes de controles | --color-control-border | #8794a6 |
| Éxito / fondo | --color-success / --color-success-soft | #166534 / #f0fdf4 |
| Advertencia / fondo | --color-warning / --color-warning-soft | #92400e / #fffbeb |
| Error / fondo | --color-danger / --color-danger-soft | #b91c1c / #fef2f2 |

Los textos semánticos son más oscuros que la sugerencia inicial para mantener contraste en etiquetas pequeñas. Violeta se reserva a «Requiere respuesta».

## Tipografía y espacio

Inter es opcional: sin conexión se usan fuentes del sistema. Tokens de texto: 12 px para metadatos, 13 px para controles/ayudas, 14 px para cuerpo, 16 px para subtítulos, 20 px para secciones y 30 px para títulos. Títulos móviles de 28 px y campos de 16 px.

Escala de espacios: 4, 8, 12, 16, 20, 24 y 32 px mediante --space-*. Radios: 8 px controles, 12 px superficies y 16 px diálogos. Sombras neutras y discretas, sin glassmorphism ni gráficos sin datos.

## Componentes

- Sidebar de 232 px, navegación agrupada, selector de espacio y respaldos. En móvil un dialog contiene el mismo sidebar, sin duplicar identificadores ni controles de sesión.
- Header con breadcrumb, institución y perfil; botón móvil con aria-expanded y aria-controls.
- Dashboard con KPI reales de la ventanilla, centro de recepción compacto y actividad reciente. Sin tendencias ficticias.
- Bandejas de tres zonas en escritorio y tarjetas en móvil; dirección, recepción y respuesta son datos separados.
- Formularios nativos con etiquetas, errores asociados, foco visible y feedback real de guardado.
- Tres pasos, etapa actual azul y etapas completadas con marca de verificación. Revisión sin encabezados repetidos.
- Confirmación destructiva roja con texto explícito y Cancelar como foco inicial.
- Expediente: estado, datos/ruta, contenido/documentos, eventos y conversación. Se conserva todo el historial.

## Responsive y accesibilidad

Base móvil; ampliaciones a 600, 900 y 1150 px. Menú móvil por debajo de 900 px. Controles principales de 44 px en móvil; acciones de fila de 32 px en escritorio. Foco de 2 px y controles con nombre accesible.

Menú nativo con confinamiento de foco; restaura el sidebar al cerrar, pulsar Escape o cambiar a escritorio. Transiciones de 160–180 ms, eliminadas con prefers-reduced-motion. forced-colors recupera la flecha nativa de selects.

Contrastes calculados: acción blanca/azul 5,17:1; texto secundario/superficie secundaria 5,76:1; éxito 6,81:1; advertencia 6,84:1; error 5,91:1. Bordes de controles/blanco 3,08:1.

Las pruebas no constituyen certificación WCAG completa. No se modifican ventanillas, respaldo, PDF, QR, recepción ni conversación.

## Refinamiento visual

### Operación y pendientes

La [auditoría operativa](operational-ux-audit.md) incorpora UI UX Pro Max conservando los tokens de este documento. «Por atender» usa ámbar y texto de acción para recepciones/respuestas propias; violeta sigue indicando requerimiento de respuesta, aunque corresponda actuar a la contraparte. «Entrante» expresa dirección, «Recibido» expresa aceptación y «Conversación finalizada» expresa cierre. Los filtros adicionales se agrupan en un `details` nativo; el contador de resultados usa una única región de estado contextual. Los formularios muestran campos obligatorios y un resumen enlazado cuando hay varios errores. No se agregaron hojas CSS.

La [segunda pasada](visual-polish.md) unifica las métricas del directorio con las bandejas, separa la identidad de las acciones en tarjetas de usuario y normaliza iconos y adjuntos. Asuntos de expediente/revisión: 20 px; títulos de diálogo: 24 px; confirmaciones: 20 px. Iconos de metadatos: 14 px, acciones: 16 px y navegación: 18 px.

Los controles de administración usan 32 px con espacio suficiente y puntero fino; conservan 44 px en pantallas pequeñas o con puntero táctil. Los borradores usan una acción de continuación discreta y los tamaños documentales se muestran en KB o MB según su magnitud. Las capturas y limitaciones están documentadas en el informe.
