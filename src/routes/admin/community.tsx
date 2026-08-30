import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminShell, SettingsCard, Field, Toggle, SaveButton } from "@/components/admin/AdminShell";
import { useAdminSettings, saveSetting } from "@/hooks/useAdmin";

export const Route = createFileRoute("/admin/community")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Community Settings — REDPAY" },
      {
        name: "description",
        content: "Manage the WhatsApp and Telegram group links shown to REDPAY users.",
      },
      { property: "og:title", content: "Admin Community Settings — REDPAY" },
      { property: "og:description", content: "Update REDPAY community group links." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminCommunityPage,
});

function isValidUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function AdminCommunityPage() {
  const queryClient = useQueryClient();
  const settings = useAdminSettings();
  const cfg = (settings.data?.["community"] ?? {}) as Record<string, string | boolean>;

  const [waLink, setWaLink] = useState("");
  const [waText, setWaText] = useState("");
  const [waOn, setWaOn] = useState(true);
  const [tgLink, setTgLink] = useState("");
  const [tgText, setTgText] = useState("");
  const [tgOn, setTgOn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!settings.data) return;
    setWaLink(String(cfg["whatsapp_link"] ?? ""));
    setWaText(String(cfg["whatsapp_text"] ?? "Join WhatsApp Group"));
    setWaOn(cfg["whatsapp_enabled"] !== false);
    setTgLink(String(cfg["telegram_link"] ?? ""));
    setTgText(String(cfg["telegram_text"] ?? "Join Telegram Group"));
    setTgOn(cfg["telegram_enabled"] !== false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.data]);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      if (waOn && waLink.trim() && !isValidUrl(waLink.trim()))
        throw new Error("Enter a valid WhatsApp group link (https://…)");
      if (tgOn && tgLink.trim() && !isValidUrl(tgLink.trim()))
        throw new Error("Enter a valid Telegram group link (https://…)");
      await saveSetting("community", {
        whatsapp_link: waLink.trim(),
        whatsapp_text: waText.trim() || "Join WhatsApp Group",
        whatsapp_enabled: waOn,
        telegram_link: tgLink.trim(),
        telegram_text: tgText.trim() || "Join Telegram Group",
        telegram_enabled: tgOn,
      });
      await queryClient.invalidateQueries();
      setMessage("Community links updated across the app.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save");
    }
    setSaving(false);
  }

  return (
    <AdminShell>
      <SettingsCard title="WhatsApp group">
        <Field label="Group invite link" value={waLink} onChange={setWaLink} placeholder="https://chat.whatsapp.com/…" />
        <Field label="Button text" value={waText} onChange={setWaText} placeholder="Join WhatsApp Group" />
        <Toggle label="Enable WhatsApp group" checked={waOn} onChange={setWaOn} />
      </SettingsCard>

      <SettingsCard title="Telegram group">
        <Field label="Group / channel link" value={tgLink} onChange={setTgLink} placeholder="https://t.me/…" />
        <Field label="Button text" value={tgText} onChange={setTgText} placeholder="Join Telegram Group" />
        <Toggle label="Enable Telegram group" checked={tgOn} onChange={setTgOn} />
      </SettingsCard>

      <SaveButton onClick={save} saving={saving} message={message} />
    </AdminShell>
  );
}
