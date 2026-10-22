/**
 * Indonesian Currency and Nominal Utilities for TataDana
 * Handles parsing natural language Indonesian currency expressions
 * e.g., '15rb', '15ribu', '1.5jt', '1,5jt', '500k', '2M'
 */

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s+/g, '');
}

export function parseIndonesianNominal(text: string): number | null {
  if (!text) return null;
  const clean = text.toLowerCase().trim().replace(/rp\.?/g, '').trim();

  // Match: digits with optional decimal comma/dot followed by multiplier (k, rb, ribu, jt, juta, m, milyar)
  const regex = /^(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta|m|milyar|miliar)?$/i;
  const match = clean.match(regex);

  if (match) {
    const rawNum = parseFloat(match[1].replace(',', '.'));
    const unit = match[2]?.toLowerCase();

    if (!unit) {
      return isNaN(rawNum) ? null : rawNum;
    }

    switch (unit) {
      case 'k':
      case 'rb':
      case 'ribu':
        return rawNum * 1000;
      case 'jt':
      case 'juta':
        return rawNum * 1000000;
      case 'm':
      case 'milyar':
      case 'miliar':
        return rawNum * 1000000000;
      default:
        return rawNum;
    }
  }

  // Fallback: extract plain number if possible
  const plainNum = parseFloat(clean.replace(/[^\d.-]/g, ''));
  return isNaN(plainNum) ? null : plainNum;
}

export function extractNominalFromSentence(sentence: string): { nominal: number | null; cleanNotes: string } {
  // Regex to detect patterns like 15rb, 15ribu, 500k, 1.5jt, 50.000, 20000
  const tokenRegex = /(\b\d+(?:[.,]\d+)?\s*(?:k|rb|ribu|jt|juta|m|milyar|miliar)\b|\b\d{4,}\b|\brp\.?\s*\d+(?:[.,]\d+)?\s*(?:k|rb|ribu|jt|juta)?\b)/gi;
  const match = sentence.match(tokenRegex);

  if (match && match.length > 0) {
    const matchedToken = match[0];
    const nominal = parseIndonesianNominal(matchedToken);
    const cleanNotes = sentence.replace(matchedToken, '').trim();
    return { nominal, cleanNotes };
  }

  return { nominal: null, cleanNotes: sentence };
}
