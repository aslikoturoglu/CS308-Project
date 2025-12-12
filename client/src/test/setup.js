import "@testing-library/jest-dom";
import { vi } from "vitest";

// localStorage mock
if (!global.localStorage) {
  global.localStorage = {
    store: {},
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, value) {
      this.store[key] = String(value);
    },
    clear() {
      this.store = {};
    },
    removeItem(key) {
      delete this.store[key];
    }
  };
}
