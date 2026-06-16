"use client";

import { createContext, useContext } from "react";

export interface TemplateEditApi {
  editing: boolean;
  /** Update a top-level string field on a block. */
  update: (blockId: string, field: string, value: string) => void;
}

const noop: TemplateEditApi = { editing: false, update: () => {} };

export const TemplateEditContext = createContext<TemplateEditApi>(noop);

export function useTemplateEdit() {
  return useContext(TemplateEditContext);
}
