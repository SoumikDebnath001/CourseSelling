"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useStudents } from "@/hooks/useAdmin";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminStudentsPage() {
  const [search, setSearch] = useState("");
  const { data: students, isLoading } = useStudents(search);

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-ink-900">Members</h1>
      <p className="mt-1 text-sm text-ink-400">Read-only view of academy members (shared accounts). This app never edits them.</p>

      <div className="relative mt-5 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input className="input pl-9" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card mt-5 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : students && students.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase text-ink-400">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {students.map((s) => (
                <tr key={s._id}>
                  <td className="px-4 py-2 font-medium text-ink-800">{s.name}</td>
                  <td className="px-4 py-2 text-ink-500">{s.email}</td>
                  <td className="px-4 py-2"><span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs capitalize text-ink-600">{s.role}</span></td>
                  <td className="px-4 py-2 text-ink-600">{s.enrolledCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-ink-400">No members found.</p>
        )}
      </div>
    </AdminShell>
  );
}
