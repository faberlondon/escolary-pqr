import { utils, writeFile } from "xlsx";

import { formatDateTime } from "./rules";
import { formatAnswer, SURVEY_CHANNEL_LABELS, type Survey } from "./surveys";

/**
 * Exporta las respuestas sin datos personales. En anónimas no hay nada que vincular (RN-10):
 * los enlaces personales usados se guardan aparte y no salen en el archivo.
 */
export function exportSurveyXlsx(survey: Survey): void {
  const rows = survey.responses.map((r, i) => {
    const row: Record<string, string | number> = {
      "#": i + 1,
      Fecha: formatDateTime(r.at),
      Canal: r.channel ? SURVEY_CHANNEL_LABELS[r.channel] : "",
    };
    for (const q of survey.questions) row[q.text] = formatAnswer(r.answers[q.id]);
    if (r.comment) row.Comentario = r.comment;
    if (r.radicado) row["Radicado PQRSF"] = r.radicado;
    return row;
  });
  const book = utils.book_new();
  utils.book_append_sheet(book, utils.json_to_sheet(rows), "Respuestas");
  writeFile(book, `encuesta-${survey.id}.xlsx`);
}
