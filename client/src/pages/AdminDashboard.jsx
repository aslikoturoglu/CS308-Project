/*im the best in the world*/
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fetchProductsWithMeta } from "../services/productService";
import {
  fetchSupportInbox,
  fetchSupportMessages,
  claimSupportConversation,
  unclaimSupportConversation,
  fetchCustomerWishlist,
  sendSupportMessage,
  deleteConversation as deleteConversationApi,
} from "../services/supportService";
import {
  advanceOrderStatus,
  fetchAllOrders,
  fetchUserOrders,
  formatOrderId,
  getNextStatus,
  getOrders,
  updateBackendOrderStatus,
} from "../services/orderService";
import {
  fetchPendingComments,
  approveComment as approveCommentApi,
  rejectComment as rejectCommentApi,
} from "../services/commentService";

const DELIVERY_FILTERS = [
  { id: "All", label: "All" },
  { id: "Processing", label: "Processing" },
  { id: "In-transit", label: "In-transit" },
  { id: "Delivered", label: "Delivered" },
  { id: "Cancelled", label: "Canceled" },
  { id: "Refunded", label: "Refunded" },
];

const DELIVERY_STATUSES = DELIVERY_FILTERS.filter((f) => f.id !== "All").map((f) => f.id);
const PRODUCT_CATEGORIES = ["Living Room", "Bedroom", "Workspace", "Seating", "Tables", "Storage", "Lighting", "Bedding"];

function normalizeDeliveryStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.startsWith("cancel")) return "Cancelled";
  if (normalized === "refunded") return "Refunded";
  if (normalized.includes("transit") || normalized === "shipped" || normalized === "in_transit") return "In-transit";
  if (normalized === "delivered") return "Delivered";
  return "Processing";
}

const rolesToSections = {
  admin: ["dashboard", "product", "sales", "support"],
  product_manager: ["product"],
  sales_manager: ["sales"],
  support: ["support"],
};

const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";

function resolveUploadUrl(url) {
  if (!url) return url;
  if (url.startsWith("/uploads")) return `${API_BASE}${url}`;
  return url;
}

function resolveAttachmentUrl(attachment, fallbackOrderId) {
  if (!attachment?.url) return attachment?.url;
  const fileName = attachment.file_name || "";
  const match = fileName.match(/invoice_ORD-(\d+)/i);
  const orderId = match ? Number(match[1]) : Number(fallbackOrderId);
  if (Number.isFinite(orderId)) {
    return `${API_BASE}/api/orders/${encodeURIComponent(orderId)}/invoice`;
  }
  return resolveUploadUrl(attachment.url);
}

function AdminDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [deliveryTab, setDeliveryTab] = useState("All");
  const [deliveryVisibleCount, setDeliveryVisibleCount] = useState(10);
  const [deliveryStatusPicker, setDeliveryStatusPicker] = useState(null);
  const [expandedDeliveryId, setExpandedDeliveryId] = useState(null);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatPage, setChatPage] = useState(1);
  const CHAT_PAGE_SIZE = 6;
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [showUnclaimedOnly, setShowUnclaimedOnly] = useState(true);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerWishlist, setCustomerWishlist] = useState([]);
  const [isLoadingCustomerInfo, setIsLoadingCustomerInfo] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [returnRequests, setReturnRequests] = useState([]);
  const [isLoadingReturns, setIsLoadingReturns] = useState(false);
  const [filters, setFilters] = useState({ invoiceFrom: "", invoiceTo: "" });
  const [invoices, setInvoices] = useState([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [reportFilters, setReportFilters] = useState({ from: "", to: "" });
  const [reportData, setReportData] = useState({
    totals: { revenue: 0, cost: 0, profit: 0 },
    series: [],
  });
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", category: "" });
  const [discountForm, setDiscountForm] = useState({
    productId: "",
    rate: 10,
    startAt: "",
    endAt: "",
  });
  const [priceUpdate, setPriceUpdate] = useState({ productId: "", price: "" });
  const [costUpdate, setCostUpdate] = useState({ productId: "", cost: "" });
  const [deliveryUpdate, setDeliveryUpdate] = useState({ id: "", status: "" });
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const productListRef = useRef(null);
  const replyFileInputRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchProductsWithMeta(controller.signal)
      .then((data) => setProducts(data))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        addToast("Failed to load products", "error");
      });
    return () => controller.abort();
  }, [addToast]);

  const refreshPendingReviews = useCallback(async () => {
    try {
      const list = await fetchPendingComments();
      setPendingReviews(list);
    } catch (error) {
      console.error("Pending reviews load failed", error);
      setPendingReviews([]);
      addToast("Pending reviews could not be loaded", "error");
    }
  }, [addToast]);

  const loadOrders = useCallback(async () => {
    try {
      const remote = await fetchAllOrders();
      setOrders(remote);
    } catch (error) {
      console.error("Orders load failed, fallback to local:", error);
      setOrders(getOrders());
      addToast("Orders could not be loaded from server, showing local data", "error");
    }
  }, [addToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setDeliveries(
      orders.map((order) => ({
        id: order.id,
        orderId: formatOrderId(order.id),
        product: order.items?.[0]?.name || "Order items",
        status: normalizeDeliveryStatus(order.status),
        address: order.address,
        date: order.date,
      }))
    );
  }, [orders]);

  useEffect(() => {
    setDeliveryVisibleCount(10);
    setDeliveryStatusPicker(null);
  }, [deliveryTab, orders.length]);

  const loadInbox = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const list = await fetchSupportInbox();
      setChats(list);
      const hasActive = list.some((c) => c.id === activeConversationId);
      if ((!activeConversationId || !hasActive) && list.length > 0) {
        setActiveConversationId(list[0].id);
      }
    } catch (error) {
      console.error("Support inbox fetch failed", error);
      addToast("Support queue yüklenemedi", "error");
    } finally {
      setIsLoadingChats(false);
    }
  }, [activeConversationId, addToast]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeConversationId) || null,
    [chats, activeConversationId]
  );
  const filteredChats = useMemo(() => {
    if (!showUnclaimedOnly) return chats;
    return chats.filter((chat) => chat.status === "open");
  }, [chats, showUnclaimedOnly]);

  useEffect(() => {
    setChatPage(1);
  }, [showUnclaimedOnly]);

  useEffect(() => {
    if (!showUnclaimedOnly) return;
    if (!activeConversationId) return;
    const stillVisible = filteredChats.some((chat) => chat.id === activeConversationId);
    if (!stillVisible && filteredChats.length > 0) {
      setActiveConversationId(filteredChats[0].id);
    }
  }, [showUnclaimedOnly, filteredChats, activeConversationId]);

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 4000);
    return () => clearInterval(interval);
  }, [loadInbox]);

  useEffect(() => {
    refreshPendingReviews();
  }, [refreshPendingReviews]);

  useEffect(() => {
    if (activeSection !== "support") return;
    setIsLoadingReturns(true);
    fetch("/api/sales/return-requests")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReturnRequests(data);
        } else {
          setReturnRequests([]);
        }
      })
      .catch((error) => {
        console.error("Return requests fetch failed", error);
        addToast("Return requests could not be loaded", "error");
        setReturnRequests([]);
      })
      .finally(() => setIsLoadingReturns(false));
  }, [activeSection, addToast]);

  const handleViewLowStock = () => {
    setShowLowStockOnly(true);
    setActiveSection("product");
    setTimeout(() => {
      productListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsCompactLayout(window.innerWidth < 1200);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!activeConversationId) return undefined;
    const fetchThread = (options = { showSpinner: false }) => {
      if (options.showSpinner) setIsLoadingThread(true);
      fetchSupportMessages(activeConversationId)
        .then((data) => setChatMessages(data.messages || []))
        .catch((error) => {
          console.error("Support messages fetch failed", error);
          addToast("Konuşma açılamadı", "error");
        })
        .finally(() => {
          if (options.showSpinner) setIsLoadingThread(false);
        });
    };
    fetchThread({ showSpinner: true });
    const interval = setInterval(() => fetchThread({ showSpinner: false }), 3000);
    return () => clearInterval(interval);
  }, [activeConversationId, addToast]);

  useEffect(() => {
    if (!activeChat?.user_id) {
      setCustomerOrders([]);
      setCustomerWishlist([]);
      return undefined;
    }

    let isMounted = true;
    const controller = new AbortController();
    setIsLoadingCustomerInfo(true);

    Promise.allSettled([
      fetchUserOrders(activeChat.user_id, controller.signal),
      fetchCustomerWishlist(activeChat.user_id),
    ])
      .then(([ordersResult, wishlistResult]) => {
        if (!isMounted) return;
        if (ordersResult.status === "fulfilled") {
          setCustomerOrders(ordersResult.value);
        } else {
          console.error("Customer orders fetch failed", ordersResult.reason);
          setCustomerOrders([]);
          addToast("Customer orders could not be loaded", "error");
        }

        if (wishlistResult.status === "fulfilled") {
          setCustomerWishlist(Array.isArray(wishlistResult.value) ? wishlistResult.value : []);
        } else {
          console.error("Customer wishlist fetch failed", wishlistResult.reason);
          setCustomerWishlist([]);
          addToast("Customer wishlist could not be loaded", "error");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingCustomerInfo(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activeChat?.user_id, addToast]);

  const handleDeleteConversation = async (conversationId) => {
    if (!conversationId) return;
    if (!window.confirm("Delete this conversation and all its messages?")) return;
    try {
      await deleteConversationApi(conversationId);
      setChats((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) {
        const remaining = chats.filter((c) => c.id !== conversationId);
        setActiveConversationId(remaining[0]?.id ?? null);
        setChatMessages([]);
      }
      addToast("Conversation deleted", "info");
    } catch (error) {
      console.error("Conversation delete failed", error);
      addToast("Conversation could not be deleted", "error");
    }
  };

  const permittedSections = rolesToSections[user?.role] || [];
  useEffect(() => {
    if (!permittedSections.includes(activeSection)) {
      setActiveSection(permittedSections[0] || "dashboard");
    }
  }, [activeSection, permittedSections]);

  const totals = useMemo(() => {
    const todayUtc = new Date().toISOString().slice(0, 10);
    const revenue = orders.reduce((sum, o) => {
      const orderDay = o?.date ? new Date(o.date).toISOString().slice(0, 10) : null;
      if (orderDay !== todayUtc) return sum;
      return sum + (Number(o.total) || 0);
    }, 0);
    const lowStock = products.filter((p) => p.availableStock < 5).length;
    return { revenue, lowStock };
  }, [orders, products]);

  const visibleProducts = useMemo(
    () => (showLowStockOnly ? products.filter((p) => p.availableStock < 5) : products),
    [products, showLowStockOnly]
  );

  const filteredInvoices = useMemo(() => {
    if (!filters.invoiceFrom && !filters.invoiceTo) return invoices;
    const from = filters.invoiceFrom ? Date.parse(filters.invoiceFrom) : -Infinity;
    const to = filters.invoiceTo ? Date.parse(filters.invoiceTo) : Infinity;
    return invoices.filter((inv) => {
      const ts = Date.parse(inv.issued_at || inv.date || "");
      return Number.isFinite(ts) ? ts >= from && ts <= to : false;
    });
  }, [filters.invoiceFrom, filters.invoiceTo, invoices]);

  const reportBreakdown = useMemo(() => {
    const revenue = Number(reportData.totals?.revenue || 0);
    const cost = Number(reportData.totals?.cost || 0);
    const profit = Number(reportData.totals?.profit || 0);
    const netProfit = profit > 0 ? profit : 0;
    const loss = profit < 0 ? Math.abs(profit) : 0;
    const total = cost + netProfit + loss;
    const safeTotal = total > 0 ? total : 1;
    return { revenue, cost, profit, netProfit, loss, total, safeTotal };
  }, [reportData.totals]);

  const filteredDeliveries = useMemo(() => {
    const sorted = [...deliveries].sort((a, b) => {
      const tsA = Date.parse(a.date || "") || 0;
      const tsB = Date.parse(b.date || "") || 0;
      if (tsA !== tsB) return tsB - tsA;
      const numA = Number(a.id) || 0;
      const numB = Number(b.id) || 0;
      return numB - numA;
    });
    if (deliveryTab === "All") return sorted;
    const normalizedTab = normalizeDeliveryStatus(deliveryTab);
    return sorted.filter((d) => normalizeDeliveryStatus(d.status) === normalizedTab);
  }, [deliveries, deliveryTab]);

  const visibleDeliveries = useMemo(
    () => filteredDeliveries.slice(0, deliveryVisibleCount),
    [filteredDeliveries, deliveryVisibleCount]
  );

  const canLoadMoreDeliveries = filteredDeliveries.length > deliveryVisibleCount;
  const canLoadLessDeliveries = deliveryVisibleCount > 10;
  const getOrderByDeliveryId = useCallback(
    (deliveryId) => orders.find((o) => String(o.id) === String(deliveryId)),
    [orders]
  );

  const groupedOrders = useMemo(() => {
    const groups = {
      Processing: [],
      "In-transit": [],
      Delivered: [],
    };
    const parseDate = (value) => Date.parse(value) || 0;
    orders.forEach((o) => {
      const key =
        o.status === "Delivered"
          ? "Delivered"
          : o.status === "In-transit"
          ? "In-transit"
          : "Processing";
      groups[key].push(o);
    });
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0));
    });
    return groups;
  }, [orders]);

  const [orderTab, setOrderTab] = useState("Processing");
  const ordersForActiveTab = groupedOrders[orderTab] || [];

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      addToast("Name and price required", "error");
      return;
    }
    const product = {
      id: Date.now(),
      name: newProduct.name,
      price: Number(newProduct.price),
      availableStock: Number(newProduct.stock || 0),
      category: newProduct.category || "General",
      averageRating: 0,
      ratingCount: 0,
    };
    setProducts((prev) => [...prev, product]);
    setNewProduct({ name: "", price: "", stock: "", category: "" });
    addToast("Product added (local only)", "info");
  };

  const handlePriceUpdate = async () => {
    if (!priceUpdate.productId || !priceUpdate.price) {
      addToast("Select product and price", "error");
      return;
    }
    try {
      const body = new URLSearchParams();
      body.set("price", priceUpdate.price);
      const res = await fetch(`/api/sales/products/${priceUpdate.productId}/price`, {
        method: "PUT",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Price update failed");
      }
      await loadOrders();
      const controller = new AbortController();
      const refreshed = await fetchProductsWithMeta(controller.signal);
      setProducts(refreshed);
      addToast("Price updated", "info");
    } catch (error) {
      console.error("Price update failed:", error);
      addToast(error.message || "Price update failed", "error");
    }
  };

  const handleCostUpdate = async () => {
    if (!costUpdate.productId || costUpdate.cost === "") {
      addToast("Select product and cost", "error");
      return;
    }
    try {
      const body = new URLSearchParams();
      body.set("cost", costUpdate.cost);
      const res = await fetch(`/api/sales/products/${costUpdate.productId}/cost`, {
        method: "PUT",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Cost update failed");
      }
      addToast("Cost updated", "info");
    } catch (error) {
      console.error("Cost update failed:", error);
      addToast(error.message || "Cost update failed", "error");
    }
  };


  const handleDiscount = async () => {
    if (!discountForm.productId) {
      addToast("Select product", "error");
      return;
    }
    if (!discountForm.startAt || !discountForm.endAt) {
      addToast("Start and end dates are required", "error");
      return;
    }
    try {
      const body = new URLSearchParams();
      body.set("rate", String(discountForm.rate));
      body.set("start_at", discountForm.startAt);
      body.set("end_at", discountForm.endAt);
      body.set("product_ids", String(discountForm.productId));
      const res = await fetch("/api/sales/discounts/apply", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Discount apply failed");
      }
      const controller = new AbortController();
      const refreshed = await fetchProductsWithMeta(controller.signal);
      setProducts(refreshed);
      addToast(`Discount applied (${data?.notified || 0} notified)`, "info");
    } catch (error) {
      console.error("Discount apply failed:", error);
      addToast(error.message || "Discount apply failed", "error");
    }
  };
  const handleLoadInvoices = async () => {
    if (!filters.invoiceFrom || !filters.invoiceTo) {
      addToast("Select invoice date range", "error");
      return;
    }
    setIsLoadingInvoices(true);
    try {
      const params = new URLSearchParams();
      params.set("from", filters.invoiceFrom);
      params.set("to", filters.invoiceTo);
      const res = await fetch(`/api/sales/invoices?${params.toString()}`);
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(data?.error || "Invoices could not be loaded");
      }
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Invoice load failed:", error);
      setInvoices([]);
      addToast(error.message || "Invoices could not be loaded", "error");
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const handleLoadReport = async () => {
    if (!reportFilters.from || !reportFilters.to) {
      addToast("Select report date range", "error");
      return;
    }
    setIsLoadingReport(true);
    try {
      const params = new URLSearchParams();
      params.set("from", reportFilters.from);
      params.set("to", reportFilters.to);
      const res = await fetch(`/api/sales/reports/profit?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Report could not be loaded");
      }
      setReportData({
        totals: data?.totals || { revenue: 0, cost: 0, profit: 0 },
        series: Array.isArray(data?.series) ? data.series : [],
      });
    } catch (error) {
      console.error("Report load failed:", error);
      setReportData({ totals: { revenue: 0, cost: 0, profit: 0 }, series: [] });
      addToast(error.message || "Report could not be loaded", "error");
    } finally {
      setIsLoadingReport(false);
    }
  };

  const buildInvoiceUrl = (orderId) => `/api/orders/${encodeURIComponent(orderId)}/invoice`;

  const handleViewInvoice = (orderId) => {
    window.open(buildInvoiceUrl(orderId), "_blank", "noopener,noreferrer");
  };

  const handlePrintInvoice = (orderId) => {
    const win = window.open(buildInvoiceUrl(orderId), "_blank", "noopener,noreferrer");
    if (!win) {
      addToast("Popup blocked", "error");
      return;
    }
    win.addEventListener("load", () => {
      win.focus();
      win.print();
    });
  };

  const handleDownloadInvoice = (orderId) => {
    const link = document.createElement("a");
    link.href = buildInvoiceUrl(orderId);
    link.download = `invoice_${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const applyDeliveryStatus = async (deliveryId, nextStatus) => {
    if (!deliveryId || !nextStatus) {
      addToast("Select delivery and status", "error");
      return;
    }
    const normalizedStatus = normalizeDeliveryStatus(nextStatus);
    if (!DELIVERY_STATUSES.includes(normalizedStatus)) {
      addToast("Select a valid status", "error");
      return;
    }
    const numericId = Number(deliveryId);
    const isBackendOrder = Number.isFinite(numericId);
    try {
      if (isBackendOrder) {
        await updateBackendOrderStatus(numericId, normalizedStatus);
      }
      setDeliveries((prev) =>
        prev.map((d) => (String(d.id) === String(deliveryId) ? { ...d, status: normalizedStatus } : d))
      );
      setOrders((prev) =>
        prev.map((o) =>
          String(o.id) === String(deliveryId) ? { ...o, status: normalizedStatus } : o
        )
      );
      if (isBackendOrder) {
        await loadOrders();
      }
      addToast("Delivery status updated", "info");
    } catch (error) {
      console.error("Delivery update failed", error);
      addToast(error.message || "Delivery status could not be updated", "error");
    }
  };

  const handleDeliveryStatus = async () => {
    await applyDeliveryStatus(deliveryUpdate.id, deliveryUpdate.status);
  };

  const handleInlineStatusClick = (delivery) => {
    setDeliveryStatusPicker((prev) => (prev === delivery.id ? null : delivery.id));
  };

  const handleSelectStatusOption = async (delivery, status) => {
    await applyDeliveryStatus(delivery.id, status);
    setDeliveryStatusPicker(null);
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setReplyDraft("");
  };

  const handleClaimConversation = async (conversationId) => {
    try {
      await claimSupportConversation(conversationId);
      setChats((prev) =>
        prev.map((chat) => (chat.id === conversationId ? { ...chat, status: "pending" } : chat))
      );
      addToast("Conversation claimed", "info");
    } catch (error) {
      console.error("Support claim failed", error);
      addToast("Conversation could not be claimed", "error");
    }
  };

  const handleUnclaimConversation = async (conversationId) => {
    try {
      await unclaimSupportConversation(conversationId);
      setChats((prev) =>
        prev.map((chat) => (chat.id === conversationId ? { ...chat, status: "open" } : chat))
      );
      addToast("Conversation unclaimed", "info");
    } catch (error) {
      console.error("Support unclaim failed", error);
      addToast("Conversation could not be unclaimed", "error");
    }
  };

  const handleAdvanceOrder = async (orderId) => {
    const current = orders.find(
      (o) =>
        String(o.id) === String(orderId) ||
        formatOrderId(o.id) === formatOrderId(orderId) ||
        o.formattedId === orderId
    );

    if (!current) {
      addToast("Order not found", "error");
      return;
    }

    const { nextStatus, nextIndex } = getNextStatus(current);
    if (current.status === "Delivered" || nextStatus === current.status) {
      addToast("Order already delivered", "info");
      return;
    }

    const isBackendOrder = Number.isFinite(Number(current.id));

    if (isBackendOrder) {
      try {
        await updateBackendOrderStatus(current.id, nextStatus);
        await loadOrders();
        addToast("Order advanced to next status", "info");
        return;
      } catch (error) {
        console.error("Backend status update failed, falling back:", error);
        addToast(error.message || "Backend update failed", "error");
      }
    }

    const result = advanceOrderStatus(orderId, user);
    if (result.error) {
      addToast(result.error, "error");
      return;
    }
    setOrders(result.orders);
    addToast("Order advanced to next status", "info");
  };

  const handleApproveReview = async (commentId) => {
    try {
      await approveCommentApi(commentId);
      await refreshPendingReviews();
      addToast("Review approved", "info");
    } catch (error) {
      console.error("Review approve failed", error);
      addToast("Review approve failed", "error");
    }
  };

  const handleRejectReview = async (commentId) => {
    try {
      await rejectCommentApi(commentId);
      await refreshPendingReviews();
      addToast("Review rejected", "info");
    } catch (error) {
      console.error("Review reject failed", error);
      addToast("Review reject failed", "error");
    }
  };

  const handleSendReply = async () => {
    const hasText = replyDraft.trim().length > 0;
    const hasFiles = replyFiles.length > 0;
    if ((!hasText && !hasFiles) || !activeConversationId) {
      addToast("Mesaj veya dosya ekleyin", "error");
      return;
    }

    setIsSendingReply(true);
    try {
      const agentId = Number(user?.id);
      const payload = await sendSupportMessage({
        conversationId: activeConversationId,
        agentId: Number.isFinite(agentId) && agentId > 0 ? agentId : undefined,
        text: replyDraft,
        attachments: replyFiles,
      });

      if (payload?.message) {
        setChatMessages((prev) => [...prev, payload.message]);
      }
      setReplyDraft("");
      setReplyFiles([]);
      if (replyFileInputRef.current) replyFileInputRef.current.value = "";
      loadInbox();
      // thread hemen güncellensin
      fetchSupportMessages(activeConversationId)
        .then((data) => setChatMessages(data.messages || []))
        .catch(() => {});
    } catch (error) {
      console.error("Support reply failed", error);
      addToast("Mesaj gönderilemedi", "error");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSelectReplyFiles = (event) => {
    const selected = Array.from(event.target.files || []).slice(0, 4);
    setReplyFiles(selected);
  };

  const handleRemoveReplyFile = (name) => {
    setReplyFiles((prev) => prev.filter((file) => file.name !== name));
    if (replyFileInputRef.current) replyFileInputRef.current.value = "";
  };

  const sections = [
    { id: "dashboard", label: "Overview" },
    { id: "product", label: "Product Manager" },
    { id: "sales", label: "Sales Manager" },
    { id: "support", label: "Support" },
  ].filter((s) => permittedSections.includes(s.id));

  return (
    <div
      style={{
        background: "#f3f4f6",
        minHeight: "calc(100vh - 160px)",
        padding: "28px 16px 72px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        <aside
          style={{
            background: "white",
            borderRadius: 14,
            padding: 16,
            boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
            display: "grid",
            gap: 10,
            flex: "0 0 260px",
            minWidth: 220,
          }}
        >
          <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>Admin Panel</h3>
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              style={{
                textAlign: "left",
                border: "1px solid #e5e7eb",
                background: activeSection === s.id ? "#0058a3" : "white",
                color: activeSection === s.id ? "white" : "#0f172a",
                padding: "10px 12px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {s.label}
            </button>
          ))}
        </aside>

        <main
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            flex: "1 1 0",
            minWidth: 0,
          }}
        >
          {activeSection !== "support" && (
            <header
              style={{
                background: "white",
                borderRadius: 16,
                padding: 18,
                boxShadow: "0 18px 40px rgba(0,0,0,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ margin: "0 0 6px", color: "#6b7280", fontWeight: 700 }}>
                  Admin workspace / {activeSection}
                </p>
                <h1 style={{ margin: 0, color: "#0f172a" }}>Dashboard</h1>
                <p style={{ margin: "6px 0 0", color: "#475569" }}>Role: {user?.role || "customer"}</p>
              </div>
              {user?.role !== "product_manager" && (
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, color: "#6b7280" }}>Today&apos;s revenue</p>
                  <strong style={{ fontSize: "1.4rem", color: "#0058a3" }}>
                    ₺{totals.revenue.toLocaleString("tr-TR")}
                  </strong>
                </div>
              )}
            </header>
          )}

          {activeSection === "dashboard" && (
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {[
                { label: "Revenue (7d)", value: "₺125,430", change: "+8.2%", tone: "#0058a3" },
                { label: "Orders", value: "312", change: "+5.4%", tone: "#f59e0b" },
                { label: "Low stock", value: totals.lowStock, change: "Restock soon", tone: "#ef4444" },
                {
                  label: "Active chats",
                  value: chats.filter((c) => c.status !== "closed").length,
                  change: "Support",
                  tone: "#0ea5e9",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    background: "white",
                    borderRadius: 14,
                    padding: 16,
                    boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                    borderLeft: `6px solid ${card.tone}`,
                  }}
                >
                  <p style={{ margin: "0 0 6px", color: "#6b7280", fontWeight: 700 }}>{card.label}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>{card.value}</span>
                    <span style={{ color: card.tone, fontWeight: 700, fontSize: "0.95rem" }}>{card.change}</span>
                  </div>
                </div>
              ))}
            </section>
          )}

          {activeSection === "product" && (
            <section style={{ display: "grid", gap: 18 }}>
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                  display: "grid",
                  gap: 12,
                }}
              >
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Product Manager Panel</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
                  <input
                    placeholder="Name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Price"
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))}
                    style={inputStyle}
                  />
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Category</option>
                    {PRODUCT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="button" onClick={handleAddProduct} style={{ ...primaryBtn, marginTop: 10 }}>
                  Add product
                </button>
              </div>

              <div
                style={{
                  background: "white",
                  borderRadius: 14,
              padding: 18,
              boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
              display: "grid",
              gap: 12,
            }}
            ref={productListRef}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h4 style={{ margin: 0 }}>Product list</h4>
              {showLowStockOnly ? (
                <button type="button" style={linkBtn} onClick={() => setShowLowStockOnly(false)}>
                  Clear low-stock filter
                </button>
              ) : (
                <button type="button" style={linkBtn} onClick={() => setShowLowStockOnly(true)}>
                  Show low stock
                </button>
              )}
            </div>
            <div style={{ maxHeight: 320, overflow: "auto", border: "1px solid #e5e7eb", borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                    <th style={th}>Name</th>
                        <th style={th}>Price</th>
                        <th style={th}>Stock</th>
                    <th style={th}>Category</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={td}>{p.name}</td>
                      <td style={td}>
                        <div style={{ display: "grid", gap: 2 }}>
                          <span style={{ fontWeight: 700 }}>₺{p.price.toLocaleString("tr-TR")}</span>
                          {p.hasDiscount && (
                            <span style={{ color: "#94a3b8", textDecoration: "line-through", fontSize: "0.85rem" }}>
                              ₺{Number(p.originalPrice || 0).toLocaleString("tr-TR")}
                            </span>
                          )}
                        </div>
                      </td>
                          <td style={td}>{p.availableStock}</td>
                          <td style={td}>{p.category || "General"}</td>
                          <td style={td}>
                            <button type="button" style={linkBtn} onClick={() => addToast("Edit (local only)", "info")}>
                              Edit
                            </button>
                            <button
                              type="button"
                              style={linkBtn}
                              onClick={() => setProducts((prev) => prev.filter((x) => x.id !== p.id))}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                  display: "grid",
                  gap: 10,
                }}
              >
                <h4 style={{ margin: 0 }}>Review approvals</h4>
                {pendingReviews.length === 0 ? (
                  <p style={{ margin: 0, color: "#6b7280" }}>No pending reviews.</p>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {pendingReviews.map((rev) => {
                      const productName =
                        rev.product_name ||
                        products.find((p) => Number(p.id) === Number(rev.product_id))?.name ||
                        `Product #${rev.product_id}`;
                      return (
                        <div
                          key={rev.comment_id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            padding: 10,
                            display: "grid",
                            gap: 6,
                            background: "#f8fafc",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{productName}</p>
                              <small style={{ color: "#64748b" }}>{rev.user_name || "User"}</small>
                            </div>
                            <div style={{ color: "#f59e0b", fontWeight: 800 }}>
                              {"★".repeat(Number(rev.rating) || 0)}
                              {"☆".repeat(Math.max(0, 5 - (Number(rev.rating) || 0)))}
                            </div>
                          </div>
                          <p style={{ margin: 0, color: "#0f172a" }}>{rev.comment_text}</p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleApproveReview(rev.comment_id)}
                              style={{ ...primaryBtn, flex: 1 }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectReview(rev.comment_id)}
                              style={{ ...secondaryBtn, flex: 1 }}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                }}
              >
                <h4 style={{ margin: "0 0 10px", color: "#0f172a" }}>Delivery list</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 6, marginBottom: 6 }}>
                  {DELIVERY_FILTERS.map((tab) => {
                    const isActive = deliveryTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDeliveryTab(tab.id)}
                        style={{
                          borderRadius: 999,
                          padding: "8px 10px",
                          border: `1px solid ${isActive ? "#0f172a" : "#e5e7eb"}`,
                          background: isActive ? "#0f172a" : "#f8fafc",
                          color: isActive ? "#fff" : "#0f172a",
                          fontWeight: 700,
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                {filteredDeliveries.length === 0 ? (
                  <p style={{ margin: 0, color: "#94a3b8" }}>No deliveries to display for this filter.</p>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {visibleDeliveries.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 10,
                          padding: 10,
                          display: "grid",
                          gap: 8,
                          background: expandedDeliveryId === d.id ? "#f8fafc" : "white",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          <div>
                            <strong>{d.product}</strong>
                            <p style={{ margin: "2px 0 0", color: "#475569" }}>
                              {d.orderId} • {d.address}
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => setExpandedDeliveryId((prev) => (prev === d.id ? null : d.id))}
                              style={{ ...secondaryBtn, padding: "8px 12px" }}
                            >
                              {expandedDeliveryId === d.id ? "Hide details" : "View details"}
                            </button>
                            <div style={{ display: "grid", gap: 6, minWidth: 180 }}>
                              <button
                                type="button"
                                onClick={() => handleInlineStatusClick(d)}
                                style={{
                                  border: "1px solid #e5e7eb",
                                  background: "#f8fafc",
                                  color: "#0f172a",
                                  padding: "8px 12px",
                                  borderRadius: 10,
                                  fontWeight: 800,
                                  cursor: "pointer",
                                }}
                                title="Statusa tıkla ve güncelle"
                              >
                                {d.status}
                              </button>
                              {deliveryStatusPicker === d.id && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {DELIVERY_STATUSES.map((status) => {
                                    const label = DELIVERY_FILTERS.find((f) => f.id === status)?.label || status;
                                    return (
                                      <button
                                        key={status}
                                        type="button"
                                        onClick={() => handleSelectStatusOption(d, status)}
                                        style={{
                                          ...secondaryBtn,
                                          padding: "6px 8px",
                                          flex: "1 1 120px",
                                          borderColor: "#e5e7eb",
                                          background: "#fff",
                                        }}
                                      >
                                        {label}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {expandedDeliveryId === d.id && (() => {
                          const order = getOrderByDeliveryId(d.id);
                          const items = Array.isArray(order?.items) ? order.items : [];
                          const orderTotal = Number(order?.total || 0);
                          return (
                            <div
                              style={{
                                borderTop: "1px solid #e5e7eb",
                                paddingTop: 10,
                                display: "grid",
                                gap: 10,
                              }}
                            >
                              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#475569" }}>
                                <span><strong>Shipping:</strong> {order?.shippingCompany || "SUExpress"}</span>
                                <span><strong>Address:</strong> {order?.address || d.address}</span>
                              </div>
                              <div style={{ display: "grid", gap: 8 }}>
                                {items.length === 0 ? (
                                  <p style={{ margin: 0, color: "#94a3b8" }}>No item details available.</p>
                                ) : (
                                  items.map((item) => {
                                    const qty = Number(item.qty ?? item.quantity ?? 1);
                                    const price = Number(item.price || 0);
                                    const lineTotal = price * qty;
                                    return (
                                      <div
                                        key={item.id}
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          flexWrap: "wrap",
                                          gap: 8,
                                          border: "1px solid #e5e7eb",
                                          borderRadius: 10,
                                          padding: "8px 10px",
                                          background: "white",
                                        }}
                                      >
                                        <div>
                                          <strong>{item.name || "Item"}</strong>
                                          <p style={{ margin: "2px 0 0", color: "#475569" }}>
                                            Qty: {qty}
                                          </p>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                          <p style={{ margin: 0, fontWeight: 700 }}>₺{price.toLocaleString("tr-TR")}</p>
                                          <small style={{ color: "#475569" }}>Line: ₺{lineTotal.toLocaleString("tr-TR")}</small>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                              <div style={{ textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                                Order total: ₺{orderTotal.toLocaleString("tr-TR")}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                    {canLoadMoreDeliveries && (
                      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => setDeliveryVisibleCount((prev) => prev + 10)}
                          style={{ ...secondaryBtn, alignItems: "center", display: "inline-flex", gap: 6 }}
                        >
                          ↓ Load more
                        </button>
                        {canLoadLessDeliveries && (
                          <button
                            type="button"
                            onClick={() => setDeliveryVisibleCount((prev) => Math.max(10, prev - 10))}
                            style={{ ...secondaryBtn, alignItems: "center", display: "inline-flex", gap: 6 }}
                          >
                            ↑ Load less
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8, marginTop: 10 }}>
                  <select
                    value={deliveryUpdate.id}
                    onChange={(e) => setDeliveryUpdate((p) => ({ ...p, id: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select delivery</option>
                    {deliveries.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.orderId} - {d.product}
                      </option>
                    ))}
                  </select>
                  <select
                    value={deliveryUpdate.status}
                    onChange={(e) => setDeliveryUpdate((p) => ({ ...p, status: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Status</option>
                    {DELIVERY_STATUSES.map((status) => {
                      const tab = DELIVERY_FILTERS.find((f) => f.id === status);
                      return (
                        <option key={status} value={status}>
                          {tab?.label || status}
                        </option>
                      );
                    })}
                  </select>
                  <button type="button" onClick={handleDeliveryStatus} style={primaryBtn}>
                    Update delivery
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeSection === "sales" && (
            <section style={{ display: "grid", gap: 18 }}>
              <div style={{ background: "white", borderRadius: 14, padding: 18, boxShadow: "0 14px 30px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Orders (sales manager)</h3>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  {["Processing", "In-transit", "Delivered"].map((status) => {
                    const count = groupedOrders[status]?.length || 0;
                    const active = orderTab === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setOrderTab(status)}
                        style={{
                          borderRadius: 999,
                          padding: "8px 14px",
                          border: `1px solid ${active ? "#0f172a" : "#d1d5db"}`,
                          background: active ? "#0f172a" : "#fff",
                          color: active ? "#fff" : "#0f172a",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {status} <span style={{ background: active ? "#fff" : "#f1f5f9", color: active ? "#0f172a" : "#0f172a", borderRadius: 999, padding: "2px 8px", fontSize: "0.85rem" }}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {!isCompactLayout ? (
                  <div style={{ overflowX: "auto", width: "100%", maxWidth: "100%" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        tableLayout: "fixed",
                      }}
                    >
                      <thead>
                        <tr>
                          {["Order No", "Customer / Address", "Shipping", "Amount", "Status", "Action"].map((heading, index) => (
                            <th
                              key={heading}
                              style={{
                                textAlign: "left",
                                padding: "12px 10px",
                                borderBottom: "1px solid #e5e7eb",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                width: orderColumnWidths[index],
                              }}
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ordersForActiveTab.map((order) => (
                          <tr key={order.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ ...td, width: orderColumnWidths[0], fontWeight: 700 }}>{formatOrderId(order.id)}</td>
                            <td style={{ ...td, width: orderColumnWidths[1] }}>
                              <div style={{ fontWeight: 700 }}>{order.customerName || "Customer"}</div>
                              <div style={{ fontSize: "0.9rem" }}>{order.address}</div>
                            </td>
                            <td style={{ ...td, width: orderColumnWidths[2] }}>{order.shippingCompany}</td>
                            <td style={{ ...td, width: orderColumnWidths[3], fontWeight: 700 }}>₺{order.total?.toLocaleString("tr-TR")}</td>
                            <td style={{ ...td, width: orderColumnWidths[4], color: order.status === "Delivered" ? "#22c55e" : "inherit", fontWeight: 700 }}>{order.status}</td>
                            <td style={{ ...td, width: orderColumnWidths[5] }}>
                              {order.status === "Delivered" ? (
                                <button type="button" style={{ ...primaryBtn, background: "#e5e7eb", color: "#9ca3af", border: "none", cursor: "not-allowed" }} disabled>
                                  Delivered
                                </button>
                              ) : user?.role === "sales_manager" ? (
                                <button type="button" onClick={() => handleAdvanceOrder(order.id)} style={primaryBtn}>
                                  Advance status
                                </button>
                              ) : (
                                <span style={{ color: "#94a3b8", fontWeight: 700 }}>Only sales manager can advance</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {ordersForActiveTab.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#94a3b8" }}>
                              No orders in this status.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {ordersForActiveTab.map((order) => (
                      <div
                        key={order.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                          padding: 12,
                          background: "#f8fafc",
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          <strong>{formatOrderId(order.id)}</strong>
                          <span style={{ fontWeight: 700, color: order.status === "Delivered" ? "#22c55e" : "inherit" }}>{order.status}</span>
                        </div>
                        <div style={{ display: "grid", gap: 4, fontSize: "0.95rem" }}>
                          <span style={{ fontWeight: 700 }}>{order.customerName || "Customer"}</span>
                          <span>{order.address}</span>
                          <span>Shipping: {order.shippingCompany}</span>
                          <span>Total: ₺{order.total?.toLocaleString("tr-TR")}</span>
                        </div>
                        <div>
                          {order.status === "Delivered" ? (
                            <button type="button" style={{ ...primaryBtn, background: "#e5e7eb", color: "#9ca3af", border: "none", cursor: "not-allowed" }} disabled>
                              Delivered
                            </button>
                          ) : user?.role === "sales_manager" ? (
                            <button type="button" onClick={() => handleAdvanceOrder(order.id)} style={primaryBtn}>
                              Advance status
                            </button>
                          ) : (
                            <span style={{ color: "#94a3b8", fontWeight: 700 }}>Only sales manager can advance</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {ordersForActiveTab.length === 0 && <p style={{ margin: 0, color: "#94a3b8" }}>No orders in this status.</p>}
                  </div>
                )}
              </div>

              <div style={{ background: "white", borderRadius: 14, padding: 18, boxShadow: "0 14px 30px rgba(0,0,0,0.05)", display: "grid", gap: 12 }}>
                <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Price & Discount</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                  <select
                    value={priceUpdate.productId}
                    onChange={(e) => setPriceUpdate((p) => ({ ...p, productId: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="New price"
                    value={priceUpdate.price}
                    onChange={(e) => setPriceUpdate((p) => ({ ...p, price: e.target.value }))}
                    style={inputStyle}
                  />
                  <button type="button" onClick={handlePriceUpdate} style={primaryBtn}>
                    Update price
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 12 }}>
                  <select
                    value={costUpdate.productId}
                    onChange={(e) => setCostUpdate((p) => ({ ...p, productId: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Cost"
                    value={costUpdate.cost}
                    onChange={(e) => setCostUpdate((p) => ({ ...p, cost: e.target.value }))}
                    style={inputStyle}
                  />
                  <button type="button" onClick={handleCostUpdate} style={primaryBtn}>
                    Update cost
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 12 }}>
                  <select
                    value={discountForm.productId}
                    onChange={(e) => setDiscountForm((p) => ({ ...p, productId: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Discount %"
                    value={discountForm.rate}
                    onChange={(e) => setDiscountForm((p) => ({ ...p, rate: Number(e.target.value) }))}
                    style={inputStyle}
                  />
                  <input
                    type="date"
                    value={discountForm.startAt}
                    onChange={(e) => setDiscountForm((p) => ({ ...p, startAt: e.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    type="date"
                    value={discountForm.endAt}
                    onChange={(e) => setDiscountForm((p) => ({ ...p, endAt: e.target.value }))}
                    style={inputStyle}
                  />
                  <button type="button" onClick={handleDiscount} style={primaryBtn}>
                    Apply discount
                  </button>
                </div>
              </div>

              <div style={{ background: "white", borderRadius: 14, padding: 18, boxShadow: "0 14px 30px rgba(0,0,0,0.05)", display: "grid", gap: 12 }}>
                <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>Invoices (filter)</h3>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <input
                    type="date"
                    value={filters.invoiceFrom}
                    onChange={(e) => setFilters((f) => ({ ...f, invoiceFrom: e.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    type="date"
                    value={filters.invoiceTo}
                    onChange={(e) => setFilters((f) => ({ ...f, invoiceTo: e.target.value }))}
                    style={inputStyle}
                  />
                  <button type="button" onClick={handleLoadInvoices} style={primaryBtn} disabled={isLoadingInvoices}>
                    {isLoadingInvoices ? "Loading..." : "Load invoices"}
                  </button>
                </div>
                <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
                  {filteredInvoices.map((inv) => (
                    <div
                      key={`${inv.invoice_id}-${inv.order_id}`}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: 10,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "grid", gap: 4 }}>
                        <span style={{ fontWeight: 700 }}>
                          #INV-{String(inv.invoice_id).padStart(5, "0")} / #ORD-{String(inv.order_id).padStart(5, "0")}
                        </span>
                        <small style={{ color: "#64748b" }}>
                          {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString("tr-TR") : "-"}
                        </small>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700 }}>₺{Number(inv.amount || 0).toLocaleString("tr-TR")}</span>
                        <button type="button" style={linkBtn} onClick={() => handleViewInvoice(inv.order_id)}>
                          View PDF
                        </button>
                        <button type="button" style={linkBtn} onClick={() => handlePrintInvoice(inv.order_id)}>
                          Print
                        </button>
                        <button type="button" style={linkBtn} onClick={() => handleDownloadInvoice(inv.order_id)}>
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                  {!filteredInvoices.length && !isLoadingInvoices && (
                    <p style={{ margin: 0, color: "#94a3b8" }}>No invoices available.</p>
                  )}
                </div>
              </div>

              <div style={{ background: "white", borderRadius: 14, padding: 18, boxShadow: "0 14px 30px rgba(0,0,0,0.05)", display: "grid", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, color: "#0f172a" }}>Sales breakdown</h3>
                  <button type="button" style={linkBtn} onClick={handleLoadReport} disabled={isLoadingReport}>
                    {isLoadingReport ? "Loading..." : "Refresh report"}
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(220px, 1.2fr)", gap: 16, alignItems: "center" }}>
                  <div style={{ display: "grid", placeItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 220,
                        height: 220,
                        borderRadius: "50%",
                        background: `conic-gradient(#22c55e 0 ${((reportBreakdown.netProfit / reportBreakdown.safeTotal) * 100).toFixed(2)}%, #f97316 ${((reportBreakdown.netProfit / reportBreakdown.safeTotal) * 100).toFixed(2)}% ${(((reportBreakdown.netProfit + reportBreakdown.loss) / reportBreakdown.safeTotal) * 100).toFixed(2)}%, #6366f1 ${(((reportBreakdown.netProfit + reportBreakdown.loss) / reportBreakdown.safeTotal) * 100).toFixed(2)}% 100%)`,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <div style={{ width: 150, height: 150, borderRadius: "50%", background: "white", display: "grid", placeItems: "center", textAlign: "center", padding: 12 }}>
                        <p style={{ margin: 0, color: "#64748b", fontWeight: 700 }}>Total sales</p>
                        <strong style={{ fontSize: "1.3rem", color: "#0f172a" }}>
                          ₺{reportBreakdown.revenue.toLocaleString("tr-TR")}
                        </strong>
                        <small style={{ color: "#94a3b8" }}>100%</small>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="date"
                        value={reportFilters.from}
                        onChange={(e) => setReportFilters((r) => ({ ...r, from: e.target.value }))}
                        style={inputStyle}
                      />
                      <input
                        type="date"
                        value={reportFilters.to}
                        onChange={(e) => setReportFilters((r) => ({ ...r, to: e.target.value }))}
                        style={inputStyle}
                      />
                      <button type="button" onClick={handleLoadReport} style={primaryBtn} disabled={isLoadingReport}>
                        {isLoadingReport ? "Loading..." : "Load"}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
                          Net profit
                        </span>
                        <strong>₺{reportBreakdown.netProfit.toLocaleString("tr-TR")}</strong>
                        <span style={{ color: "#64748b" }}>{((reportBreakdown.netProfit / reportBreakdown.safeTotal) * 100).toFixed(1)}%</span>
                      </div>
                      {reportBreakdown.loss > 0 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f97316" }} />
                            Loss
                          </span>
                          <strong>₺{reportBreakdown.loss.toLocaleString("tr-TR")}</strong>
                          <span style={{ color: "#64748b" }}>{((reportBreakdown.loss / reportBreakdown.safeTotal) * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#6366f1" }} />
                          Cost
                        </span>
                        <strong>₺{reportBreakdown.cost.toLocaleString("tr-TR")}</strong>
                        <span style={{ color: "#64748b" }}>{((reportBreakdown.cost / reportBreakdown.safeTotal) * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: "#f8fafc" }}>
                      {reportData.series.length === 0 ? (
                        <p style={{ margin: 0, color: "#94a3b8" }}>No report data yet.</p>
                      ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", minHeight: 160 }}>
                            {reportData.series.map((bar) => {
                              const maxRevenue =
                                reportData.series.reduce((max, item) => Math.max(max, Number(item.revenue) || 0), 1) || 1;
                              const revenueHeight = Math.max(((Number(bar.revenue) || 0) / maxRevenue) * 140, 6);
                              const costHeight = Math.max(((Number(bar.cost) || 0) / (Number(bar.revenue) || 1)) * revenueHeight, 3);
                              const profitHeight = Math.max(revenueHeight - costHeight, 3);
                              return (
                                <div key={bar.date} style={{ textAlign: "center", flex: 1, minWidth: 12 }}>
                                  <div style={{ height: 140, display: "flex", alignItems: "flex-end" }}>
                                    <div style={{ width: "100%", borderRadius: 8, overflow: "hidden", background: "#e2e8f0", height: revenueHeight }}>
                                      <div style={{ height: costHeight, background: "#6366f1" }} />
                                      <div style={{ height: profitHeight, background: "#22c55e" }} />
                                    </div>
                                  </div>
                                  <small style={{ color: "#475569", display: "block", marginTop: 6 }}>{bar.date}</small>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ display: "flex", gap: 16, color: "#64748b", fontSize: "0.85rem" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
                              Profit
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#6366f1" }} />
                              Cost
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </section>
          )}

          {activeSection === "support" && (
            <section
              style={{
                display: "grid",
                gap: 18,
                gridTemplateColumns: "1fr 1.4fr",
                width: "100%",
                minWidth: 0,
              }}
            >

              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ background: "white", borderRadius: 14, padding: 18, boxShadow: "0 14px 30px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Active chat queue</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#475569", fontSize: "0.85rem" }}>
                        <input
                          type="checkbox"
                          checked={showUnclaimedOnly}
                          onChange={(event) => setShowUnclaimedOnly(event.target.checked)}
                        />
                        Unclaimed only
                      </label>
                      {isLoadingChats && <span style={{ color: "#0ea5e9", fontWeight: 700 }}>Syncing...</span>}
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {filteredChats
                      .slice((chatPage - 1) * CHAT_PAGE_SIZE, chatPage * CHAT_PAGE_SIZE)
                      .map((chat) => {
                      const isActive = chat.id === activeConversationId;
                      return (
                        <div
                          key={chat.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSelectConversation(chat.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleSelectConversation(chat.id);
                            }
                          }}
                          style={{
                            textAlign: "left",
                            border: isActive ? "2px solid #0ea5e9" : "1px solid #e5e7eb",
                            background: isActive ? "rgba(14,165,233,0.08)" : "white",
                            borderRadius: 12,
                            padding: 12,
                            cursor: "pointer",
                            display: "grid",
                            gap: 6,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <strong>{chat.customer_name}</strong>
                              <p style={{ margin: "2px 0 0", color: "#475569" }}>
                                {chat.order_id ? formatOrderId(chat.order_id) : "No order linked"}
                              </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {chat.unread_count > 0 && (
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: "#b91c1c",
                                    padding: "4px 10px",
                                    borderRadius: 999,
                                    background: "#fee2e2",
                                    border: "1px solid #fecaca",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  {chat.unread_count} unread
                                </span>
                              )}
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: chat.status === "closed" ? "#9ca3af" : "#0ea5e9",
                                  padding: "4px 10px",
                                  borderRadius: 999,
                                  background: "rgba(14,165,233,0.12)",
                                  border: "1px solid rgba(14,165,233,0.2)",
                                }}
                              >
                                {chat.status}
                              </span>
                            </div>
                          </div>
                          <p style={{ margin: 0, color: "#0f172a" }}>{chat.last_message}</p>
                          <small style={{ color: "#6b7280" }}>
                            Last update: {new Date(chat.last_message_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                          </small>
                          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => handleSelectConversation(chat.id)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid #e5e7eb",
                                background: "white",
                                cursor: "pointer",
                              }}
                            >
                              Open
                            </button>
                            {chat.status === "open" && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleClaimConversation(chat.id);
                                }}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  border: "1px solid #bfdbfe",
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  cursor: "pointer",
                                  fontWeight: 700,
                                }}
                              >
                                Claim
                              </button>
                            )}
                            {chat.status === "pending" && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleUnclaimConversation(chat.id);
                                }}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  border: "1px solid #fed7aa",
                                  background: "#fff7ed",
                                  color: "#c2410c",
                                  cursor: "pointer",
                                  fontWeight: 700,
                                }}
                              >
                                Unclaim
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(chat.id);
                              }}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid #fca5a5",
                                background: "#fef2f2",
                                color: "#b91c1c",
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {filteredChats.length > CHAT_PAGE_SIZE && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                        <button
                          type="button"
                          onClick={() => setChatPage((p) => Math.max(1, p - 1))}
                          disabled={chatPage === 1}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            background: chatPage === 1 ? "#f8fafc" : "white",
                            cursor: chatPage === 1 ? "not-allowed" : "pointer",
                          }}
                        >
                          Prev
                        </button>
                        <span style={{ color: "#475569", fontWeight: 600 }}>
                          Page {chatPage} / {Math.max(1, Math.ceil(filteredChats.length / CHAT_PAGE_SIZE))}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setChatPage((p) => Math.min(Math.ceil(filteredChats.length / CHAT_PAGE_SIZE), p + 1))
                          }
                          disabled={chatPage >= Math.ceil(filteredChats.length / CHAT_PAGE_SIZE)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            background:
                              chatPage >= Math.ceil(filteredChats.length / CHAT_PAGE_SIZE) ? "#f8fafc" : "white",
                            cursor:
                              chatPage >= Math.ceil(filteredChats.length / CHAT_PAGE_SIZE) ? "not-allowed" : "pointer",
                          }}
                        >
                          Next &gt;
                        </button>
                      </div>
                    )}
                    {!filteredChats.length && !isLoadingChats && (
                      <p style={{ margin: 0, color: "#6b7280" }}>
                        {showUnclaimedOnly ? "No unclaimed chats yet." : "No active chats yet."}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ background: "white", borderRadius: 14, padding: 18, boxShadow: "0 14px 30px rgba(0,0,0,0.05)", display: "grid", gap: 12 }}>
                  <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Return requests</h3>
                  {isLoadingReturns && <p style={{ margin: 0, color: "#64748b" }}>Loading return requests...</p>}
                  {!isLoadingReturns && returnRequests.length === 0 && (
                    <p style={{ margin: 0, color: "#94a3b8" }}>No return requests yet.</p>
                  )}
                  <div style={{ display: "grid", gap: 12 }}>
                    {returnRequests.map((item) => (
                      <div
                        key={`${item.attachment?.id || item.message_id}`}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                          padding: 12,
                          background: "#f8fafc",
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div>
                            <strong>{item.customer_name}</strong>
                            <p style={{ margin: "2px 0 0", color: "#64748b" }}>
                              {item.customer_email || `User #${item.user_id}`}
                            </p>
                            <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                              {item.order_id ? formatOrderId(item.order_id) : "No order linked"}
                            </p>
                          </div>
                          <span
                            style={{
                              alignSelf: "flex-start",
                              padding: "4px 10px",
                              borderRadius: 999,
                              background: item.return_eligible ? "#dcfce7" : "#fee2e2",
                              color: item.return_eligible ? "#166534" : "#b91c1c",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                            }}
                          >
                            {item.return_eligible ? "Return possible" : "Return not eligible"}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: "#0f172a" }}>{item.message_text || "Attachment uploaded"}</p>
                        {item.attachment?.url && (
                          <a
                            href={resolveAttachmentUrl(item.attachment, item.order_id)}
                            target="_blank"
                            rel="noreferrer"
                            download={item.attachment.file_name}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 10px",
                              borderRadius: 10,
                              background: "#e0f2fe",
                              color: "#0f172a",
                              textDecoration: "none",
                              fontWeight: 700,
                              border: "1px solid #bae6fd",
                              width: "fit-content",
                            }}
                          >
                            Attachment: {item.attachment.file_name}
                          </a>
                        )}
                        <small style={{ color: "#6b7280" }}>
                          {item.message_at
                            ? new Date(item.message_at).toLocaleString("tr-TR")
                            : "Date unavailable"}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: "0 14px 30px rgba(0,0,0,0.05)",
                  display: "grid",
                  gap: 12,
                  gridTemplateRows: "auto auto 1fr auto",
                  maxHeight: "calc(100vh - 220px)",
                  minHeight: 0,
                }}
              >
                <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>Conversation</h3>
                {activeConversationId && activeChat && (
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 12,
                      background: "#f8fafc",
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div>
                        <strong style={{ color: "#0f172a" }}>{activeChat.customer_name}</strong>
                        <p style={{ margin: "4px 0 0", color: "#475569" }}>
                          {activeChat.customer_email || `User #${activeChat.user_id}`}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ textAlign: "right" }}>
                          <p
                            style={{
                              margin: 0,
                              color: "#94a3b8",
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}
                          >
                            Orders
                          </p>
                          <strong>{customerOrders.length}</strong>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p
                            style={{
                              margin: 0,
                              color: "#94a3b8",
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}
                          >
                            Wishlist
                          </p>
                          <strong>{customerWishlist.length}</strong>
                        </div>
                      </div>
                    </div>
                    {isLoadingCustomerInfo ? (
                      <p style={{ margin: 0, color: "#64748b" }}>Loading customer data...</p>
                    ) : (
                      <div style={{ display: "grid", gap: 12 }}>
                        <div>
                          <p style={{ margin: "0 0 6px", color: "#475569", fontWeight: 700 }}>Recent orders</p>
                          {customerOrders.length === 0 ? (
                            <p style={{ margin: 0, color: "#94a3b8" }}>No orders yet.</p>
                          ) : (
                            <div style={{ display: "grid", gap: 6 }}>
                              {customerOrders.slice(0, 3).map((order) => (
                                <div key={order.id} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                  <span style={{ color: "#0f172a" }}>
                                    {order.formattedId || formatOrderId(order.id)}
                                  </span>
                                  <span
                                    style={{
                                      padding: "2px 8px",
                                      borderRadius: 999,
                                      fontSize: "0.8rem",
                                      background: "#e0f2fe",
                                      color: "#0369a1",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {order.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <p style={{ margin: "0 0 6px", color: "#475569", fontWeight: 700 }}>Wishlist items</p>
                          {customerWishlist.length === 0 ? (
                            <p style={{ margin: 0, color: "#94a3b8" }}>No wishlist items.</p>
                          ) : (
                            <div style={{ display: "grid", gap: 6 }}>
                              {customerWishlist.slice(0, 4).map((item) => (
                                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                  <span style={{ color: "#0f172a" }}>{item.name}</span>
                                  {item.price != null && (
                                    <span style={{ color: "#0f172a", fontWeight: 700 }}>
                                      {Number(item.price).toLocaleString("tr-TR")} TL
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeConversationId ? (
                  <>
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 12,
                        minHeight: 220,
                        maxHeight: "calc(100vh - 520px)",
                        overflow: "auto",
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          style={{
                            justifySelf: msg.from === "support" ? "flex-end" : "flex-start",
                            background: msg.from === "support" ? "linear-gradient(135deg,#0ea5e9,#2563eb)" : "#f8fafc",
                            color: msg.from === "support" ? "white" : "#0f172a",
                            padding: "10px 12px",
                            borderRadius: msg.from === "support" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                            maxWidth: "80%",
                          }}
                        >
                          <p style={{ margin: 0 }}>{msg.text}</p>
                          {msg.attachments?.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }}>
                              {msg.attachments.map((att) => (
                                <a
                                  key={att.id}
                                  href={resolveAttachmentUrl(att, activeChat?.order_id)}
                                  target="_blank"
                                  rel="noreferrer"
                                  download={att.file_name}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "6px 8px",
                                    borderRadius: 10,
                                    background: msg.from === "support" ? "rgba(255,255,255,0.18)" : "#e0f2fe",
                                    color: msg.from === "support" ? "white" : "#0f172a",
                                    textDecoration: "none",
                                    border: msg.from === "support" ? "1px solid rgba(255,255,255,0.2)" : "1px solid #bae6fd",
                                  }}
                                >
                                  📎 <span style={{ fontWeight: 700 }}>{att.file_name}</span>
                                </a>
                              ))}
                            </div>
                          )}
                          <small style={{ opacity: 0.8 }}>
                            {new Date(msg.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                          </small>
                        </div>
                      ))}
                      {chatMessages.length === 0 && !isLoadingThread && (
                        <p style={{ margin: 0, color: "#6b7280" }}>No messages yet. Say hi to the customer.</p>
                      )}
                      {isLoadingThread && (
                        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>Refreshing…</p>
                      )}
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      <textarea
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        rows={3}
                        placeholder="Write a reply..."
                        style={{ ...inputStyle, minHeight: 90 }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <label
                          style={{
                            ...secondaryBtn,
                            margin: 0,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 10px",
                          }}
                        >
                          📎 Add attachment
                          <input
                            ref={replyFileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.txt"
                            onChange={handleSelectReplyFiles}
                            style={{ display: "none" }}
                          />
                        </label>
                        {replyFiles.length > 0 && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {replyFiles.map((file) => (
                              <span
                                key={file.name}
                                style={{
                                  ...secondaryBtn,
                                  padding: "6px 10px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                {file.name}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveReplyFile(file.name)}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    color: "#b91c1c",
                                    fontWeight: 900,
                                  }}
                                  aria-label="Remove attachment"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={isSendingReply}
                        style={{
                          ...primaryBtn,
                          opacity: isSendingReply ? 0.7 : 1,
                          cursor: isSendingReply ? "not-allowed" : "pointer",
                        }}
                      >
                        {isSendingReply ? "Sending..." : "Send reply"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p style={{ margin: 0, color: "#6b7280" }}>Select a chat from the left to start messaging.</p>
                )}
              </div>
            </section>
          )}

          <section
            style={{
              background: "linear-gradient(135deg, rgba(0,88,163,0.08), rgba(255,204,0,0.12))",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(0,88,163,0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>Operational reminders</h3>
                <p style={{ margin: 0, color: "#374151" }}>
                  {totals.lowStock} products are low on stock. Prioritize restock before weekend campaigns.
                </p>
              </div>
              <button type="button" style={primaryBtn} onClick={handleViewLowStock}>
                View details
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

const inputStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 12px",
  width: "100%",
  boxSizing: "border-box",
};

const primaryBtn = {
  border: "none",
  background: "#0058a3",
  color: "white",
  padding: "10px 12px",
  borderRadius: 10,
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryBtn = {
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#0f172a",
  padding: "10px 12px",
  borderRadius: 10,
  fontWeight: 700,
  cursor: "pointer",
};

const linkBtn = {
  border: "none",
  background: "none",
  color: "#0058a3",
  fontWeight: 700,
  cursor: "pointer",
};

const orderColumnWidths = ["14%", "32%", "14%", "14%", "12%", "14%"];

const th = {
  padding: "10px 12px",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "normal",
  wordBreak: "break-word",
};
const td = { padding: "10px 12px", whiteSpace: "normal", wordBreak: "break-word" };

export default AdminDashboard;
