// WhatsApp / phone helpers shared by the public page and booking flow.

export function normalizeWaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`; // default to India
  return digits;
}

export function waLink(whatsapp: string, message: string): string {
  const number = normalizeWaNumber(whatsapp);
  if (!number) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function telLink(phone: string): string {
  return phone ? `tel:+${normalizeWaNumber(phone)}` : "";
}

export function displayPhone(phone: string): string {
  return phone; // shown exactly as the clinic writes it
}
