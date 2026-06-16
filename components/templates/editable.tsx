"use client";

import React from "react";
import { useTemplateEdit } from "./editor-context";
import { cn } from "@/lib/utils";

/**
 * Renders text that becomes inline-editable in the editor. In view mode it is
 * a plain element of the requested tag. Click-to-edit is enabled via the
 * TemplateEditContext.
 */
export function Editable({
  blockId,
  field,
  value,
  as: Tag = "span",
  className,
  multiline = false,
}: {
  blockId: string;
  field: string;
  value: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  multiline?: boolean;
}) {
  const { editing, update } = useTemplateEdit();

  if (!editing) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      className={cn(
        "cursor-text rounded outline-none ring-offset-2 transition-shadow focus:ring-2 focus:ring-blue-400 hover:bg-blue-400/10",
        className
      )}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={`Edit ${field}`}
      onBlur={(e) => update(blockId, field, e.currentTarget.textContent || "")}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}
