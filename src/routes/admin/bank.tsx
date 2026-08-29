import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminShell, SettingsCard, Field, SaveButton } from "@/components/admin/AdminShell";
import { useAdminSettings, saveSetting } from "@/hooks/useAdmin";

export const Route = createFileRoute("/admin/bank")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Bank Settings — REDPAY" },
      { name: "description", content: "Update the bank account shown to REDPAY users on deposits." },
      { property: "og:title", content: "Admin Bank Settings — REDPAY" },
      { property: "og:description", content: "Manage REDPAY deposit bank details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminBankPage,
});

function AdminBankPage() {
  const queryClient = useQueryClient();
  const settings = useAdminSettings();
  const bank = (settings.data?.['bank'] ?? {}) as Record<string, string>;

  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!settings.data) return;
    setBankName(bank['bank_name'] ?? "");
    setAccountName(bank['account_name'] ?? "");
    setAccountNumber(bank['account_number'] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.data]);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      if (bankName.trim().length < 2 || accountName.trim().length < 3 || accountNumber.trim().length < 10) {
        throw new Error("Enter a valid bank name, account name and 10-digit account number");
      }
      await saveSetting("bank", {
        bank_name: bankName.trim(),
        account_name: accountName.trim(),
        account_number: accountNumber.trim(),
      });
      await queryClient.invalidateQueries();
      setMessage("Bank details updated. Users now see the new account.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save");
    }
    setSaving(false);
  }

  return (
    <AdminShell>
      <section className="glass-card rounded-3xl p-4">
        <h2 className="text-sm font-bold">Current payment bank</h2>
        <dl className="mt-3 space-y-1.5 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Bank name</dt>
            <dd className="font-medium">{bank['bank_name'] || "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Account name</dt>
            <dd className="font-medium">{bank['account_name'] || "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Account number</dt>
            <dd className="font-medium">{bank['account_number'] || "—"}</dd>
          </div>
        </dl>
      </section>

      <SettingsCard title="Edit bank details">
        <Field label="Bank name" value={bankName} onChange={setBankName} placeholder="e.g. Opay" />
        <Field label="Account name" value={accountName} onChange={setAccountName} placeholder="Account holder" />
        <Field
          label="Account number"
          value={accountNumber}
          onChange={(v) => setAccountNumber(v.replace(/\D/g, "").slice(0, 11))}
          placeholder="0123456789"
        />
        <SaveButton onClick={save} saving={saving} message={message} />
      </SettingsCard>
    </AdminShell>
  );
}
