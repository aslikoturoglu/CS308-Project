export function validateEmail(email) {
    if (typeof email !== "string") return false;
  
    if (!email.trim()) return false;
  
    const pattern = /^[A-Za-z0-9._%+-]+@suhome\.com$/;
  
    return pattern.test(email);
  }
  