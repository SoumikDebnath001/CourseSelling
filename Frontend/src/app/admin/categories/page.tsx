"use client";

import { useState } from "react";
import { Plus, FolderTree, Pencil, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useCategoriesAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type Category = { _id: string; name: string; description?: string };

export default function AdminCategoriesPage() {
  const { list, create, update, remove } = useCategoriesAdmin();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-ink-900">Categories</h1>
      <p className="mt-1 text-sm text-ink-400">
        A category is the unified category, tag and filter value for courses (e.g. Fast Bowling, Batting, Fitness). Every course must belong to one.
      </p>

      <div className="card mt-5 w-full max-w-lg space-y-3 p-4 sm:p-5">
        <input className="input" placeholder="Category name (e.g. Fast Bowling)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Button
          loading={create.isPending}
          onClick={() => { if (name.trim()) create.mutate({ name: name.trim(), description: description.trim() || undefined }, { onSuccess: () => { setName(""); setDescription(""); } }); }}
        >
          <Plus className="h-4 w-4" /> Add category
        </Button>
      </div>

      <div className="mt-6">
        {list.isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : list.data && list.data.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {list.data.map((c) => (
              <div key={c._id} className="card flex items-center gap-3 p-4">
                <FolderTree className="h-5 w-5 shrink-0 text-pitch-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900">{c.name}</p>
                  {c.description && <p className="truncate text-xs text-ink-400">{c.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => setEditing(c)} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(c)} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400">No categories yet — add one before creating courses.</p>
        )}
      </div>

      {editing && (
        <EditCategoryModal
          category={editing}
          onClose={() => setEditing(null)}
          onSave={(vars) => update.mutate({ id: editing._id, ...vars }, { onSuccess: () => setEditing(null) })}
          saving={update.isPending}
        />
      )}
      {deleting && (
        <DeleteCategoryModal
          category={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => remove.mutate(deleting._id, { onSuccess: () => setDeleting(null) })}
          deleting={remove.isPending}
        />
      )}
    </AdminShell>
  );
}

function EditCategoryModal({
  category,
  onClose,
  onSave,
  saving,
}: {
  category: Category;
  onClose: () => void;
  onSave: (vars: { name: string; description?: string }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-ink-900">Edit category</h3>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase text-ink-400">Name</span>
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase text-ink-400">Description</span>
            <input className="input mt-1" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
        </div>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            loading={saving}
            disabled={!name.trim()}
            onClick={() => onSave({ name: name.trim(), description: description.trim() || undefined })}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteCategoryModal({
  category,
  onClose,
  onConfirm,
  deleting,
}: {
  category: Category;
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
        <h3 className="mt-3 text-lg font-bold text-ink-900">Delete {category.name}?</h3>
        <p className="mt-1 text-sm text-ink-500">Categories used by existing courses can&apos;t be deleted until those courses are reassigned.</p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="danger" className="flex-1" loading={deleting} onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
