// Utility functions for masking sensitive data

/**
 * Masks a phone number showing only first 2 and last 2 digits
 * Example: 9876543210 -> 98******10
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 4) return phone;
  
  const first = cleaned.slice(0, 2);
  const last = cleaned.slice(-2);
  const middle = "*".repeat(cleaned.length - 4);
  
  return `${first}${middle}${last}`;
}

/**
 * Masks an email address showing only first 2 characters and domain
 * Example: johndoe@example.com -> jo*****@example.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "-";
  
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;
  
  if (localPart.length <= 2) {
    return `${localPart}****@${domain}`;
  }
  
  const visiblePart = localPart.slice(0, 2);
  const maskedPart = "*".repeat(Math.min(localPart.length - 2, 5));
  
  return `${visiblePart}${maskedPart}@${domain}`;
}

/**
 * Unmasks data - returns original value
 */
export function unmask(value: string | null | undefined): string {
  return value || "-";
}
