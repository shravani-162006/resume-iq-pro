/**
 * Browser-only text extraction for .pdf and .docx resume files.
 * All heavy parsers are dynamically imported so they never enter the SSR bundle.
 */

export type ExtractProgress = (step: string) => void;

export async function extractResumeText(file: File, onProgress?: ExtractProgress): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    onProgress?.("Reading PDF document…");
    return extractPdf(file);
  }

  if (name.endsWith(".docx")) {
    onProgress?.("Reading Word document…");
    return extractDocx(file);
  }

  if (name.endsWith(".txt")) {
    return file.text();
  }

  throw new Error("Unsupported file type. Upload a .pdf or .docx resume.");
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    let line = "";
    const lines: string[] = [];
    let lastY: number | null = null;

    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = Math.round((item.transform?.[5] ?? 0) as number);
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        lines.push(line.trim());
        line = "";
      }
      line += `${item.str} `;
      lastY = y;
    }
    lines.push(line.trim());
    pages.push(lines.filter(Boolean).join("\n"));
  }

  await (doc as unknown as { destroy: () => Promise<void> }).destroy();
  return pages.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const buffer = await file.arrayBuffer();
  const result = await (
    mammoth as unknown as {
      extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
    }
  ).extractRawText({ arrayBuffer: buffer });
  return result.value.replace(/\n{3,}/g, "\n\n").trim();
}
