export const SUPPORT_PERMISSIONS = {
  VIEW: 'Support Ticket View',
  REPLY: 'Support Ticket Reply',
  STATUS_UPDATE: 'Support Ticket Status Update',
  MANAGE: 'Support Ticket Manage',
} as const;

export type SupportPermission =
  (typeof SUPPORT_PERMISSIONS)[keyof typeof SUPPORT_PERMISSIONS];
