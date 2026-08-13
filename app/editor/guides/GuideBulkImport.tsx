"use client";

import { useEffect, useRef, useState } from "react";

type UnresolvedItem = { field: string; reason: string; severity: "editorial" | "safety" };
type ImportItem = {
  externalId: string;
  slug: string;
  title: string;
  action: "create" | "update" | "duplicate" | "blocked";
  valid: boolean;
  warnings: string[];
  errors: string[];
  unresolved: UnresolvedItem[];
  existingMatch: { slug: string; status: string } | null;
  mediaStatus: string;
  verificationStatus: string;
};
type ImportPlan = {
  planToken: string;
  expiresAt: string;
  mode: "create-draft" | "update-draft";
  summary: { total: number; valid: number; warnings: number; blocked: number; creates: number; updates: number; duplicates: number };
  items: ImportItem[];
};
type ImportedGuide = { id?: string; internalId?: string; slug: string; title: string };
type ImportSuccess = { id: string; title: string };

function reportCell(value: unknown) {
  const raw = String(value ?? "");
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function actionLabel(action: ImportItem["action"]) {
  if (action === "create") return "Create Draft";
  if (action === "update") return "Update Draft";
  if (action === "duplicate") return "Skip duplicate";
  return "Blocked";
}

export function GuideBulkImport({ onImported }: { onImported: (preferredId: string) => Promise<void> | void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [mode, setMode] = useState<"create-draft" | "update-draft">("create-draft");
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [success, setSuccess] = useState<ImportSuccess | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!plan) return;
    reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    reviewRef.current?.focus({ preventScroll: true });
  }, [plan]);

  const resetResult = () => { setPlan(null); setSuccess(null); setMessage(""); };
  const selectFile = async (file?: File) => {
    if (!file) return;
    const nextFormat = file.name.toLowerCase().endsWith(".csv") ? "csv" : "json";
    setFormat(nextFormat); setFilename(file.name); setContent(await file.text()); resetResult();
  };

  const validate = async () => {
    setBusy(true); resetResult();
    try {
      const response = await fetch("/api/editor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "validateGuideImport", format, mode, content }) });
      const result = await response.json() as { plan?: ImportPlan; error?: string; validationErrors?: string[] };
      if (!response.ok || !result.plan) throw new Error(result.validationErrors?.join(" ") || result.error || "The import could not be validated.");
      setExpanded(true); setPlan(result.plan); setMessage("Dry run complete. Nothing has yet been written.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The import could not be validated."); }
    finally { setBusy(false); }
  };

  const confirm = async () => {
    if (!plan || plan.summary.blocked > 0) return;
    setBusy(true); setMessage(""); setSuccess(null);
    try {
      const response = await fetch("/api/editor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "confirmGuideImport", planToken: plan.planToken }) });
      const result = await response.json() as { error?: string; imported?: ImportedGuide[]; validationErrors?: string[] };
      if (!response.ok) throw new Error(result.validationErrors?.join(" ") || result.error || "The import could not be confirmed.");
      const imported = result.imported || [];
      const first = imported[0];
      if (!first) throw new Error("The import completed without creating a Draft. Revalidate the file before trying again.");
      const id = first.id || first.internalId || first.slug;
      await onImported(id);
      setPlan(null);
      setSuccess({ id, title: first.title });
      setMessage(imported.length === 1 ? "Draft Guide created successfully" : `${imported.length} Draft Guides created successfully`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The import could not be confirmed."); }
    finally { setBusy(false); }
  };

  const downloadReport = () => {
    if (!plan) return;
    const header = ["externalId", "title", "slug", "action", "valid", "media", "verification", "warnings", "errors"];
    const rows = plan.items.map((item) => [item.externalId, item.title, item.slug, item.action, item.valid, item.mediaStatus, item.verificationStatus, item.warnings.join(" | "), item.errors.join(" | ")]);
    const blob = new Blob([[header, ...rows].map((row) => row.map(reportCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "oldseadogs-guide-import-report.csv"; link.click(); URL.revokeObjectURL(link.href);
  };

  return <details className="bridge-panel guide-bulk-import" open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)}>
    <summary><strong>Bulk Import</strong><span>JSON or CSV · Drafts only</span></summary>
    <div className="bridge-error"><strong>Bulk imports create Draft Guides only.</strong><span>Nothing is published automatically. Homepage selections are never changed.</span></div>
    <div className="bridge-field-row thirds"><label><span>Import mode</span><select value={mode} onChange={(event) => { setMode(event.target.value as typeof mode); resetResult(); }}><option value="create-draft">Create Drafts</option><option value="update-draft">Update existing Drafts</option></select></label><label><span>Format</span><select value={format} onChange={(event) => { setFormat(event.target.value as typeof format); resetResult(); }}><option value="json">JSON contract</option><option value="csv">UTF-8 CSV</option></select></label><div><span>Import file</span><input ref={fileRef} accept=".json,.csv,application/json,text/csv" hidden type="file" onChange={(event) => void selectFile(event.target.files?.[0])} /><button type="button" onClick={() => fileRef.current?.click()}>Upload JSON or CSV</button><small>{filename || "No file selected"}</small></div></div>
    <label><span>{format === "json" ? "Paste JSON envelope" : "CSV content"}</span><textarea className="guide-import-source" spellCheck={false} value={content} onChange={(event) => { setContent(event.target.value); setFilename(""); resetResult(); }} placeholder={format === "json" ? '{"contract":"oldseadogs.guide-draft","version":1,"mode":"create-draft","guides":[]}' : "externalId,slug,title,guideType,regionKey,regionName"} /></label>
    <div className="bridge-row-actions"><button className="bridge-primary-action" disabled={busy || !content.trim()} type="button" onClick={() => void validate()}>{busy ? "Checking…" : "Validate / Dry Run"}</button>{plan ? <button type="button" onClick={downloadReport}>Download result report</button> : null}</div>

    {plan ? <section className="guide-import-plan" ref={reviewRef} tabIndex={-1} aria-labelledby="guide-import-review-title">
      <div className="bridge-panel-heading"><div><p className="eyebrow">Step 2 — Review result</p><h2 id="guide-import-review-title">Validated Draft import</h2></div><span className={`bridge-status ${plan.summary.blocked ? "bad" : "good"}`}>{plan.summary.blocked ? "Action required" : "Ready to confirm"}</span></div>
      <div className="guide-import-results">{plan.items.map((item) => {
        const editorial = item.unresolved.filter((issue) => issue.severity === "editorial");
        const safety = item.unresolved.filter((issue) => issue.severity === "safety");
        return <article className={item.valid ? "" : "blocked"} key={`${item.externalId}-${item.slug}`}>
          <div className="guide-manager-badges"><span>{actionLabel(item.action)}</span><span>Media: {item.mediaStatus}</span><span>{item.verificationStatus}</span></div>
          <h3>{item.title || "Untitled Guide"}</h3>
          <p><strong>Slug:</strong> <code>{item.slug}</code></p>
          {item.warnings.length ? <div><strong>Warnings</strong><ul>{item.warnings.map((warning) => <li className="guide-import-warning" key={warning}>{warning}</li>)}</ul></div> : <p><strong>Warnings:</strong> None</p>}
          <div><strong>Unresolved editorial items</strong>{editorial.length ? <ul>{editorial.map((issue) => <li key={`${issue.field}-${issue.reason}`}>{issue.field}: {issue.reason}</li>)}</ul> : <p>None</p>}</div>
          <div><strong>Unresolved safety items</strong>{safety.length ? <ul>{safety.map((issue) => <li key={`${issue.field}-${issue.reason}`}>{issue.field}: {issue.reason}</li>)}</ul> : <p>None</p>}</div>
          {item.existingMatch ? <p>Existing: {item.existingMatch.slug} · {item.existingMatch.status}</p> : null}
          {item.errors.map((error) => <p className="bridge-error" key={error}>{error}</p>)}
        </article>;
      })}</div>
      <div className="guide-import-safety-summary" aria-label="Draft import guarantees">
        <strong>Import guarantees</strong>
        <ul><li>The Guide will remain Draft.</li><li>The Guide will remain noindex.</li><li>The Guide will not appear on the homepage.</li><li>Nothing has yet been written.</li></ul>
      </div>
      <p className="bridge-muted">This server-held plan expires {new Date(plan.expiresAt).toLocaleString("en-GB")}. Revalidate if Guide or media records change.</p>
      <div className="guide-import-confirm"><div><p className="eyebrow">Step 3 — Confirm Import</p><strong>{plan.mode === "create-draft" ? "Create the validated Draft Guide" : "Update the validated Draft Guide"}</strong></div><button className="bridge-primary-action" disabled={busy || plan.summary.blocked > 0} type="button" onClick={() => void confirm()}>{busy ? "Creating Draft…" : plan.mode === "create-draft" ? "Confirm Import / Create Draft" : "Confirm Import / Update Draft"}</button></div>
      {plan.summary.blocked ? <p className="bridge-error">Resolve every blocking error and run the dry run again. This batch cannot be partially imported.</p> : null}
    </section> : null}

    {success ? <section className="guide-import-success" role="status"><div><p className="eyebrow">Import complete</p><h2>{message}</h2><p>{success.title} is selected in Guide Manager and remains private until explicitly published.</p></div><a className="bridge-primary-action" href="#guide-editor" onClick={() => void onImported(success.id)}>Open Guide in Editor</a></section> : message ? <p className="bridge-save-message" role="status">{message}</p> : null}
  </details>;
}
