import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


export function formatPhoneNumber(phoneNumber) {
  return String(phoneNumber).replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

export function formatEmail(email) {
  return email ? String(email).toLowerCase() : "-";
}

export function formatName(name) {
  return name ? String(name).toLowerCase() : "-";
}

export function numberToRupeesWords(amount) {
  if (amount == null) return "";

  const number = parseFloat(amount);

  if (isNaN(number)) return "";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convert(num) {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    if (num < 1000)
      return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + convert(num % 100) : "");
    if (num < 100000)
      return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convert(num % 1000) : "");
    if (num < 10000000)
      return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convert(num % 100000) : "");
    return convert(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + convert(num % 10000000) : "");
  }

  const rupees = Math.floor(number);
  const paise = Math.round((number - rupees) * 100);

  let result = "";

  if (rupees > 0) {
    result += "Rupees " + convert(rupees);
  }

  if (paise > 0) {
    result += (result ? " and " : "") + convert(paise) + " Paise";
  }

  return result + " Only";
}

export function formatDate(date) {
  if (!date) return "—";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
