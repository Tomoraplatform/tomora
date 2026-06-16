"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X, UploadCloud, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatNaira } from "@/lib/utils";
import { uploadImage } from "@/lib/upload";
import { saveProduct, deleteProduct, type ProductInput } from "@/app/dashboard/store-actions";
import type { Product } from "@/lib/database.types";

const empty: ProductInput = { name: "", description: "", price: 0, images: [], category: "", stock: 0, is_active: true };

export function ProductsManager({ initial }: { initial: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initial);
  const [editing, setEditing] = useState<ProductInput | null>(null);
  const [open, setOpen] = useState(false);

  function startAdd() { setEditing({ ...empty }); setOpen(true); }
  function startEdit(p: Product) {
    setEditing({ id: p.id, name: p.name, description: p.description || "", price: p.price, images: p.images || [], category: p.category || "", stock: p.stock, is_active: p.is_active });
    setOpen(true);
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    const res = await deleteProduct(id);
    if (res.ok) setProducts((ps) => ps.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Products</h1>
          <p className="mt-1 text-ink/60">Products sync automatically to your published store.</p>
        </div>
        <Button onClick={startAdd}><Plus className="h-4 w-4" /> Add Product</Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/20 p-12 text-center text-ink/50">
          No products yet. Add your first product to start selling.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 bg-cream/60 text-left text-ink/60">
              <tr>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Price</th>
                <th className="hidden p-4 font-medium sm:table-cell">Stock</th>
                <th className="hidden p-4 font-medium sm:table-cell">Status</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-md bg-cream">
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : <ImageOff className="h-4 w-4 text-ink/30" />}
                      </div>
                      <span className="font-medium text-ink">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-ink/80">{formatNaira(p.price)}</td>
                  <td className="hidden p-4 text-ink/80 sm:table-cell">{p.stock}</td>
                  <td className="hidden p-4 sm:table-cell">
                    <Badge variant={p.is_active ? "success" : "secondary"}>{p.is_active ? "Active" : "Hidden"}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => onDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          {editing && (
            <ProductForm
              value={editing}
              onClose={() => setOpen(false)}
              onSaved={() => {
                setOpen(false);
                // Reload to pull the fresh server snapshot (incl. new ids/images).
                window.location.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductForm({ value, onClose, onSaved }: { value: ProductInput; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ProductInput>(value);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof ProductInput, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function addImage(file?: File) {
    if (!file || form.images.length >= 5) return;
    setUploading(true);
    const { url } = await uploadImage(file, "products");
    setUploading(false);
    if (url) set("images", [...form.images, url]);
  }

  async function submit() {
    setSaving(true); setError(null);
    const res = await saveProduct(form);
    setSaving(false);
    if (res.ok) onSaved();
    else setError(res.error || "Could not save.");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Price (NGN)</Label><Input type="number" min={0} value={form.price} onChange={(e) => set("price", Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Stock</Label><Input type="number" min={0} value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} /></div>
      </div>
      <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Dresses" /></div>

      <div className="space-y-2">
        <Label>Images ({form.images.length}/5)</Label>
        <div className="flex flex-wrap gap-2">
          {form.images.map((src, i) => (
            <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button onClick={() => set("images", form.images.filter((_, j) => j !== i))} className="absolute right-0 top-0 bg-black/60 p-0.5 text-white"><X className="h-3 w-3" /></button>
            </div>
          ))}
          {form.images.length < 5 && (
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-ink/25 text-ink/40 hover:bg-ink/5">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => addImage(e.target.files?.[0])} />
            </label>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-ink/10 px-4 py-3">
        <span className="text-sm font-medium">Active (visible in store)</span>
        <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Product</Button>
      </div>
    </div>
  );
}
