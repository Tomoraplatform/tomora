"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Lesson, ModuleWithLessons } from "@/lib/types";
import { Loader2, Save, Video, FileText, ChevronDown } from "lucide-react";

function SaveState({ state }: { state: "" | "saving" | "saved" | "error" }) {
  if (state === "saving")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted">
        <Loader2 className="animate-spin" size={13} /> Saving…
      </span>
    );
  if (state === "saved")
    return <span className="text-xs font-semibold text-success">Saved ✓</span>;
  if (state === "error")
    return <span className="text-xs font-semibold text-error">Failed</span>;
  return null;
}

function LessonEditor({ lesson }: { lesson: Lesson }) {
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description || "");
  const [video, setVideo] = useState(lesson.video_embed_url || "");
  const [pdf, setPdf] = useState(lesson.pdf_view_url || "");
  const [state, setState] = useState<"" | "saving" | "saved" | "error">("");

  async function save() {
    setState("saving");
    try {
      const res = await fetch("/api/admin/update-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lesson",
          id: lesson.id,
          title,
          description,
          video_embed_url: video,
          pdf_view_url: pdf,
        }),
      });
      const data = await res.json();
      setState(data.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface-warm/40 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {lesson.lesson_type === "worksheet" ? (
          <FileText size={14} />
        ) : (
          <Video size={14} />
        )}
        {lesson.lesson_type} lesson
      </div>
      <div className="mt-3 space-y-3">
        <div>
          <Label>Lesson title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[70px]"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Bunny Stream embed URL</Label>
            <Input
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              placeholder="https://iframe.mediadelivery.net/embed/LIB/VIDEO"
            />
          </div>
          <div>
            <Label>Worksheet / PDF view URL</Label>
            <Input
              value={pdf}
              onChange={(e) => setPdf(e.target.value)}
              placeholder="https://… (view-only link)"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save} disabled={state === "saving"}>
            <Save size={15} /> Save lesson
          </Button>
          <SaveState state={state} />
        </div>
      </div>
    </div>
  );
}

function ModuleEditor({ mod }: { mod: ModuleWithLessons }) {
  const [open, setOpen] = useState(mod.module_order <= 1);
  const [title, setTitle] = useState(mod.title);
  const [description, setDescription] = useState(mod.description || "");
  const [state, setState] = useState<"" | "saving" | "saved" | "error">("");

  async function saveModule() {
    setState("saving");
    try {
      const res = await fetch("/api/admin/update-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "module",
          id: mod.id,
          title,
          description,
        }),
      });
      const data = await res.json();
      setState(data.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <Card>
      <CardBody>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {mod.module_order === 0 ? "Start Here" : `Module ${mod.module_order}`}
            </p>
            <p className="mt-0.5 text-lg font-bold tracking-tight">{mod.title}</p>
          </div>
          <ChevronDown
            size={20}
            className={"text-muted transition-transform " + (open ? "rotate-180" : "")}
          />
        </button>

        {open && (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Module title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Module description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="secondary" onClick={saveModule} disabled={state === "saving"}>
                <Save size={15} /> Save module
              </Button>
              <SaveState state={state} />
            </div>

            <div className="space-y-3 border-t border-line pt-4">
              {mod.lessons.map((l) => (
                <LessonEditor key={l.id} lesson={l} />
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function AdminContent({ modules }: { modules: ModuleWithLessons[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Edit module titles, lesson titles, descriptions, Bunny Stream embed URLs
        and view-only worksheet links. Changes save instantly.
      </p>
      {modules.map((m) => (
        <ModuleEditor key={m.id} mod={m} />
      ))}
    </div>
  );
}
