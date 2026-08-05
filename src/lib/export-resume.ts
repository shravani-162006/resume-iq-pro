import type { ParsedResume, ResumeTemplate } from "./resume-types";

/**
 * ATS-safe exports: single column, standard font, no tables, images, or text boxes.
 */

type Block = { kind: "h1" | "h2" | "line" | "bullet" | "space"; text: string };

export function buildBlocks(resume: ParsedResume, template: ResumeTemplate): Block[] {
  const blocks: Block[] = [];
  const contactLine = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.website,
  ]
    .filter(Boolean)
    .join("  |  ");

  blocks.push({ kind: "h1", text: resume.contact.name || resume.target_title || "Resume" });
  if (contactLine) blocks.push({ kind: "line", text: contactLine });

  const summary = () => {
    if (!resume.summary) return;
    blocks.push({ kind: "h2", text: "Professional Summary" });
    blocks.push({ kind: "line", text: resume.summary });
  };

  const skills = () => {
    if (!resume.skills.length) return;
    blocks.push({ kind: "h2", text: "Skills" });
    blocks.push({ kind: "line", text: resume.skills.join(", ") });
  };

  const experience = () => {
    if (!resume.experience.length) return;
    blocks.push({ kind: "h2", text: "Professional Experience" });
    for (const role of resume.experience) {
      const heading = [role.title, role.company].filter(Boolean).join(" — ");
      const meta = [role.location, [role.start, role.end].filter(Boolean).join(" – ")]
        .filter(Boolean)
        .join("  |  ");
      blocks.push({ kind: "line", text: heading });
      if (meta) blocks.push({ kind: "line", text: meta });
      for (const bullet of role.bullets) blocks.push({ kind: "bullet", text: bullet });
      blocks.push({ kind: "space", text: "" });
    }
  };

  const education = () => {
    if (!resume.education.length) return;
    blocks.push({ kind: "h2", text: "Education" });
    for (const item of resume.education) {
      blocks.push({
        kind: "line",
        text: [item.degree, item.school, item.year].filter(Boolean).join(", "),
      });
    }
  };

  const certifications = () => {
    if (!resume.certifications.length) return;
    blocks.push({ kind: "h2", text: "Certifications" });
    for (const item of resume.certifications) blocks.push({ kind: "bullet", text: item });
  };

  if (template === "skills-first") {
    skills();
    summary();
    experience();
  } else if (template === "hybrid") {
    summary();
    skills();
    experience();
  } else {
    summary();
    experience();
    skills();
  }
  education();
  certifications();

  return blocks;
}

export async function downloadPdf(
  resume: ParsedResume,
  template: ResumeTemplate,
  fileName: string,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 54;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  const newPageIfNeeded = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  for (const block of buildBlocks(resume, template)) {
    if (block.kind === "space") {
      y += 8;
      continue;
    }
    if (block.kind === "h1") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      newPageIfNeeded(24);
      doc.text(block.text, margin, y);
      y += 22;
      continue;
    }
    if (block.kind === "h2") {
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      newPageIfNeeded(18);
      doc.text(block.text.toUpperCase(), margin, y);
      y += 6;
      doc.setDrawColor(160);
      doc.line(margin, y, margin + width, y);
      y += 12;
      continue;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    const prefix = block.kind === "bullet" ? "• " : "";
    const lines = doc.splitTextToSize(prefix + block.text, width) as string[];
    for (const line of lines) {
      newPageIfNeeded(14);
      doc.text(line, margin, y);
      y += 14;
    }
  }

  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

export async function downloadDocx(
  resume: ParsedResume,
  template: ResumeTemplate,
  fileName: string,
) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

  const children = buildBlocks(resume, template).map((block) => {
    if (block.kind === "h1") {
      return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: block.text, bold: true, size: 32 })],
      });
    }
    if (block.kind === "h2") {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 80 },
        children: [new TextRun({ text: block.text.toUpperCase(), bold: true, size: 24 })],
      });
    }
    if (block.kind === "bullet") {
      return new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: block.text, size: 21 })],
      });
    }
    if (block.kind === "space") {
      return new Paragraph({ children: [new TextRun({ text: "" })] });
    }
    return new Paragraph({ children: [new TextRun({ text: block.text, size: 21 })] });
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri" } } } },
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".docx") ? fileName : `${fileName}.docx`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function toPlainText(resume: ParsedResume, template: ResumeTemplate) {
  return buildBlocks(resume, template)
    .map((block) => {
      if (block.kind === "space") return "";
      if (block.kind === "h2") return `\n${block.text.toUpperCase()}`;
      if (block.kind === "bullet") return `• ${block.text}`;
      return block.text;
    })
    .join("\n")
    .trim();
}
