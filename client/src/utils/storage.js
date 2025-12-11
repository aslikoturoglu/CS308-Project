// storage.js

export function setItem(key, value) {
    try {
      const json = JSON.stringify(value);
      localStorage.setItem(key, json);
    } catch (error) {
      console.error("setItem error:", error);
    }
  }
  
  export function getItem(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      console.error("getItem error:", error);
      return null;
    }
  }
  
  export function removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("removeItem error:", error);
    }
  }
  