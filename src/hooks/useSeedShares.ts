import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface SeedShare {
  id: string;
  user_id: string;
  crop_name: string;
  variety: string | null;
  zone: string;
  quantity_description: string | null;
  harvest_year: number | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  interest_count?: number;
}

export interface SeedShareInterest {
  id: string;
  seed_share_id: string;
  interested_user_id: string;
  message: string | null;
  created_at: string;
}

export function useSeedShares(zoneFilter?: string | null) {
  const [shares, setShares] = useState<SeedShare[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("seed_shares" as any)
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (zoneFilter) {
      query = query.eq("zone", zoneFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error loading seed shares:", error);
    }

    const sharesData = (data as any as SeedShare[]) || [];

    // Load interest counts
    if (sharesData.length > 0) {
      const ids = sharesData.map((s) => s.id);
      const { data: interests } = await supabase
        .from("seed_share_interests" as any)
        .select("seed_share_id")
        .in("seed_share_id", ids);

      const countMap: Record<string, number> = {};
      ((interests as any) || []).forEach((i: any) => {
        countMap[i.seed_share_id] = (countMap[i.seed_share_id] || 0) + 1;
      });
      sharesData.forEach((s) => {
        s.interest_count = countMap[s.id] || 0;
      });
    }

    setShares(sharesData);
    setLoading(false);
  }, [zoneFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return { shares, loading, reload: load };
}

export function useMyShares() {
  const { user } = useAuth();
  const [shares, setShares] = useState<SeedShare[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("seed_shares" as any)
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "reserved"])
      .order("created_at", { ascending: false });

    const sharesData = (data as any as SeedShare[]) || [];

    if (sharesData.length > 0) {
      const ids = sharesData.map((s) => s.id);
      const { data: interests } = await supabase
        .from("seed_share_interests" as any)
        .select("seed_share_id")
        .in("seed_share_id", ids);

      const countMap: Record<string, number> = {};
      ((interests as any) || []).forEach((i: any) => {
        countMap[i.seed_share_id] = (countMap[i.seed_share_id] || 0) + 1;
      });
      sharesData.forEach((s) => {
        s.interest_count = countMap[s.id] || 0;
      });
    }

    setShares(sharesData);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { shares, loading, reload: load };
}

export function useCreateSeedShare() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const create = async (data: {
    crop_name: string;
    variety?: string;
    zone: string;
    quantity_description?: string;
    harvest_year?: number;
    notes?: string;
  }) => {
    if (!user) return false;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("seed_shares" as any).insert({
        user_id: user.id,
        crop_name: data.crop_name,
        variety: data.variety || null,
        zone: data.zone,
        quantity_description: data.quantity_description || null,
        harvest_year: data.harvest_year || null,
        notes: data.notes || null,
      } as any);
      if (error) throw error;
      toast({ title: "🌱 Frön delade!", description: "Dina frön är nu synliga för andra odlare." });
      return true;
    } catch (err) {
      console.error("Create seed share error:", err);
      toast({ title: "Fel", description: "Kunde inte dela frön. Försök igen.", variant: "destructive" });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { create, submitting };
}

export function useExpressSeedInterest() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const express = async (seedShareId: string, message?: string) => {
    if (!user) return false;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("seed_share_interests" as any).insert({
        seed_share_id: seedShareId,
        interested_user_id: user.id,
        message: message || null,
      } as any);
      if (error) throw error;
      toast({ title: "✉️ Ditt intresse har skickats!" });
      return true;
    } catch (err) {
      console.error("Express interest error:", err);
      toast({ title: "Fel", description: "Kunde inte skicka intresse. Försök igen.", variant: "destructive" });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { express, submitting };
}

export function useUpdateSeedShareStatus() {
  const [submitting, setSubmitting] = useState(false);

  const update = async (id: string, status: "active" | "reserved" | "gone") => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("seed_shares" as any)
        .update({ status } as any)
        .eq("id", id);
      if (error) throw error;
      const label = status === "gone" ? "Fröna markerade som slut" : "Status uppdaterad";
      toast({ title: `✅ ${label}` });
      return true;
    } catch (err) {
      console.error("Update seed share error:", err);
      toast({ title: "Fel", description: "Kunde inte uppdatera. Försök igen.", variant: "destructive" });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { update, submitting };
}
