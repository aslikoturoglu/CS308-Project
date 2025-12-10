import db from "../db.js";
import PDFDocument from "pdfkit";

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
  const { order_id } = req.params;

  const sqlOrder = `
    SELECT 
      o.order_id,
      o.user_id,
      o.order_date,
      o.total_amount,
      o.shipping_address,
      u.email AS customer_email,
      u.address AS customer_address
    FROM orders o
    JOIN users u ON u.user_id = o.user_id
    WHERE o.order_id = ?
  `;

  db.query(sqlOrder, [order_id], (err, orderRows) => {
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
      JOIN products p ON p.product_id = oi.product_id
      WHERE oi.order_id = ?
    `;

    db.query(sqlItems, [order_id], (err, items) => {
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
  res.setHeader("Content-Disposition", `inline; filename=invoice_${order.order_id}.pdf`);
  doc.pipe(res);

  const blue = "#0058a3";
  const greyLight = "#f2f4f7";
  const greyBorder = "#d0d7de";

  doc.font("Helvetica-Bold").fontSize(22).fillColor(blue).text("SUHOME", 50, 40);

  doc.font("Helvetica").fontSize(11).text("Bagdat Street No:25", 50, 75)
     .text("Kadikoy / Istanbul", 50, 90)
     .text("Phone: +90 (216) 123 45 67", 50, 105)
     .text("Email: support@suhome.com", 50, 120);

  doc.font("Helvetica-Bold").fontSize(28).fillColor(blue).text("INVOICE", 350, 40);

  const invoiceBoxY = 95;
  doc.font("Helvetica").fontSize(12).fillColor("black")
     .text(`DATE: ${new Date(order.order_date).toLocaleDateString("tr-TR")}`, 350, invoiceBoxY)
     .text(`INVOICE #: ${order.order_id}`, 350, invoiceBoxY + 20)
     .text(`CUSTOMER ID: ${order.user_id}`, 350, invoiceBoxY + 40);

  let y = 180;
  doc.rect(50, y, 500, 25).fill(blue);
  doc.fillColor("white").font("Helvetica-Bold").text("BILL TO", 55, y + 7);

  y += 40;
  doc.fillColor("black").fontSize(12)
     .text(normalizeTR(order.customer_email), 50, y)
     .text(normalizeTR(order.shipping_address), 50, y + 20)
     .text(normalizeTR(order.customer_address || ""), 50, y + 40)
     .text("Türkiye", 50, y + 60);

  y += 110;
  doc.rect(50, y, 500, 25).fill(blue);
  doc.fillColor("white").font("Helvetica-Bold").text("DESCRIPTION", 55, y + 7)
     .text("QTY", 300, y + 7)
     .text("UNIT PRICE", 360, y + 7)
     .text("AMOUNT", 450, y + 7);

  y += 30;

  doc.lineWidth(0.8).strokeColor(greyBorder);

  items.forEach((i) => {
    const total = i.quantity * i.unit_price;

    doc.rect(50, y - 2, 500, 28).fill(greyLight).stroke();
    doc.fillColor("black")
       .text(normalizeTR(i.product_name), 55, y + 5)
       .text(i.quantity, 300, y + 5)
       .text(`${i.unit_price} TL`, 360, y + 5)
       .text(`${total} TL`, 450, y + 5);

    y += 30;
  });

  const totalY = y + 30;
  doc.font("Helvetica-Bold").fontSize(16).fillColor(blue).text("TOTAL:", 360, totalY);
  doc.fillColor("black").text(`${order.total_amount} TL`, 450, totalY);

  doc.font("Helvetica").fontSize(12).text("Thank you for choosing SUHOME.", 0, totalY + 60, { align: "center" });

  doc.end();
}
