import { useAuthStore } from "./useAuthStore";
import { useLeadStore } from "./useLeadStore";
import { useAgentStore } from "./useAgentStore";
import { useBranchStore } from "./useBranchStore";
import { useNoteStore } from "./useNoteStore";
import { useAnnouncementStore } from "./useAnnouncementStore";
import { useFollowupStore } from "./useFollowupStore";
import { useTimelineStore } from "./useTimelineStore";
import { useOfflinePaymentStore } from "./useOfflinePaymentStore";
import { useTodoStore } from "./useTodoStore";
import { usePartnerStore } from "./usePartnerStore";
import { useApplicationStore } from "./useApplicationStore";
import { useDashboardStore } from "./useDashboardStore";

export function resetAllStores() {
  // Call reset on all stores that expose it. Use optional chaining to be safe.
  try {
    useLeadStore.getState().reset?.();
  } catch (e) {
    console.warn("Failed to reset lead store:", e);
  }

  try {
    useAgentStore.getState().reset?.();
  } catch (e) {
    console.warn("Failed to reset agent store:", e);
  }

  try {
    useBranchStore.getState().reset?.();
  } catch (e) {
    console.warn("Failed to reset branch store:", e);
  }

  try {
    useNoteStore.getState().reset?.();
  } catch (e) {
    console.warn("Failed to reset note store:", e);
  }

  try {
    useAnnouncementStore.getState().reset?.();
  } catch (e) {
    console.warn("Failed to reset announcement store:", e);
  }

  try {
    useFollowupStore.getState().reset?.();
  } catch (e) {
    console.warn("Failed to reset followup store:", e);
  }

  try {
    useTimelineStore.getState().reset?.();
  } catch (e) {
    console.warn("Failed to reset timeline store:", e);
  }

  try {
    useOfflinePaymentStore.getState().reset?.();
  } catch (e) {
    console.warn("Failed to reset offline payment store:", e);
  }

  try {
    useTodoStore.getState().reset?.();
  } catch (e) {
    console.warn("Failed to reset todo store:", e);
  }

  try {
    usePartnerStore.getState().reset?.();
  } catch (e) {
    console.warn("Failed to reset partner store:", e);
  }

  try {
    useApplicationStore.getState().reset?.();
  } catch (e) {
    console.warn("Failed to reset application store:", e);
  }

  try {
    useDashboardStore.getState().reset?.();
  } catch (e) {
    console.warn("Failed to reset dashboard store:", e);
  }
}
