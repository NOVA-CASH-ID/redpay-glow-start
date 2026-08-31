import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useRedpay";

export function useIsAdmin() {
  const { session, loading } = useSession();
  const q = useQuery({
    queryKey: ["is-admin", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session!.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
  return {
    session,
    isAdmin: q.data === true,
    loading: loading || (!!session && q.isLoading),
  };
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw error;
      return (data ?? {}) as Record<string, number>;
    },
  });
}

export function useAdminPayments(search: string, status: string) {
  return useQuery({
    queryKey: ["admin-payments", search, status],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_payments", {
        _search: search,
        _status: status,
      });
      if (error) throw error;
      return ((data as { rows?: AdminPayment[] })?.rows ?? []) as AdminPayment[];
    },
  });
}

export function useAdminUsers(search: string, status: string, page: number) {
  return useQuery({
    queryKey: ["admin-users", search, status, page],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users", {
        _search: search,
        _status: status,
        _limit: 20,
        _offset: page * 20,
      });
      if (error) throw error;
      const res = (data ?? {}) as { total?: number; rows?: AdminUser[] };
      return { total: res.total ?? 0, rows: res.rows ?? [] };
    },
  });
}

export function useAdminWithdrawals(status: string) {
  return useQuery({
    queryKey: ["admin-withdrawals", status],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_withdrawals", { _status: status });
      if (error) throw error;
      return ((data as { rows?: AdminWithdrawal[] })?.rows ?? []) as AdminWithdrawal[];
    },
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_settings");
      if (error) throw error;
      return (data ?? {}) as Record<string, Record<string, unknown>>;
    },
  });
}

export function useAppSetting(key: "bank" | "support" | "community" | "withdrawal") {
  return useQuery({
    queryKey: ["app-config", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return (data?.value ?? {}) as Record<string, string | boolean>;
    },
  });
}

export async function saveSetting(key: string, value: Record<string, unknown>) {
  const { data, error } = await supabase.rpc("admin_update_setting", {
    _key: key,
    _value: value as never,
  });
  const res = (data ?? {}) as { ok?: boolean; error?: string };
  if (error || !res.ok) throw new Error(error?.message ?? res.error ?? "Could not save");
}

export type AdminUser = {
  id: string;
  account_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  balance: number | string | null;
  status: string;
  ban_reason: string | null;
  created_at: string;
  last_seen_at: string | null;
};

export type AdminPayment = {
  id: string;
  amount: number | string;
  reference: string | null;
  screenshot_path: string | null;
  status: string;
  purpose: string | null;
  created_at: string;
  admin_note: string | null;
  user_id: string | null;
  account_id: string | null;
  email: string | null;
  full_name: string | null;
};

export type AdminWithdrawal = {
  id: string;
  amount: number | string;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  created_at: string;
  admin_note: string | null;
  user_id: string | null;
  account_id: string | null;
  email: string | null;
  full_name: string | null;
};

export function maskAccount(n: string) {
  if (!n) return "—";
  return n.length <= 4 ? n : "•".repeat(n.length - 4) + n.slice(-4);
}

export type AdminPurchase = {
  id: string;
  network: string;
  card_type: string;
  plan_label: string | null;
  phone: string | null;
  denomination: number | string;
  quantity: number;
  total: number | string;
  rpc_code: string | null;
  status: string;
  created_at: string;
  user_id: string | null;
  account_id: string | null;
  email: string | null;
  full_name: string | null;
};

export function useAdminPurchases(search: string) {
  return useQuery({
    queryKey: ["admin-purchases", search],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_purchases", { _search: search });
      if (error) throw error;
      return ((data as { rows?: AdminPurchase[] })?.rows ?? []) as AdminPurchase[];
    },
  });
}
