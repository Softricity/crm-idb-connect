import { isValidPhoneNumber } from "react-phone-number-input";

export const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validateMobile = (mobile: string) =>
  mobile ? isValidPhoneNumber(mobile) : false;

export const validateName = (name: string) => {
  if (!name.trim()) return "Name is required";
  if (/\d/.test(name)) return "Name cannot contain numbers";
  return "";
};
