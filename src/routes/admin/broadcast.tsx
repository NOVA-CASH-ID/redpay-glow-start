import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Upload, Megaphone } from "lucide-react";
import { AdminShell, Field, Toggle } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { resolveAnnouncementImage } from "@/hooks/useRedpay";

export const Route = createFileRoute("/admin/broadcast")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Broadcast — REDPAY" },
      {
        name: "description",
        content: "Publish updates and adverts to the update card on every REDPAY user dashboard.",
      },
      { property: "og:title", content: "Admin Broadcast — REDPAY" },
      { property: "og:description", content: "Send updates and adverts to all REDPAY users." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminBroadcastPage,
});

type Row = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};

function useBroadcasts() {
  return useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return Promise.all(
        ((data ?? []) as Row[]).map(async (a) => ({
          ...a,
          preview: await resolveAnnouncementImage(a.image_url),
        })),
      );
    },
  });
}

function AdminBroadcastPage() {
  const queryClient = useQueryClient();
  const list = useBroadcasts();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [body, setBody] = useState("");
  const [active, setActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function publish() {
    setError("");
    setMessage("");
    if (!title.trim()) {
      setError("Add a title for this update");
      return;
    }
    setSaving(true);
    try {
      let imagePath: string | null = null;
      if (file) {
        if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
        if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5MB or smaller");
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("announcements")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        imagePath = path;
      }
      const { error: insErr } = await supabase.from("announcements").insert({
        title: title.trim(),
        subtitle: subtitle.trim(),
        body: body.trim(),
        image_url: imagePath,
        active,
      });
      if (insErr) throw insErr;
      setTitle("");
      setSubtitle("");
      setBody("");
      setFile(null);
      setActive(true);
      setMessage("Update published to every user dashboard");
      await queryClient.invalidateQueries();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish this update");
    }
    setSaving(false);
  }

  async function toggleActive(row: Row) {
    setBusy(row.id);
    await supabase.from("announcements").update({ active: !row.active }).eq("id", row.id);
    await queryClient.invalidateQueries();
    setBusy("");
  }

  async function remove(row: Row) {
    setBusy(row.id);
    if (row.image_url && !/^https?:\/\//i.test(row.image_url)) {
      await supabase.storage.from("announcements").remove([row.image_url]);
    }
    await supabase.from("announcements").delete().eq("id", row.id);
    await queryClient.invalidateQueries();
    setBusy("");
  }

  return (
    <AdminShell>
      <section className="glass-card rounded-3xl p-4">
        <div className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-full bg-primary/12 text-primary">
            <Megaphone className="size-5" strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="text-sm font-bold">New broadcast</h2>
            <p className="text-[11px] text-muted-foreground">
              Shows in the Latest Updates card on every user dashboard
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Title" value={title} onChange={setTitle} placeholder="Big weekend bonus" />
          <Field
            label="Highlight (optional)"
            value={subtitle}
            onChange={setSubtitle}
            placeholder="Ends Sunday"
          />
          <label className="block">
            <span className="mb-1 block px-1 text-[11px] font-medium text-muted-foreground">
              Message
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Write what your users should see…"
              className="w-full rounded-2xl border border-border bg-secondary/50 p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/70"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-secondary/40 px-3 py-3 text-sm">
            <Upload className="size-4 text-primary" />
            <span className="min-w-0 flex-1 truncate">
              {file ? file.name : "Add a picture or advert (optional)"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <Toggle label="Show to users now" checked={active} onChange={setActive} />

          <button
            onClick={publish}
            disabled={saving}
            className="gradient-red flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null} Publish update
          </button>

          {message ? (
            <p className="rounded-2xl bg-primary/10 px-3 py-2.5 text-xs font-medium text-primary">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-2xl bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="px-1 text-sm font-bold">Published updates</h2>
        {list.isLoading ? (
          <div className="mt-6 grid place-items-center">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : (list.data ?? []).length === 0 ? (
          <div className="glass-card mt-4 grid h-28 place-items-center rounded-3xl text-sm text-muted-foreground">
            Nothing broadcast yet
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {(list.data ?? []).map((a) => (
              <li key={a.id} className="glass-card rounded-3xl p-4">
                {a.preview ? (
                  <img
                    src={a.preview}
                    alt={a.title}
                    loading="lazy"
                    className="mb-3 h-28 w-full rounded-2xl object-cover"
                  />
                ) : null}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{a.title}</p>
                    {a.subtitle ? <p className="text-xs text-primary">{a.subtitle}</p> : null}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={
                      a.active
                        ? "shrink-0 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold text-primary"
                        : "shrink-0 rounded-full bg-muted px-3 py-1 text-[11px] font-bold text-muted-foreground"
                    }
                  >
                    {a.active ? "Live" : "Hidden"}
                  </span>
                </div>
                {a.body ? (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{a.body}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    disabled={busy === a.id}
                    onClick={() => toggleActive(a)}
                    className="h-10 rounded-full border border-border bg-secondary/60 px-4 text-xs font-semibold disabled:opacity-45"
                  >
                    {a.active ? "Hide from users" : "Show to users"}
                  </button>
                  <button
                    disabled={busy === a.id}
                    onClick={() => remove(a)}
                    className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-4 text-xs font-semibold text-destructive disabled:opacity-45"
                  >
                    <Trash2 className="size-4" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
