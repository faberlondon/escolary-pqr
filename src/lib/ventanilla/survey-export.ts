import { utils, writeFile } from "xlsx";

import { formatDateTime } from "./rules";
import type { Survey } from "./surveys";

/** Exporta las respuestas sin datos personales; en anónimas no hay nada que vincular (RN-10). */
export function exportSurveyXlsx(survey: Survey): void {
  const rows = survey.responses.map((r, i) => {
    const row: Record<string, string | number> = { "#": i + 1, Fecha: formatDateTime(r.at) };
    for (const q of survey.questions) row[q.text] = r.answers[q.id] ?? "";
    if (r.comment) row.Comentario = r.comment;
    return row;
  });
  const book = utils.book_new();
  utils.book_append_sheet(book, utils.json_to_sheet(rows), "Respuestas");
  writeFile(book, `encuesta-${survey.id}.xlsx`);
}
