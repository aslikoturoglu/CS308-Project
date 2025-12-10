// Add item to wishlist (item = { id, name, ... })
export function addToWishlist(wishlist, item) {
    // If item already exists, return unchanged list
    if (wishlist.some((w) => w.id === item.id)) {
      return wishlist;
    }
    return [...wishlist, item];
  }
  
  // Remove item by ID
  export function removeFromWishlist(wishlist, id) {
    return wishlist.filter((w) => w.id !== id);
  }
  