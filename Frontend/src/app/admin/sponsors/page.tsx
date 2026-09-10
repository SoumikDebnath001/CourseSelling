"use client";

import { useState, useRef } from "react";
import { Plus, ImageIcon, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminSponsors, useCreateSponsor, useUpdateSponsor, useDeleteSponsor } from "@/hooks/useSponsors";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { Sponsor } from "@/types";

export default function AdminSponsorsPage() {
  const { data: list, isLoading } = useAdminSponsors();
  const create = useCreateSponsor();
  const update = useUpdateSponsor();
  const remove = useDeleteSponsor();

  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [order, setOrder] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [deleting, setDeleting] = useState<Sponsor | null>(null);

  const handleCreate = () => {
    if (!name.trim()) return;
    const fd = new FormData();
    fd.append("name", name.trim());
    if (websiteUrl.trim()) fd.append("websiteUrl", websiteUrl.trim());
    if (order.trim()) fd.append("order", order.trim());
    if (fileInputRef.current?.files?.[0]) {
      fd.append("image", fileInputRef.current.files[0]);
    }
    
    create.mutate(fd, {
      onSuccess: () => {
        setName("");
        setWebsiteUrl("");
        setOrder("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-ink-900">Sponsors</h1>
      <p className="mt-1 text-sm text-ink-400">
        Manage the sponsors and partners displayed on the homepage.
      </p>

      <div className="card mt-5 w-full max-w-lg space-y-3 p-4 sm:p-5">
        <input className="input" placeholder="Sponsor name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Website URL (optional)" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
        <div className="flex gap-3">
          <input className="input flex-1" type="number" placeholder="Order (e.g. 1)" value={order} onChange={(e) => setOrder(e.target.value)} />
          <input
            type="file"
            ref={fileInputRef}
            className="block w-full flex-1 text-sm text-ink-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-amber-50 file:text-amber-700
              hover:file:bg-amber-100 cursor-pointer"
            accept="image/*"
          />
        </div>
        <Button
          loading={create.isPending}
          disabled={!name.trim()}
          onClick={handleCreate}
        >
          <Plus className="h-4 w-4" /> Add Sponsor
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : list && list.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((s) => (
              <div key={s._id} className="card flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink-50 overflow-hidden">
                      {s.imageUrl?.url ? (
                        <Image src={s.imageUrl.url} alt={s.name} width={48} height={48} className="object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-ink-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900 flex items-center gap-2">
                        {s.name}
                        {!s.isActive && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-sm">Inactive</span>}
                      </p>
                      {s.websiteUrl && <p className="truncate text-xs text-ink-400">{s.websiteUrl}</p>}
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-3">
                  <span className="text-xs font-medium text-ink-500">Order: {s.order}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => setEditing(s)} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleting(s)} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400">No sponsors yet.</p>
        )}
      </div>

      {editing && (
        <EditSponsorModal
          sponsor={editing}
          onClose={() => setEditing(null)}
          onSave={(fd) => update.mutate({ id: editing._id, formData: fd }, { onSuccess: () => setEditing(null) })}
          saving={update.isPending}
        />
      )}
      {deleting && (
        <DeleteSponsorModal
          sponsor={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => remove.mutate(deleting._id, { onSuccess: () => setDeleting(null) })}
          deleting={remove.isPending}
        />
      )}
    </AdminShell>
  );
}

function EditSponsorModal({
  sponsor,
  onClose,
  onSave,
  saving,
}: {
  sponsor: Sponsor;
  onClose: () => void;
  onSave: (fd: FormData) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(sponsor.name);
  const [websiteUrl, setWebsiteUrl] = useState(sponsor.websiteUrl ?? "");
  const [order, setOrder] = useState(String(sponsor.order));
  const [isActive, setIsActive] = useState(sponsor.isActive);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const fd = new FormData();
    if (name.trim() !== sponsor.name) fd.append("name", name.trim());
    if (websiteUrl.trim() !== (sponsor.websiteUrl ?? "")) fd.append("websiteUrl", websiteUrl.trim());
    if (Number(order) !== sponsor.order) fd.append("order", order);
    if (isActive !== sponsor.isActive) fd.append("isActive", String(isActive));
    if (fileInputRef.current?.files?.[0]) fd.append("image", fileInputRef.current.files[0]);
    onSave(fd);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-ink-900">Edit Sponsor</h3>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase text-ink-400">Name</span>
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase text-ink-400">Website URL</span>
            <input className="input mt-1" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
          </label>
          <div className="flex gap-3">
            <label className="block flex-1">
              <span className="text-[11px] font-semibold uppercase text-ink-400">Order</span>
              <input className="input mt-1" type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
            </label>
            <label className="block flex-1">
              <span className="text-[11px] font-semibold uppercase text-ink-400">Status</span>
              <div className="mt-1 flex h-10 items-center gap-2 px-3 border border-ink-200 rounded-xl bg-ink-50">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-ink-300 text-pitch-600 focus:ring-pitch-600" />
                <span className="text-sm font-medium">{isActive ? "Active" : "Inactive"}</span>
              </div>
            </label>
          </div>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase text-ink-400">Replace Image</span>
            <input
              type="file"
              ref={fileInputRef}
              className="block w-full mt-1 text-sm text-ink-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-amber-50 file:text-amber-700
                hover:file:bg-amber-100 cursor-pointer border border-ink-200 rounded-xl py-1 px-1"
              accept="image/*"
            />
          </label>
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            loading={saving}
            disabled={!name.trim()}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteSponsorModal({
  sponsor,
  onClose,
  onConfirm,
  deleting,
}: {
  sponsor: Sponsor;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="mt-3 text-lg font-bold text-ink-900">Delete {sponsor.name}?</h3>
        <p className="mt-1 text-sm text-ink-500">This will completely remove the sponsor from the platform.</p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="danger" className="flex-1" loading={deleting} onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
