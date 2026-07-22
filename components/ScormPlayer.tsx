"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatAssignmentStatus } from "@/lib/assignment-display";
import LoadingSpinner from "@/components/LoadingSpinner";
import { extractProgressFromScormMessage } from "@/lib/scorm-progress";
import type { AssignmentStatus } from "@/lib/types";

declare global {
  interface Window { API?: Scorm12Api; }
}

interface Scorm12Api {
  LMSInitialize(parameter: string): string;
  LMSFinish(parameter: string): string;
  LMSGetValue(element: string): string;
  LMSSetValue(element: string, value: string): string;
  LMSCommit(parameter: string): string;
  LMSGetLastError(): string;
  LMSGetErrorString(code: string): string;
  LMSGetDiagnostic(code: string): string;
}

type LoadPhase = "preparing" | "loading-wrapper" | "loading-content" | "ready";

const MINDSMITH_ORIGIN = "https://app.mindsmith.ai";
const CONTENT_READY_TIMEOUT_MS = 45000;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export default function ScormPlayer({
  assignmentId,
  courseTitle,
  launchUrl,
  initialStatus,
  initialValues
}: {
  assignmentId: string;
  courseTitle: string;
  launchUrl: string;
  initialStatus: AssignmentStatus;
  initialValues: Record<string, string>;
}) {
  const valuesRef = useRef<Record<string, string>>({ ...initialValues });
  const initializedRef = useRef(false);
  const contentReadyRef = useRef(false);
  const [saveState, setSaveState] = useState("Ready");
  const [courseStatus, setCourseStatus] = useState<AssignmentStatus>(initialStatus);
  const [loadPhase, setLoadPhase] = useState<LoadPhase>("preparing");
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [loadingLabel, setLoadingLabel] = useState("Preparing course player…");

  function markContentReady() {
    if (contentReadyRef.current) return;
    contentReadyRef.current = true;
    setLoadPhase("ready");
  }

  async function commit() {
    setSaveState("Saving…");
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: valuesRef.current }),
        keepalive: true
      });
      if (response.ok) {
        const data = (await response.json()) as { completed?: boolean };
        if (data.completed) setCourseStatus("COMPLETED");
        else if (initializedRef.current) setCourseStatus("IN_PROGRESS");
        setSaveState("Progress saved");
      } else {
        setSaveState("Save failed");
      }
      return response.ok;
    } catch {
      setSaveState("Save failed");
      return false;
    }
  }

  useEffect(() => {
    contentReadyRef.current = false;
    initializedRef.current = false;
    setLoadPhase("preparing");
    setIframeSrc(null);
    setLoadingLabel("Preparing course player…");

    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = MINDSMITH_ORIGIN;
    preconnect.crossOrigin = "anonymous";

    const dnsPrefetch = document.createElement("link");
    dnsPrefetch.rel = "dns-prefetch";
    dnsPrefetch.href = MINDSMITH_ORIGIN;

    const preloadBridge = document.createElement("link");
    preloadBridge.rel = "preload";
    preloadBridge.href = "/mindsmith-scorm-interface.js";
    preloadBridge.as = "script";

    document.head.append(preconnect, dnsPrefetch, preloadBridge);

    let lastError = "0";
    const api: Scorm12Api = {
      LMSInitialize: () => {
        initializedRef.current = true;
        if (!valuesRef.current["cmi.core.lesson_status"] || valuesRef.current["cmi.core.lesson_status"] === "not attempted") {
          valuesRef.current["cmi.core.lesson_status"] = "incomplete";
        }
        setCourseStatus("IN_PROGRESS");
        setLoadingLabel("Loading course content…");
        window.setTimeout(() => {
          if (initializedRef.current) markContentReady();
        }, 2500);
        lastError = "0";
        void commit();
        return "true";
      },
      LMSFinish: () => {
        void commit();
        initializedRef.current = false;
        lastError = "0";
        return "true";
      },
      LMSGetValue: (element) => {
        lastError = "0";
        return valuesRef.current[element] ?? "";
      },
      LMSSetValue: (element, value) => {
        valuesRef.current[element] = String(value);
        if (element === "cmi.core.lesson_status") {
          const status = String(value).toLowerCase();
          if (status === "completed" || status === "passed") setCourseStatus("COMPLETED");
          else if (status === "incomplete") setCourseStatus("IN_PROGRESS");
        }
        lastError = "0";
        return "true";
      },
      LMSCommit: () => {
        void commit();
        lastError = "0";
        return "true";
      },
      LMSGetLastError: () => lastError,
      LMSGetErrorString: (code) => code === "0" ? "No error" : "SCORM runtime error",
      LMSGetDiagnostic: (code) => `SCORM 1.2 diagnostic code ${code}`
    };
    window.API = api;

    const readyTimeout = window.setTimeout(() => {
      markContentReady();
    }, CONTENT_READY_TIMEOUT_MS);

    const handleBridgeMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data;
      if (!payload || typeof payload !== "object" || payload.type !== "otto-scorm-child-message") return;

      const childOrigin = typeof payload.origin === "string" ? payload.origin : "";
      if (childOrigin.includes("mindsmith.ai")) {
        markContentReady();
      }

      const progressMeasure = extractProgressFromScormMessage(payload.data);
      if (progressMeasure !== undefined) {
        valuesRef.current["cmi.progress_measure"] = String(progressMeasure);
        void commit();
      }
    };

    const handleProgressMessage = (event: MessageEvent) => {
      const progressMeasure = extractProgressFromScormMessage(event.data);
      if (progressMeasure === undefined) return;
      valuesRef.current["cmi.progress_measure"] = String(progressMeasure);
      void commit();
    };

    const timer = window.setInterval(() => { if (initializedRef.current) void commit(); }, 30000);
    const saveBeforeLeave = () => { if (initializedRef.current) void commit(); };
    window.addEventListener("pagehide", saveBeforeLeave);
    window.addEventListener("message", handleBridgeMessage);
    window.addEventListener("message", handleProgressMessage);

    void (async () => {
      await nextFrame();
      setLoadPhase("loading-wrapper");
      setLoadingLabel("Loading course package…");
      await nextFrame();
      setIframeSrc(launchUrl);
    })();

    return () => {
      window.clearTimeout(readyTimeout);
      window.clearInterval(timer);
      window.removeEventListener("pagehide", saveBeforeLeave);
      window.removeEventListener("message", handleBridgeMessage);
      window.removeEventListener("message", handleProgressMessage);
      preconnect.remove();
      dnsPrefetch.remove();
      preloadBridge.remove();
      void commit();
      delete window.API;
    };
    // initialValues are intentionally loaded once for the SCORM runtime session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, launchUrl]);

  function handleIframeLoad() {
    setLoadPhase("loading-content");
    setLoadingLabel("Loading course content…");
  }

  const isLoading = loadPhase !== "ready";

  return (
    <div className="scorm-shell">
      <div className="scorm-toolbar">
        <div>
          <strong>{courseTitle}</strong>
          <span style={{ opacity: .7, marginLeft: 10 }}>
            {saveState} · {formatAssignmentStatus(courseStatus)}
          </span>
        </div>
        <div className="actions">
          <button className="btn secondary small" onClick={() => void commit()}>Save now</button>
          <Link className="btn secondary small" href="/dashboard">Exit course</Link>
        </div>
      </div>
      <div className="scorm-frame-wrap">
        {isLoading && (
          <div className="scorm-loading-overlay">
            <LoadingSpinner label={loadingLabel} />
          </div>
        )}
        {iframeSrc ? (
          <iframe
            className={`scorm-frame${isLoading ? " scorm-frame-hidden" : ""}`}
            src={iframeSrc}
            title={courseTitle}
            allow="fullscreen"
            onLoad={handleIframeLoad}
          />
        ) : null}
      </div>
    </div>
  );
}
