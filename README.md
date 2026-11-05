# Ventanilla única PQRSF — demo

Demo navegable del módulo de **radicación de documentos, PQRSF y encuestas** para instituciones educativas públicas, con el estilo visual de eScolary (mismas primitivas shadcn/ui, tokens y tipografía).

> Datos de ejemplo en el navegador (`localStorage`). No hay backend: sirve para validar la experiencia con el cliente antes de decidir la arquitectura definitiva.

## Pantallas

| Ruta | Quién la usa | Qué muestra |
| --- | --- | --- |
| `/ventanilla` | Coordinación | Bandeja con KPIs (abiertos, por vencer, vencidos, % en término), filtros y exportación a Excel |
| `/ventanilla/[id]` | Coordinación | Detalle inmutable, hash de adjuntos, trazabilidad, asignar, nota interna, prórroga, responder, recibido conforme / devolver |
| `/ventanilla/nuevo` | Coordinación | Radicar en nombre de alguien (presencial o WhatsApp) |
| `/ventanilla/encuestas` | Coordinación | Encuestas NPS/CSAT, creación de borradores |
| `/ventanilla/encuestas/[id]` | Coordinación | Resultados NPS, CSAT por pregunta, enlace para compartir, exportación |
| `/radicar` | Ciudadanía / docentes | Formulario público con número de radicado inmediato y acuse PDF |
| `/consultar` | Ciudadanía | Consulta de estado por número (sin notas internas) |
| `/encuesta/[id]` | Ciudadanía | Responder encuesta (modo tablet se reinicia solo) |

## Reglas implementadas

- Consecutivo `IEWE-AAAA-TIPO-000001` por tipología y año.
- Plazos en días hábiles (Ley 1755 de 2015): 15 general, 10 documentos/información, 30 consultas; corte 5:00 p. m.; festivos de Colombia calculados con Ley Emiliani.
- Prórroga motivada hasta el doble del término.
- SHA-256 real de cada adjunto y del registro (Web Crypto).
- Contenido inmutable: toda novedad es un evento nuevo.
- Anónimo solo para quejas, reclamos y sugerencias.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
```

Despliegue: importar el repo en Vercel (Next.js, sin variables de entorno). El botón **Restablecer demo** vuelve a los datos de ejemplo.
