"use client";
import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  async function fetchSubmissions() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin-list");
      const data = await res.json();
      if (res.ok) setSubmissions(data.submissions || []);
      else setError(data.error || "Failed to load submissions");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function handleApprove(id: number, approve: boolean) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approve }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchSubmissions();
      } else {
        alert(data.error || "Action failed");
      }
    } finally {
      setActionLoading(null);
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-[#E4D9FF] flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-6 text-[#273469]">Admin Login</h1>
          <button
            className="px-6 py-2 rounded-lg bg-[#273469] text-[#FAFAFF] font-semibold hover:bg-[#30343F] transition-colors"
            onClick={() => signIn("google")}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 border border-[#E4D9FF]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#273469]">Admin: Approve User Submissions</h1>
          <button className="text-sm underline text-[#273469]" onClick={() => signOut()}>Sign out</button>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="flex flex-col gap-4">
            {submissions.length === 0 && <div>No pending submissions.</div>}
            {submissions.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-[#E4D9FF] bg-[#FAFAFF] flex flex-col gap-1">
                <div className="font-semibold text-lg text-[#273469]">{s.name}</div>
                <div className="text-sm text-[#1E2749]">{s.address}</div>
                <div className="text-xs text-[#30343F] mb-2">{s.description}</div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-1 rounded bg-green-500 text-white font-semibold hover:bg-green-600"
                    onClick={() => handleApprove(s.id, true)}
                    disabled={actionLoading === s.id}
                  >
                    Approve
                  </button>
                  <button
                    className="px-4 py-1 rounded bg-red-500 text-white font-semibold hover:bg-red-600"
                    onClick={() => handleApprove(s.id, false)}
                    disabled={actionLoading === s.id}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
