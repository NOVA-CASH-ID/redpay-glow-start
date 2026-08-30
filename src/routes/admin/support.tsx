import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminShell, SettingsCard, Field, Toggle, SaveButton } from "@/components/admin/AdminShell";
import { useAdminSettings, saveSetting } from "@/hooks/useAdmin";

export const Route = createFileRoute("/admin/support")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Support Settings — REDPAY" },
      {
        name: "description",
        content: "Manage the WhatsApp and Telegram support links shown to REDPAY users.",
      },
      { property: "og:title", content: "Admin Support Settings — REDPAY" },
      { property: "og:description", content: "Update REDPAY support channels." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminSupportPage,
});

function isValidUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function AdminSupportPage() {
  const queryClient = useQueryClient();
  const settings = useAdminSettings();
  const cfg = (settings.data?.["support"] ?? {}) as Record<string, string | boolean>;

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
    setWaText(String(cfg["whatsapp_text"] ?? "WhatsApp Support"));
    setWaOn(cfg["whatsapp_enabled"] !== false);
    setTgLink(String(cfg["telegram_link"] ?? ""));
    setTgText(String(cfg["telegram_text"] ?? "Telegram Support"));
    setTgOn(cfg["telegram_enabled"] !== false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.data]);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      if (waOn && waLink.trim() && !isValidUrl(waLink.trim()))
        throw new Error("Enter a valid WhatsApp link (https://…)");
      if (tgOn && tgLink.trim() && !isValidUrl(tgLink.trim()))
        throw new Error("Enter a valid Telegram link (https://…)");
      await saveSetting("support", {
        whatsapp_link: waLink.trim(),
        whatsapp_text: waText.trim() || "WhatsApp Support",
        whatsapp_enabled: waOn,
        telegram_link: tgLink.trim(),
        telegram_text: tgText.trim() || "Telegram Support",
        telegram_enabled: tgOn,
      });
      await queryClient.invalidateQueries();
      setMessage("Support settings updated across the app.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save");
    }
    setSaving(false);
  }

  return (
    <AdminShell>
      <SettingsCard title="WhatsApp support">
        <Field label="WhatsApp link" value={waLink} onChange={setWaLink} placeholder="https://wa.me/234…" />
        <Field label="Button text" value={waText} onChange={setWaText} placeholder="WhatsApp Support" />
        <Toggle label="Enable WhatsApp support" checked={waOn} onChange={setWaOn} />
      </SettingsCard>

      <SettingsCard title="Telegram support">
        <Field label="Telegram link" value={tgLink} onChange={setTgLink} placeholder="https://t.me/…" />
        <Field label="Button text" value={tgText} onChange={setTgText} placeholder="Telegram Support" />
        <Toggle label="Enable Telegram support" checked={tgOn} onChange={setTgOn} />
      </SettingsCard>

      <SaveButton onClick={save} saving={saving} message={message} />
    </AdminShell>
  );
}
