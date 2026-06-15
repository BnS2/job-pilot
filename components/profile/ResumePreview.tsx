"use client";

import { useEffect, useRef, useState } from "react";

type PdfJsModule = typeof import("pdfjs-dist");

type Props = {
  fileUrl?: string;
  openHref?: string;
  resumePdfKey?: string | null;
  resumePdfUrl?: string | null;
  title?: string;
};

type PreviewStatus = "loading" | "ready" | "error";
type PdfLoadingTask = ReturnType<PdfJsModule["getDocument"]>;

export function ResumePreview({
  fileUrl = "/api/profile/resume",
  openHref = fileUrl,
  resumePdfKey,
  resumePdfUrl,
  title = "Resume Preview",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<PreviewStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pdfDocument: { destroy: () => Promise<void> } | null = null;
    let loadingTask: PdfLoadingTask | null = null;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;

    const renderPreview = async (): Promise<void> => {
      setStatus("loading");
      setErrorMessage(null);
      setPageCount(null);

      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          return;
        }

        const response = await fetch(fileUrl, {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Could not load resume preview.");
        }

        const pdfBytes = await response.arrayBuffer();
        const pdfjs: PdfJsModule = await import("pdfjs-dist/webpack.mjs");
        loadingTask = pdfjs.getDocument({
          data: new Uint8Array(pdfBytes),
          disableStream: true,
          disableRange: true,
        });
        const loadedPdf = await loadingTask.promise;
        loadingTask = null;
        pdfDocument = loadedPdf;

        if (cancelled) {
          await loadedPdf.destroy();
          return;
        }

        const page = await loadedPdf.getPage(1);
        const containerWidth = canvas.parentElement?.clientWidth ?? 320;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1.4, Math.max(0.6, (containerWidth - 32) / baseViewport.width));
        const viewport = page.getViewport({ scale });
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Could not prepare resume preview.");
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = "100%";
        canvas.style.height = "auto";

        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;

        if (!cancelled) {
          setPageCount(loadedPdf.numPages);
          setStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[components/profile/ResumePreview] Preview render error:", error);
          setErrorMessage("Could not render the resume preview. Open the full-size PDF instead.");
          setStatus("error");
        }
      }
    };

    void renderPreview();

    return () => {
      cancelled = true;
      renderTask?.cancel();
      void loadingTask?.destroy();
      void pdfDocument?.destroy();
    };
  }, [fileUrl, resumePdfKey, resumePdfUrl]);

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-4 py-3">
        <div>
          <p className="text-sm font-semibold leading-5 text-text-primary">
            {title}
          </p>
          {pageCount && pageCount > 1 ? (
            <p className="mt-1 text-xs font-medium leading-4 text-text-muted">
              Showing page 1 of {pageCount}
            </p>
          ) : null}
        </div>
        <a
          href={openHref}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold leading-4 text-accent hover:underline"
        >
          Open full size
        </a>
      </div>
      <div className="bg-surface-secondary p-4">
        {status === "loading" ? (
          <div className="flex min-h-80 items-center justify-center rounded-md border border-border bg-surface text-sm font-medium leading-5 text-text-secondary">
            Loading preview...
          </div>
        ) : null}
        {status === "error" ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-md border border-error/20 bg-error/10 p-6 text-center">
            <p className="text-sm font-semibold leading-5 text-error">
              Preview unavailable
            </p>
            <p className="mt-2 text-sm font-medium leading-5 text-text-secondary">
              {errorMessage}
            </p>
          </div>
        ) : null}
        <canvas
          ref={canvasRef}
          className={`mx-auto rounded-md bg-surface shadow-sm ${
            status === "ready" ? "block" : "hidden"
          }`}
        />
      </div>
    </div>
  );
}
