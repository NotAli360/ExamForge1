// Lightweight exports using only what's already available in the browser -
// no extra PDF/docx libraries required.
//
// PDF: opens a print-styled window; the user picks "Save as PDF" in the
// browser's print dialog (works everywhere, no server round-trip needed).
//
// Word: downloads an .doc file containing HTML - Word/Google Docs both open
// this natively (the classic "HTML-as-.doc" trick).

function renderExamHTML(exam) {
  const sections = (exam.sections || [])
    .map((sec) => {
      const qs = sec.questions
        .map((q) => {
          const opts =
            q.options && q.options.length
              ? `<div style="margin:4px 0 8px 16px">${q.options.map((o) => `<div>${escapeHtml(o)}</div>`).join("")}</div>`
              : "";
          const answerBlock = `<div style="margin:2px 0 12px 16px;color:#334155;font-size:12px">
              <b>Answer:</b> ${escapeHtml(q.answer)}${
            q.explanation ? `<br/><b>Explanation:</b> ${escapeHtml(q.explanation)}` : ""
          }
            </div>`;
          return `<p style="margin:10px 0 2px"><b>Q${q.localId}.</b> ${escapeHtml(q.text).replace(/\n/g, "<br/>")} <i>[${q.marks} mark${q.marks > 1 ? "s" : ""}]</i></p>${opts}${answerBlock}`;
        })
        .join("");
      return `<h3 style="margin-top:20px;color:#4338ca">${escapeHtml(sec.name)}</h3>${qs}`;
    })
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:800px;margin:0 auto">
    <h1 style="text-align:center;font-size:18px;color:#1e3a8a">${escapeHtml(exam.title)}</h1>
    <p style="text-align:center;font-size:12px;color:#475569">
      Subject: ${escapeHtml(exam.subject)} &nbsp;|&nbsp; Class: ${escapeHtml(exam.class)} &nbsp;|&nbsp;
      Max Marks: ${exam.maxMarks} &nbsp;|&nbsp; Time: ${escapeHtml(exam.timeAllowed)}
    </p>
    <div style="border:1px solid #cbd5e1;border-radius:6px;padding:10px;margin:16px 0;font-size:12px">
      <b>General Instructions:</b>
      <ul>${(exam.instructions || []).map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
    </div>
    ${sections}
  </div>`;
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function exportPdf(exam) {
  const html = renderExamHTML(exam);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(exam.title)}</title></head><body>${html}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export function exportWord(exam) {
  const html = renderExamHTML(exam);
  const fullHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset="utf-8"><title>${escapeHtml(exam.title)}</title></head>
    <body>${html}</body></html>`;
  const blob = new Blob(["\ufeff", fullHtml], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(exam.title || "exam").replace(/[^a-z0-9]+/gi, "_")}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
