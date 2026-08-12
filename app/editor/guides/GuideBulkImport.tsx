"use client";

import { useRef, useState } from "react";

type ImportItem = { externalId: string; slug: string; title: string; action: string; valid: boolean; warnings: string[]; errors: string[]; existingMatch: { slug: string; status: string } | null; mediaStatus: string; verificationStatus: string };
type ImportPlan = { planToken: string; expiresAt: string; mode: string; summary: { total: number; valid: number; warnings: number; blocked: number; creates: number; updates: number; duplicates: number }; items: ImportItem[] };

function reportCell(value: unknown) {
  const raw = String(value ?? "");
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function GuideBulkImport({ onImported }: { onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [mode, setMode] = useState<"create-draft" | "update-draft">("create-draft");
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const selectFile = async (file?: File) => {
    if (!file) return;
    const nextFormat = file.name.toLowerCase().endsWith(".csv") ? "csv" : "json";
    setFormat(nextFormat); setFilename(file.name); setContent(await file.text()); setPlan(null); setMessage("");
  };

  const validate = async () => {
    setBusy(true); setMessage(""); setPlan(null);
    try {
      const response = await fetch("/api/editor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "validateGuideImport", format, mode, content }) });
      const result = await response.json() as { plan?: ImportPlan; error?: string; validationErrors?: string[] };
      if (!response.ok || !result.plan) throw new Error(result.validationErrors?.join(" ") || result.error || "The import could not be validated.");
      setPlan(result.plan); setMessage("Dry run complete. No Guides were written.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The import could not be validated."); }
    finally { setBusy(false); }
  };

  const confirm = async () => {
    if (!plan || plan.summary.blocked) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/editor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "confirmGuideImport", planToken: plan.planToken }) });
      const result = await response.json() as { error?: string; imported?: unknown[]; validationErrors?: string[] };
      if (!response.ok) throw new Error(result.validationErrors?.join(" ") || result.error || "The import could not be confirmed.");
      setMessage(`${result.imported?.length || 0} Draft Guide${result.imported?.length === 1 ? "" : "s"} imported. Nothing was published.`); setPlan(null); onImported();
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

  return <details className="bridge-panel guide-bulk-import">
    <summary><strong>Bulk Import</strong><span>JSON or CSV · Drafts only</span></summary>
    <div className="bridge-error"><strong>Bulk imports create Draft Guides only.</strong><span>Nothing is published automatically. Homepage selections are never changed.</span></div>
    <div className="bridge-field-row thirds"><label><span>Import mode</span><select value={mode} onChange={(event) => { setMode(event.target.value as typeof mode); setPlan(null); }}><option value="create-draft">Create Drafts</option><option value="update-draft">Update existing Drafts</option></select></label><label><span>Format</span><select value={format} onChange={(event) => { setFormat(event.target.value as typeof format); setPlan(null); }}><option value="json">JSON contract</option><option value="csv">UTF-8 CSV</option></select></label><div><span>Import file</span><input ref={fileRef} accept=".json,.csv,application/json,text/csv" hidden type="file" onChange={(event) => void selectFile(event.target.files?.[0])} /><button type="button" onClick={() => fileRef.current?.click()}>Upload JSON or CSV</button><small>{filename || "No file selected"}</small></div></div>
    <label><span>{format === "json" ? "Paste JSON envelope" : "CSV content"}</span><textarea className="guide-import-source" spellCheck={false} value={content} onChange={(event) => { setContent(event.target.value); setFilename(""); setPlan(null); }} placeholder={format === "json" ? '{"contract":"oldseadogs.guide-draft","version":1,"mode":"create-draft","guides":[]}' : "externalId,slug,title,guideType,regionKey,regionName"} /></label>
    <div className="bridge-row-actions"><button className="bridge-primary-action" disabled={busy || !content.trim()} type="button" onClick={() => void validate()}>{busy ? "Checking…" : "Validate / Dry Run"}</button>{plan ? <button type="button" onClick={downloadReport}>Download result report</button> : null}</div>
    {plan ? <section className="guide-import-plan"><div className="bridge-stat-grid compact" aria-label="Import plan summary">{Object.entries(plan.summary).map(([label, value]) => <article className="bridge-stat" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div><p className="bridge-muted">Plan expires {new Date(plan.expiresAt).toLocaleString("en-GB")}. Revalidate if Guide or media records change.</p><div className="guide-import-results">{plan.items.map((item) => <article className={item.valid ? "" : "blocked"} key={`${item.externalId}-${item.slug}`}><div><div className="guide-manager-badges"><span>{item.action}</span><span>{item.mediaStatus}</span><span>{item.verificationStatus}</span></div><strong>{item.title || "Untitled Guide"}</strong><small>{item.slug} · {item.externalId}</small>{item.existingMatch ? <small>Existing: {item.existingMatch.slug} · {item.existingMatch.status}</small> : null}</div>{item.warnings.map((warning) => <p className="guide-import-warning" key={warning}>{warning}</p>)}{item.errors.map((error) => <p className="bridge-error" key={error}>{error}</p>)}</article>)}</div><button className="bridge-primary-action" disabled={busy || plan.summary.blocked > 0} type="button" onClick={() => void confirm()}>Confirm Import Drafts</button>{plan.summary.blocked ? <p className="bridge-error">Resolve every blocking error and run the dry run again. This batch cannot be partially imported.</p> : null}</section> : null}
    {message ? <p className="bridge-save-message" role="status">{message}</p> : null}
  </details>;
}
