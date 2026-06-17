"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { uploadCourseMedia } from "@/lib/upload";
import type { Lesson, ModuleWithLessons } from "@/lib/types";
import {
  Loader2,
  Save,
  Video,
  FileText,
  ChevronDown,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
} from "lucide-react";

type SaveStatus = "" | "saving" | "saved" | "error";

function SaveState({ state }: { state: SaveStatus }) {
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

/* ───────────────────────── Upload field ───────────────────────── */

function MediaUpload({
  kind,
  lessonId,
  currentUrl,
  onUploaded,
}: {
  kind: "video" | "worksheet";
  lessonId: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = kind === "video" ? "video/*" : "application/pdf";
  const hasFile = !!currentUrl;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCourseMedia(file, kind, lessonId);
      onUploaded(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin" size={15} /> Uploading…
            </>
          ) : (
            <>
              <Upload size={15} /> {hasFile ? "Replace" : "Upload"}{" "}
              {kind === "video" ? "video" : "worksheet"}
            </>
          )}
        </Button>
        {hasFile && !uploading && (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <CheckCircle2 size={14} /> file attached
          </span>
        )}
      </div>
      {kind === "video" && (
        <p className="mt-1 text-xs text-muted">
          Uploads directly to your Supabase storage. Large files may need a
          higher upload limit (Storage → Settings).
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs font-semibold text-error">{error}</p>
      )}
    </div>
  );
}

/* ───────────────────────── Lesson editor ───────────────────────── */

function LessonEditor({
  lesson,
  onDeleted,
}: {
  lesson: Lesson;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description || "");
  const [video, setVideo] = useState(lesson.video_embed_url || "");
  const [pdf, setPdf] = useState(lesson.pdf_view_url || "");
  const [state, setState] = useState<SaveStatus>("");
  const [deleting, setDeleting] = useState(false);

  async function save(overrides?: { video?: string; pdf?: string }) {
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
          video_embed_url: overrides?.video ?? video,
          pdf_view_url: overrides?.pdf ?? pdf,
        }),
      });
      const data = await res.json();
      setState(data.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  }

  async function remove() {
    if (!confirm(`Delete lesson "${lesson.title}"? This cannot be undone.`))
      return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/manage-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: lesson.id }),
      });
      const data = await res.json();
      if (data.ok) onDeleted();
      else setDeleting(false);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface-warm/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
          {lesson.lesson_type === "worksheet" ? (
            <FileText size={14} />
          ) : (
            <Video size={14} />
          )}
          {lesson.lesson_type} lesson
        </div>
        <button
          onClick={remove}
          disabled={deleting}
          className="inline-flex items-center gap-1 text-xs font-semibold text-error/80 hover:text-error disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 className="animate-spin" size={13} />
          ) : (
            <Trash2 size={13} />
          )}
          Delete
        </button>
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

        {/* Video */}
        <div className="rounded-lg border border-line bg-surface p-3">
          <Label>Video</Label>
          <MediaUpload
            kind="video"
            lessonId={lesson.id}
            currentUrl={video}
            onUploaded={(url) => {
              setVideo(url);
              save({ video: url });
            }}
          />
          <div className="mt-2">
            <Label className="text-xs font-normal text-muted">
              …or paste a Bunny Stream / embed URL
            </Label>
            <Input
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              placeholder="https://iframe.mediadelivery.net/embed/LIB/VIDEO  or  uploaded file URL"
            />
          </div>
        </div>

        {/* Worksheet */}
        <div className="rounded-lg border border-line bg-surface p-3">
          <Label>Worksheet (view-only PDF)</Label>
          <MediaUpload
            kind="worksheet"
            lessonId={lesson.id}
            currentUrl={pdf}
            onUploaded={(url) => {
              setPdf(url);
              save({ pdf: url });
            }}
          />
          <div className="mt-2">
            <Label className="text-xs font-normal text-muted">
              …or paste a PDF view URL
            </Label>
            <Input
              value={pdf}
              onChange={(e) => setPdf(e.target.value)}
              placeholder="https://… (view-only link)"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => save()} disabled={state === "saving"}>
            <Save size={15} /> Save lesson
          </Button>
          <SaveState state={state} />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Module editor ───────────────────────── */

function ModuleEditor({ mod }: { mod: ModuleWithLessons }) {
  const router = useRouter();
  const [open, setOpen] = useState(mod.module_order <= 1);
  const [title, setTitle] = useState(mod.title);
  const [description, setDescription] = useState(mod.description || "");
  const [state, setState] = useState<SaveStatus>("");
  const [busy, setBusy] = useState(false);

  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonType, setNewLessonType] = useState<"video" | "worksheet">(
    "video",
  );

  async function saveModule() {
    setState("saving");
    try {
      const res = await fetch("/api/admin/update-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "module", id: mod.id, title, description }),
      });
      const data = await res.json();
      setState(data.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  }

  async function deleteModule() {
    if (
      !confirm(
        `Delete module "${mod.title}" and all its lessons? This cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    try {
      await fetch("/api/admin/manage-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: mod.id }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function addLesson() {
    setBusy(true);
    try {
      await fetch("/api/admin/manage-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          module_id: mod.id,
          title: newLessonTitle.trim() || "New lesson",
          lesson_type: newLessonType,
        }),
      });
      setNewLessonTitle("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex flex-1 items-center justify-between gap-3 text-left"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                {mod.module_order === 0
                  ? "Start Here"
                  : `Module ${mod.module_order}`}{" "}
                · {mod.lessons.length} lesson
                {mod.lessons.length === 1 ? "" : "s"}
              </p>
              <p className="mt-0.5 text-lg font-bold tracking-tight">
                {mod.title}
              </p>
            </div>
            <ChevronDown
              size={20}
              className={
                "shrink-0 text-muted transition-transform " +
                (open ? "rotate-180" : "")
              }
            />
          </button>
        </div>

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
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={saveModule}
                disabled={state === "saving"}
              >
                <Save size={15} /> Save module
              </Button>
              <SaveState state={state} />
              <button
                onClick={deleteModule}
                disabled={busy}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-error/80 hover:text-error disabled:opacity-50"
              >
                <Trash2 size={13} /> Delete module
              </button>
            </div>

            {/* Lessons */}
            <div className="space-y-3 border-t border-line pt-4">
              {mod.lessons.length === 0 && (
                <p className="rounded-lg border border-dashed border-line bg-surface-warm p-4 text-center text-sm text-muted">
                  No lessons yet. Add your first lesson below.
                </p>
              )}
              {mod.lessons.map((l) => (
                <LessonEditor
                  key={l.id}
                  lesson={l}
                  onDeleted={() => router.refresh()}
                />
              ))}
            </div>

            {/* Add lesson */}
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-accent/30 bg-accent-soft/20 p-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label>New lesson title</Label>
                <Input
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  placeholder="e.g. Lesson 1: Understanding the Opportunity"
                />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  value={newLessonType}
                  onChange={(e) =>
                    setNewLessonType(e.target.value as "video" | "worksheet")
                  }
                  className="h-12 w-full rounded-xl border border-line bg-surface px-3 text-[15px] text-charcoal focus:border-accent focus:outline-none sm:w-36"
                >
                  <option value="video">Video</option>
                  <option value="worksheet">Worksheet</option>
                </select>
              </div>
              <Button size="md" onClick={addLesson} disabled={busy}>
                {busy ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Plus size={16} />
                )}
                Add lesson
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/* ───────────────────────── Root ───────────────────────── */

export function AdminContent({ modules }: { modules: ModuleWithLessons[] }) {
  const router = useRouter();
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function addModule() {
    setAdding(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/manage-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: newModuleTitle.trim() || "New module",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setNewModuleTitle("");
        router.refresh();
      } else {
        setMsg(data.message || "Could not add module.");
      }
    } catch {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Build your course module by module. Add lessons, upload videos and
        worksheets directly, or paste embed links. Changes save instantly.
      </p>

      {/* Add module */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>New module title</Label>
              <Input
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="e.g. Module 1: Set Your Foundation"
              />
            </div>
            <Button onClick={addModule} disabled={adding}>
              {adding ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Plus size={16} />
              )}
              Add module
            </Button>
          </div>
          {msg && (
            <div className="mt-3">
              <Alert tone="error">{msg}</Alert>
            </div>
          )}
        </CardBody>
      </Card>

      {modules.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-surface-warm p-10 text-center text-sm text-muted">
          No modules yet. Add your first module above to start building the
          course.
        </p>
      ) : (
        modules.map((m) => <ModuleEditor key={m.id} mod={m} />)
      )}
    </div>
  );
}
