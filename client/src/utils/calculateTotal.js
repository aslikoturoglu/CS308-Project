export function calculateTotal(items) {
    if (!Array.isArray(items)) return 0;
  
    return items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + price * qty;
    }, 0);
  }
  