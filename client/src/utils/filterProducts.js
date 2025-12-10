// src/utils/filterProducts.js

export function filterProducts(products, searchTerm = "", category = "") {
    if (!Array.isArray(products)) return [];
  
    let result = products;
  
    // --- CATEGORY FILTER ---
    if (category?.trim()) {
      result = result.filter((p) =>
        p.product_category?.toLowerCase() === category.toLowerCase()
      );
    }
  
    // --- SEARCH FILTER ---
    if (searchTerm?.trim()) {
      const s = searchTerm.toLowerCase();
      result = result.filter((p) =>
        p.product_name?.toLowerCase().includes(s)
      );
    }
  
    return result;
  }

  //Kısacası: Ürünün kategori alanı ile senin seçtiğin kategori birebir aynı olmalı.
  