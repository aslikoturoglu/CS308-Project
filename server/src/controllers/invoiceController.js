import db from "../db.js";
import PDFDocument from "pdfkit";
import { sendMail } from "../utils/mailer.js";

// Türkçe karakter düzeltme
function normalizeTR(text) {
  if (!text) return "";
  return text
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ü/g, "u").replace(/Ü/g, "U")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/ı/g, "i").replace(/İ/g, "I");
}

function parseAddressPayload(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
}

function fetchInvoiceData(realOrderId, callback) {
  const sqlOrder = `
    SELECT 
      o.order_id,
      o.user_id,
      o.order_date,
      o.total_amount,
      o.shipping_address,
      o.billing_address,
      u.full_name AS customer_name,
      u.email AS customer_email,
      u.home_address AS customer_address
    FROM orders o
    LEFT JOIN users u ON u.user_id = o.user_id
    WHERE o.order_id = ?
    LIMIT 1
  `;

  db.query(sqlOrder, [realOrderId], (orderErr, orderRows) => {
    if (orderErr) {
      console.error("Invoice order query failed:", orderErr);
      return callback({ status: 500, message: "Order lookup failed" });
    }
    if (!orderRows.length) {
      return callback({ status: 404, message: "Order not found" });
    }

    const order = orderRows[0];

    const sqlItems = `
      SELECT 
        oi.order_item_id,
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.unit_price,
        COALESCE(p.product_name, CONCAT('Product #', oi.product_id)) AS product_name
      FROM order_items oi
      LEFT JOIN products p ON p.product_id = oi.product_id
      WHERE oi.order_id = ?
    `;

    db.query(sqlItems, [realOrderId], (itemErr, items) => {
      if (itemErr) {
        console.error("Invoice items query failed:", itemErr);
        return callback({
          status: 500,
          message: "Order items could not be loaded",
        });
      }

      const safeItems =
        items.length > 0
          ? items
          : [
              {
                order_item_id: `fallback-${realOrderId}`,
                order_id: realOrderId,
                product_id: null,
                quantity: 1,
                unit_price: Number(order.total_amount ?? 0),
                product_name: "Order summary",
              },
            ];

      const shippingDetails = parseAddressPayload(order.shipping_address);
      const billingDetails = parseAddressPayload(order.billing_address);

      callback(null, {
        order,
        items: safeItems,
        detailPayload: { shippingDetails, billingDetails },
      });
    });
  });
}

export function generateInvoice(req, res) {
  let { order_id } = req.params;

  // ⭐ ORD-00047 → 47
  // ⭐ %23ORD-00047 → 47
  // ⭐ #ORD-00047 → 47
  // ⭐ 47 → 47
  const digits = String(order_id).match(/\d+/);
  const realOrderId = digits ? Number(digits[0]) : null;

  if (!realOrderId) {
    return res.status(400).json({ error: "Invalid order ID format" });
  }

  fetchInvoiceData(realOrderId, (err, data) => {
    if (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
    return streamInvoiceToResponse(data.order, data.items, data.detailPayload, res);
  });
}

export function emailInvoice(req, res) {
  let { order_id } = req.params;
  const digits = String(order_id).match(/\d+/);
  const realOrderId = digits ? Number(digits[0]) : null;

  if (!realOrderId) {
    return res.status(400).json({ error: "Invalid order ID format" });
  }

  fetchInvoiceData(realOrderId, async (err, data) => {
    if (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }

    const {
      order,
      items,
      detailPayload: { shippingDetails },
    } = data;

    const explicitEmail = req.body?.email;
    const targetEmail =
      (explicitEmail && explicitEmail.trim()) ||
      shippingDetails?.email ||
      order.customer_email ||
      null;

    if (!targetEmail) {
      return res.status(400).json({ error: "Email address is required" });
    }

    try {
      const pdfBuffer = await buildInvoiceBuffer(order, items, data.detailPayload);
      const formattedId = `ORD-${String(order.order_id).padStart(5, "0")}`;

      const mailResult = await sendMail({
        to: targetEmail,
        subject: `Invoice ${formattedId} - SUHome`,
        text: `Hello,\n\nYour SUHome invoice (${formattedId}) is attached.\n\nThank you.`,
        html: `<p>Hello,</p><p>Your SUHome invoice <strong>${formattedId}</strong> is attached.</p><p>Thank you.</p>`,
        attachments: [
          {
            filename: `invoice_${order.order_id}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      if (mailResult?.skipped) {
        return res
          .status(503)
          .json({ error: "Email service is not configured on the server." });
      }

      return res.json({
        success: true,
        message: `Invoice sent to ${targetEmail}`,
      });
    } catch (mailErr) {
      console.error("Invoice email failed:", mailErr);
      return res
        .status(500)
        .json({ error: "Invoice email could not be sent" });
    }
  });
}

function formatAddressLines(details) {
  if (!details) return [];
  const lines = [];
  if (details.address) lines.push(details.address);
  const cityLine = [details.city, details.postalCode].filter(Boolean).join(" ").trim();
  if (cityLine) lines.push(cityLine);
  return lines;
}

function streamInvoiceToResponse(order, items, detailPayload, res) {
  const doc = new PDFDocument({ margin: 40 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=invoice_${order.order_id}.pdf`
  );
  doc.pipe(res);
  renderInvoice(doc, order, items, detailPayload);
  doc.end();
}

function buildInvoiceBuffer(order, items, detailPayload) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    renderInvoice(doc, order, items, detailPayload);
    doc.end();
  });
}

function renderInvoice(doc, order, items, detailPayload = {}) {
  const blue = "#0058a3";
  const greyLight = "#f2f4f7";
  const greyBorder = "#d0d7de";

  // ============================
  // HEADER
  // ============================
  doc.font("Helvetica-Bold").fontSize(22).fillColor(blue).text("SUHOME", 50, 40);

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("black")
    .text("Bagdat Street No:25", 50, 75)
    .text("Kadikoy / Istanbul", 50, 90)
    .text("Phone: +90 (216) 123 45 67", 50, 105)
    .text("Email: support@suhome.com", 50, 120);

  // INVOICE TITLE
  doc.font("Helvetica-Bold").fontSize(28).fillColor(blue).text("INVOICE", 350, 40);

  const invoiceDate = new Date(order.order_date).toLocaleDateString("tr-TR");
  const formattedInvoiceId = `ORD-${String(order.order_id).padStart(5, "0")}`;

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("black")
    .text(`DATE: ${invoiceDate}`, 350, 95)
    .text(`INVOICE #: ${formattedInvoiceId}`, 350, 115);

  // ============================
  // BILL TO
  // ============================
  let y = 180;

  doc.rect(50, y, 500, 25).fill(blue);
  doc.fillColor("white").font("Helvetica-Bold").text("BILL TO", 55, y + 7);

  y += 40;

  const { shippingDetails, billingDetails } = detailPayload;
  const email = normalizeTR(
    (shippingDetails?.email || order.customer_email || "customer@suhome.com")
  );
  const customerName = normalizeTR(
    (
      [shippingDetails?.firstName, shippingDetails?.lastName].filter(Boolean).join(" ") ||
      order.customer_name ||
      "SUHome Customer"
    ).trim()
  );
  const addressLines =
    formatAddressLines(shippingDetails) ||
    formatAddressLines(billingDetails) ||
    [order.shipping_address || order.billing_address || "Address not provided"];
  const noteLine = shippingDetails?.notes?.trim();
  const phoneLine = shippingDetails?.phone?.trim();

  const sections = [
    { label: "Full Name", value: customerName },
    { label: "Email", value: email },
    {
      label: "Address",
      value: addressLines.map((line) => normalizeTR(line)).join("\n"),
    },
    phoneLine ? { label: "Phone", value: normalizeTR(phoneLine) } : null,
    noteLine ? { label: "Note", value: normalizeTR(noteLine) } : null,
  ].filter(Boolean);

  let textY = y;
  sections.forEach((section) => {
    doc
      .fillColor("#0f172a")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`${section.label}:`, 50, textY);
    textY += 15;
    doc
      .fillColor("black")
      .font("Helvetica")
      .fontSize(12)
      .text(section.value || "-", 50, textY);
    textY += section.value?.split("\n").length * 15 || 15;
    textY += 5;
  });

  // ============================
  // PRODUCT TABLE HEADER
  // ============================
  const tableHeaderY = textY + 40;
  doc.rect(50, tableHeaderY, 500, 25).fill(blue);
  doc
    .fillColor("white")
    .font("Helvetica-Bold")
    .text("DESCRIPTION", 55, tableHeaderY + 7)
    .text("QTY", 300, tableHeaderY + 7)
    .text("UNIT PRICE", 360, tableHeaderY + 7)
    .text("AMOUNT", 450, tableHeaderY + 7);

  let rowY = tableHeaderY + 30;

  doc.lineWidth(0.8).strokeColor(greyBorder);

  items.forEach((i) => {
    const amount = Number(i.quantity) * Number(i.unit_price);

    doc.rect(50, rowY - 2, 500, 28).fill(greyLight).stroke();

    doc
      .fillColor("black")
      .font("Helvetica")
      .fontSize(12)
      .text(normalizeTR(i.product_name), 55, rowY + 5)
      .text(i.quantity, 300, rowY + 5)
      .text(`${Number(i.unit_price).toLocaleString("tr-TR")} TL`, 360, rowY + 5)
      .text(`${amount.toLocaleString("tr-TR")} TL`, 450, rowY + 5);

    rowY += 30;
  });

  // ============================
  // TOTAL
  // ============================
  const totalY = rowY + 30;

  doc.font("Helvetica-Bold").fontSize(16).fillColor(blue).text("TOTAL:", 360, totalY);

  doc
    .fillColor("black")
    .font("Helvetica-Bold")
    .text(`${Number(order.total_amount).toLocaleString("tr-TR")} TL`, 450, totalY);

  // ============================
  // FOOTER
  // ============================
  doc
    .font("Helvetica")
    .fontSize(12)
    .text("Thank you for choosing SUHOME.", 0, totalY + 60, {
      align: "center",
    });
}
