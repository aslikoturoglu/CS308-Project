export function validateFullName(name) {
    if (typeof name !== "string") return false;
  
    // içinde en az 1 boşluk olmalı
    return name.trim().includes(" ");
  }
  
  export function validateCardName(name) {
    if (typeof name !== "string") return false;
  
    // içinde en az 1 boşluk olmalı
    return name.trim().includes(" ");
  }
  
  export function validateCardNumber(number) {
    if (typeof number !== "string") return false;
  
    // boşluklara izin ver → temizle
    const cleaned = number.replace(/\s+/g, "");
  
    // sadece rakam mı?
    if (!/^\d+$/.test(cleaned)) return false;
  
    // kaç hane? (14–16 arası)
    return cleaned.length >= 14 && cleaned.length <= 16;
  }
  
  export function validateCVC(cvc) {
    if (typeof cvc !== "string") return false;
  
    // sadece rakam, 3 veya 4 hane
    return /^\d{3,4}$/.test(cvc);
  }
  