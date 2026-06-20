"use client";

import { useState } from "react";
import { Plus, FolderTree } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useCategoriesAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminCategoriesPage() {
  const { list, create } = useCategoriesAdmin();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-ink-900">Categories</h1>
      <p className="mt-1 text-sm text-ink-400">
        A category is the unified category, tag and filter value for courses (e.g. Fast Bowling, Batting, Fitness). Every course must belong to one.
      </p>

      <div className="card mt-5 max-w-lg space-y-3 p-5">
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
                <FolderTree className="h-5 w-5 text-pitch-600" />
                <div>
                  <p className="font-semibold text-ink-900">{c.name}</p>
                  {c.description && <p className="text-xs text-ink-400">{c.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400">No categories yet — add one before creating courses.</p>
        )}
      </div>
    </AdminShell>
  );
}
