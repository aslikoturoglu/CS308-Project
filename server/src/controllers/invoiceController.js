import db from "../db.js";
import PDFDocument from "pdfkit";

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

  const sqlOrder = `
    SELECT 
      o.order_id,
      o.user_id,
      o.order_date,
      o.total_amount,
      o.shipping_address,
      u.email AS customer_email,
      u.address AS customer_address,
      u.phone AS customer_phone
    FROM orders o
    LEFT JOIN users u ON u.user_id = o.user_id
    WHERE o.order_id = ?
    LIMIT 1
  `;

  db.query(sqlOrder, [realOrderId], (err, orderRows) => {
    if (err || !orderRows.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderRows[0];

    const sqlItems = `
      SELECT 
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.unit_price,
        p.product_name
      FROM order_items oi
      JOIN Products p ON p.product_id = oi.product_id
      WHERE oi.order_id = ?
    `;

    db.query(sqlItems, [realOrderId], (err, items) => {
      if (err || !items.length) {
        return res.status(404).json({ error: "Order items not found" });
      }

      return createPdf(order, items, res);
    });
  });
}

function createPdf(order, items, res) {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=invoice_${order.order_id}.pdf`
  );

  doc.pipe(res);

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

  const email = normalizeTR(order.customer_email);
  const customerAddress = normalizeTR(order.customer_address || "Address not provided");
  const shipping = normalizeTR(order.shipping_address || "Address not provided");
  const phone = normalizeTR(order.customer_phone || "Phone not provided");

  doc
    .fillColor("black")
    .font("Helvetica")
    .fontSize(12)
    .text(email, 50, y)
    .text(customerAddress, 50, y + 15)
    .text(shipping, 50, y + 30)
    .text(phone, 50, y + 45)
    .text("Türkiye", 50, y + 60);

  // ============================
  // PRODUCT TABLE HEADER
  // ============================
  y += 110;

  doc.rect(50, y, 500, 25).fill(blue);
  doc
    .fillColor("white")
    .font("Helvetica-Bold")
    .text("DESCRIPTION", 55, y + 7)
    .text("QTY", 300, y + 7)
    .text("UNIT PRICE", 360, y + 7)
    .text("AMOUNT", 450, y + 7);

  y += 30;

  doc.lineWidth(0.8).strokeColor(greyBorder);

  items.forEach((i) => {
    const amount = Number(i.quantity) * Number(i.unit_price);

    doc.rect(50, y - 2, 500, 28).fill(greyLight).stroke();

    doc
      .fillColor("black")
      .font("Helvetica")
      .fontSize(12)
      .text(normalizeTR(i.product_name), 55, y + 5)
      .text(i.quantity, 300, y + 5)
      .text(`${Number(i.unit_price).toLocaleString("tr-TR")} TL`, 360, y + 5)
      .text(`${amount.toLocaleString("tr-TR")} TL`, 450, y + 5);

    y += 30;
  });

  // ============================
  // TOTAL
  // ============================
  const totalY = y + 30;

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
    .text("Thank you for choosing SUHOME.", 0, totalY + 60, { align: "center" });

  doc.end();
}
