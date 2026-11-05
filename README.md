# Ventanilla única PQRSF — demo

Demo navegable del módulo de **radicación de documentos, PQRSF y encuestas** para instituciones educativas públicas, con el estilo visual de eScolary (mismas primitivas shadcn/ui, tokens y tipografía).

> Datos de ejemplo en el navegador (`localStorage`). No hay backend: sirve para validar la experiencia con el cliente antes de decidir la arquitectura definitiva.

## Roles de la demo

Arriba a la derecha se cambia de usuario para ver qué ve cada rol (RN-07):

| Usuario | Rol | Ve |
| --- | --- | --- |
| Inocencio Coronado | Coordinador | Todo; asigna, traslada, anula, configura |
| Rosa Gil | Rectora | Todo; responde, reportes y bitácora |
| Rafael Pushaina | Responsable de área | Solo lo asignado a Convivencia |
| Luis Pérez | Docente | Solo sus radicados; radica correcciones |
| Marta Villa | Administrador IE | Configuración y bitácora, sin contenido de radicados |

## Pantallas

| Ruta | Quién la usa | Qué muestra |
| --- | --- | --- |
| `/ventanilla` | Gestores / docente | Bandeja (o "Mis radicados") con KPIs, filtros por tipo, estado, área y búsqueda; exportación a Excel |
| `/ventanilla/[id]` | Gestores | Detalle inmutable, hash de adjuntos, trazabilidad; asignar a responsable, nota interna, prórroga, solicitar información (suspende término), trasladar, responder con soportes y sentido, cerrar, anular, recibido conforme / devolver |
| `/ventanilla/nuevo` | Coordinación | Radicar en nombre de alguien (presencial, telefónico o WhatsApp) |
| `/ventanilla/reportes` | Coordinación, rectoría | Indicadores por tipo y área, tiempo promedio, % en término, extemporáneas por docente, encuestas por docente/área; Excel e informe de transparencia en PDF |
| `/ventanilla/bitacora` | Coordinación, rectoría, admin | Bitácora append-only de cada acción (ver, radicar, asignar, responder, anular, exportar, configurar) |
| `/ventanilla/configuracion` | Coordinación, admin | Sigla, hora de corte, plazos, áreas y responsables, tipologías con fecha límite, formatos y tamaño de adjuntos, política de datos y plantilla del acuse |
| `/ventanilla/encuestas` | Coordinación, rectoría | Encuestas NPS, CSAT, selección única/múltiple y abiertas; plantillas y clonado |
| `/ventanilla/encuestas/[id]` | Coordinación, rectoría | Publicar/cerrar, enlace general, enlace personal de un uso, captura física, resultados y exportación |
| `/radicar` | Ciudadanía / docentes | Formulario público con radicado inmediato y acuse PDF; `?corrige=<radicado>` radica la corrección de un documento devuelto |
| `/consultar` | Ciudadanía | Consulta por número + documento (solo número si es anónimo), acuse descargable y aporte de información solicitada |
| `/encuesta/[id]` | Ciudadanía | Responder encuesta; tablet en modo kiosco; el comentario puede radicarse como sugerencia |

## Reglas implementadas

- Consecutivo `SIGLA-AAAA-TIPO-000001` por tipología y año, sin huecos ni duplicados aun con envíos simultáneos; nunca se reutiliza.
- Plazos configurables en días hábiles (por defecto Ley 1755 de 2015): 15 general, 10 documentos/información, 30 consultas; hora de corte configurable; festivos de Colombia con Ley Emiliani.
- Prórroga motivada hasta el doble del término, antes del vencimiento. Solicitar información suspende el término y lo reactiva completo al recibirla.
- Alertas automáticas: 3 días hábiles antes al responsable, el día del vencimiento a coordinación y rectoría, y "Vencido" al día siguiente. Cierre automático tras N días hábiles sin réplica.
- Entregas después de la fecha límite de la tipología quedan "extemporáneas" sin bloquearse.
- SHA-256 real de cada adjunto, soporte de respuesta y del registro (Web Crypto).
- Contenido inmutable: toda novedad es un evento nuevo. Anulación solo por coordinación con motivo.
- Anónimo solo para quejas, reclamos y sugerencias. Notas internas nunca visibles al radicante. Datos de estudiantes involucrados solo para quien atiende el caso.
- Encuestas anónimas sin vínculo con personas, ni en la exportación; enlace personal de un solo uso.
- Formulario público con campo trampa contra bots y límite de envíos por navegador.

Fuera de la demo (requieren backend): envío real de correo/WhatsApp, sello de hora del servidor, almacenamiento WORM, captcha, multi-tenant, enlaces mágicos.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
```

Despliegue: importar el repo en Vercel (Next.js, sin variables de entorno). El botón **Restablecer demo** vuelve a los datos de ejemplo.
