"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Search, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Lead } from "@/lib/database.types";

const SOURCE_LABEL: Record<string, string> = {
  contact: "Contact",
  newsletter: "Newsletter",
  register: "Registration",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleString();
}

function csvCell(v: string | null) {
  const s = (v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export function LeadsTable({ leads, siteName }: { leads: Lead[]; siteName: string }) {
  const [q, setQ] = useState("");
  const [source, setSource] = useState<string>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (source !== "all" && l.source !== source) return false;
      if (!needle) return true;
      return [l.name, l.email, l.phone, l.message].some((f) => (f || "").toLowerCase().includes(needle));
    });
  }, [leads, q, source]);

  const slug = siteName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "leads";

  function exportCsv() {
    const header = ["Date", "Source", "Name", "Email", "Phone", "Message"];
    const rows = filtered.map((l) => [
      fmtDate(l.created_at), SOURCE_LABEL[l.source] || l.source, l.name, l.email, l.phone, l.message,
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => csvCell(c as string)).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const rows = filtered.map((l) => `
      <tr>
        <td>${esc(fmtDate(l.created_at))}</td>
        <td>${esc(SOURCE_LABEL[l.source] || l.source)}</td>
        <td>${esc(l.name)}</td>
        <td>${esc(l.email)}</td>
        <td>${esc(l.phone)}</td>
        <td>${esc(l.message)}</td>
      </tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(siteName)} — Leads</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#022245;padding:24px;}
        h1{font-size:18px;margin:0 0 2px;} p{color:#667;font-size:12px;margin:0 0 16px;}
        table{width:100%;border-collapse:collapse;font-size:11px;}
        th,td{border:1px solid #d8dde6;padding:6px 8px;text-align:left;vertical-align:top;}
        th{background:#f3f5f9;text-transform:uppercase;font-size:10px;letter-spacing:.04em;}
      </style></head><body>
      <h1>${esc(siteName)} — Leads</h1>
      <p>${filtered.length} record(s) · exported ${esc(new Date().toLocaleString())}</p>
      <table><thead><tr><th>Date</th><th>Source</th><th>Name</th><th>Email</th><th>Phone</th><th>Message</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="6">No leads.</td></tr>`}</tbody></table>
      <script>window.onload=function(){window.print();}</script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads…" className="pl-9" />
          </div>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-10 rounded-md border border-ink/15 bg-white px-3 text-sm text-ink"
          >
            <option value="all">All sources</option>
            <option value="contact">Contact</option>
            <option value="register">Registration</option>
            <option value="newsletter">Newsletter</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={filtered.length === 0}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-ink/20 p-12 text-center text-ink/50">
          <Inbox className="h-8 w-8" />
          <p>No leads yet. When visitors submit a form on your published site, they&apos;ll appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/50">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Message</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-ink/5 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-ink/60">{fmtDate(l.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-cream px-2 py-0.5 text-xs text-ink/70">{SOURCE_LABEL[l.source] || l.source}</span>
                  </td>
                  <td className="px-4 py-3 text-ink">{l.name || "—"}</td>
                  <td className="px-4 py-3 text-ink/70">{l.email || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink/70">{l.phone || "—"}</td>
                  <td className="min-w-[14rem] max-w-md whitespace-pre-wrap px-4 py-3 text-ink/70">{l.message || "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-ink/40">No leads match your filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function esc(v: string | null) {
  return (v ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
