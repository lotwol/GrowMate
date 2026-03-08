import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ── Types ──

export interface NotificationSettings {
  wellbeingEnabled: boolean;
  wellbeingHour: number;
  wellbeingMinute: number;
  sowingEnabled: boolean;
  harvestEnabled: boolean;
  permissionAsked: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  wellbeingEnabled: true,
  wellbeingHour: 20,
  wellbeingMinute: 0,
  sowingEnabled: true,
  harvestEnabled: true,
  permissionAsked: false,
};

const STORAGE_KEY = "growmate_notification_settings";

// ── LocalStorage helpers ──

function loadSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: NotificationSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ── Permission ──

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

// ── Show notification ──

function showNotification(title: string, body: string, tag: string) {
  if (getNotificationPermission() !== "granted") return;
  try {
    new Notification(title, { body, tag, icon: "/favicon.ico" });
  } catch {
    // Fallback for mobile browsers that require service worker
  }
}

// ── Scheduling helpers ──

let wellbeingTimerId: ReturnType<typeof setTimeout> | null = null;

function clearWellbeingTimer() {
  if (wellbeingTimerId) {
    clearTimeout(wellbeingTimerId);
    wellbeingTimerId = null;
  }
}

function scheduleWellbeingReminder(hour: number, minute: number, checkDiaryFn: () => Promise<boolean>) {
  clearWellbeingTimer();

  const scheduleNext = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const ms = target.getTime() - now.getTime();

    wellbeingTimerId = setTimeout(async () => {
      const hasEntry = await checkDiaryFn();
      if (!hasEntry) {
        showNotification(
          "🌱 Hur mår du idag?",
          "Ta en minut att logga ditt välmående.",
          "wellbeing-daily"
        );
      }
      // Schedule next day
      scheduleNext();
    }, ms);
  };

  scheduleNext();
}

function scheduleSowingReminders(
  crops: Array<{ name: string; sowDate: string }>,
) {
  const now = new Date();
  crops.forEach((crop) => {
    const sowDate = new Date(crop.sowDate);
    const reminderDate = new Date(sowDate);
    reminderDate.setDate(reminderDate.getDate() - 7);
    reminderDate.setHours(9, 0, 0, 0);

    if (reminderDate > now) {
      const ms = reminderDate.getTime() - now.getTime();
      // Only schedule if within 30 days to avoid too many timers
      if (ms < 30 * 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          showNotification(
            "🌱 Snart dags att så!",
            `Om 7 dagar: dags att förkultivera ${crop.name}!`,
            `sowing-${crop.name}`
          );
        }, ms);
      }
    }
  });
}

function scheduleHarvestReminders(
  crops: Array<{ name: string; harvestDate: string }>,
) {
  const now = new Date();
  crops.forEach((crop) => {
    const harvestDate = new Date(crop.harvestDate);
    const reminderDate = new Date(harvestDate);
    reminderDate.setDate(reminderDate.getDate() - 14);
    reminderDate.setHours(10, 0, 0, 0);

    if (reminderDate > now) {
      const ms = reminderDate.getTime() - now.getTime();
      if (ms < 30 * 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          showNotification(
            "🥕 Skördetid närmar sig!",
            `${crop.name} kan snart vara redo att skördas!`,
            `harvest-${crop.name}`
          );
        }, ms);
      }
    }
  });
}

// ── Main hook ──

export function useNotifications(zone?: string | null) {
  const { user } = useAuth();
  const [settings, setSettingsState] = useState<NotificationSettings>(loadSettings);

  const updateSettings = useCallback((partial: Partial<NotificationSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  // Check if today has a diary entry
  const checkTodayDiary = useCallback(async () => {
    if (!user) return true;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("diary_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("entry_date", today)
      .limit(1);
    return (data && data.length > 0) || false;
  }, [user]);

  // Schedule wellbeing on settings change
  useEffect(() => {
    if (getNotificationPermission() !== "granted") return;
    if (settings.wellbeingEnabled) {
      scheduleWellbeingReminder(settings.wellbeingHour, settings.wellbeingMinute, checkTodayDiary);
    } else {
      clearWellbeingTimer();
    }
    return () => clearWellbeingTimer();
  }, [settings.wellbeingEnabled, settings.wellbeingHour, settings.wellbeingMinute, checkTodayDiary]);

  // Schedule sowing & harvest on load
  useEffect(() => {
    if (!user || !zone || getNotificationPermission() !== "granted") return;

    const fetchAndSchedule = async () => {
      // Sowing reminders for planned crops
      if (settings.sowingEnabled) {
        const { data: crops } = await supabase
          .from("crops")
          .select("name, sow_date")
          .eq("user_id", user.id)
          .eq("status", "planerad")
          .not("sow_date", "is", null);

        if (crops) {
          scheduleSowingReminders(
            crops
              .filter((c) => c.sow_date)
              .map((c) => ({ name: c.name, sowDate: c.sow_date! }))
          );
        }
      }

      // Harvest reminders for planted crops
      if (settings.harvestEnabled) {
        const { data: crops } = await supabase
          .from("crops")
          .select("name, harvest_date")
          .eq("user_id", user.id)
          .eq("status", "utplanterad")
          .not("harvest_date", "is", null);

        if (crops) {
          scheduleHarvestReminders(
            crops
              .filter((c) => c.harvest_date)
              .map((c) => ({ name: c.name, harvestDate: c.harvest_date! }))
          );
        }
      }
    };

    fetchAndSchedule();
  }, [user, zone, settings.sowingEnabled, settings.harvestEnabled]);

  return {
    settings,
    updateSettings,
    requestPermission: requestNotificationPermission,
    permissionStatus: getNotificationPermission(),
  };
}

export function useNotificationPermissionAsked(): [boolean, () => void] {
  const s = loadSettings();
  const markAsked = () => {
    const current = loadSettings();
    saveSettings({ ...current, permissionAsked: true });
  };
  return [s.permissionAsked, markAsked];
}
