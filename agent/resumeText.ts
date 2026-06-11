import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

import { PDFParse } from "pdf-parse";

const execFileAsync = promisify(execFile);
const markitdownTimeoutMs = 15_000;
const maxConvertedTextBuffer = 2 * 1024 * 1024;
const minimumUsefulTextLength = 160;
const localMarkitdownPath = path.join(
  process.cwd(),
  ".venv",
  process.platform === "win32" ? "Scripts/markitdown.exe" : "bin/markitdown",
);
const markitdownCommands = [
  { command: localMarkitdownPath, args: [] },
  { command: "markitdown", args: [] },
  { command: "python3", args: ["-m", "markitdown"] },
];

const pdfWorkerUrl = pathToFileURL(
  path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
).href;

// Next/Turbopack cannot resolve pdf.js' default worker path from server chunks.
PDFParse.setWorker(pdfWorkerUrl);

export type ResumeTextExtractionResult = {
  text: string;
  source: "markitdown" | "pdf-parse";
};

function normalizeExtractedText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function getCommandErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  const code = error.code;
  return typeof code === "string" ? code : null;
}

function getCommandErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getCommandErrorSignal(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("signal" in error)) {
    return null;
  }

  const signal = error.signal;
  return typeof signal === "string" ? signal : null;
}

function wasCommandKilled(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("killed" in error)) {
    return false;
  }

  return error.killed === true;
}

function isExpectedMarkitdownFailure(error: unknown): boolean {
  const code = getCommandErrorCode(error);
  return code === "ENOENT" || code === "ETIMEDOUT" || wasCommandKilled(error);
}

async function extractWithMarkitdown(pdfBuffer: Buffer): Promise<string | null> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "job-pilot-resume-"));
  const pdfPath = path.join(tempDir, "resume.pdf");

  try {
    await writeFile(pdfPath, pdfBuffer);

    for (const markitdownCommand of markitdownCommands) {
      try {
        const { stdout } = await execFileAsync(
          markitdownCommand.command,
          [...markitdownCommand.args, pdfPath],
          {
            timeout: markitdownTimeoutMs,
            maxBuffer: maxConvertedTextBuffer,
          },
        );

        const normalizedText = normalizeExtractedText(stdout);

        if (normalizedText.length >= minimumUsefulTextLength) {
          return normalizedText;
        }
      } catch (error) {
        if (!isExpectedMarkitdownFailure(error)) {
          console.warn("[agent/resumeText] MarkItDown command failed:", {
            command: markitdownCommand.command,
            args: markitdownCommand.args,
            code: getCommandErrorCode(error),
            signal: getCommandErrorSignal(error),
            message: getCommandErrorMessage(error),
          });
        }
      }
    }

    return null;
  } catch (error) {
    console.warn("[agent/resumeText] MarkItDown conversion unavailable, falling back to pdf-parse:", error);
    return null;
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

async function extractWithPdfParse(pdfBuffer: Buffer): Promise<string> {
  let parser: PDFParse | null = null;

  try {
    parser = new PDFParse({ data: pdfBuffer });
    const pdfData = await parser.getText();
    return normalizeExtractedText(pdfData.text);
  } finally {
    await parser?.destroy();
  }
}

export async function extractResumeTextFromPdf(
  pdfBuffer: Buffer,
): Promise<ResumeTextExtractionResult> {
  const markdownText = await extractWithMarkitdown(pdfBuffer);

  if (markdownText) {
    return {
      text: markdownText,
      source: "markitdown",
    };
  }

  return {
    text: await extractWithPdfParse(pdfBuffer),
    source: "pdf-parse",
  };
}
