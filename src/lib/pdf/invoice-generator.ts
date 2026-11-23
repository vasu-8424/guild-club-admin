import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Order } from "@/types/database";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  order: Order;
  companyName: string;
  companyAddress: string;
  companyGstin: string;
  companyPan: string;
  companyStateCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  placeOfSupply: string;
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, 210, 38, "F");

  // Gold Accent Line
  doc.setFillColor(217, 119, 6); // #D97706
  doc.rect(0, 38, 210, 2, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("TOY VISE / GUILD CLUB", 15, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text("PREMIUM TOY STORE & EDUCATIONAL SERVICES", 15, 24);
  doc.text("TAX INVOICE / CASH MEMORANDUM", 15, 30);

  // Invoice Meta (Top Right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`INVOICE: ${data.invoiceNumber}`, 195, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Date: ${data.invoiceDate}`, 195, 22, { align: "right" });
  doc.text(`Order ID: #${data.order.id.slice(0, 12)}`, 195, 28, { align: "right" });
  doc.text(`Place of Supply: ${data.placeOfSupply}`, 195, 34, { align: "right" });

  // 2. Company & Customer Info Grid
  let y = 48;
  doc.setTextColor(15, 23, 42);

  // Seller Info (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("SOLD BY / SELLER DETAILS:", 15, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(data.companyName, 15, y + 5);
  doc.text(data.companyAddress, 15, y + 9, { maxWidth: 88 });
  doc.text(`GSTIN: ${data.companyGstin}  |  State Code: ${data.companyStateCode}`, 15, y + 17);
  doc.text(`PAN: ${data.companyPan}`, 15, y + 21);

  // Buyer / Customer Info (Right)
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("BILL TO & DELIVER TO:", 115, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(data.customerName || "Customer", 115, y + 5);
  doc.text(data.customerAddress || "Delivery Address Pending", 115, y + 9, { maxWidth: 80 });
  
  const customerPhoneText = data.customerPhone && data.customerPhone !== "N/A" 
    ? `Contact: ${data.customerPhone}` 
    : "Contact: Registered User";
  const customerEmailText = data.customerEmail && data.customerEmail !== "N/A"
    ? `Email: ${data.customerEmail}`
    : "Email: Registered Customer Account";
  doc.text(customerPhoneText, 115, y + 17);
  doc.text(customerEmailText, 115, y + 21);

  // Pricing calculations
  const totalAmount = Number(data.order.total) || 0;
  const subtotalAmount = Number(data.order.subtotal) || totalAmount;
  const discountAmt = Number((data.order as any).discount_amount) || 0;
  const deliveryFeeAmt = Number((data.order as any).delivery_fee) || 0;

  // Determine if tax was added on top of subtotal (e.g. 999 subtotal + 5% GST = 1048.95 total)
  const isTaxOnTop = totalAmount > subtotalAmount;
  const totalTaxAmt = isTaxOnTop 
    ? Math.round((totalAmount - subtotalAmount - deliveryFeeAmt + discountAmt) * 100) / 100
    : Math.round(((subtotalAmount - discountAmt) * 0.05 / 1.05) * 100) / 100;

  const cgstAmount = Math.round((totalTaxAmt / 2) * 100) / 100;
  const sgstAmount = Math.round((totalTaxAmt - cgstAmount) * 100) / 100;

  const taxableBaseTotal = isTaxOnTop 
    ? subtotalAmount 
    : Math.round((subtotalAmount / 1.05) * 100) / 100;

  // 3. Itemized Tax Breakdown Table
  const items = data.order.items || [];

  const tableBody = items.map((item, index) => {
    const itemQty = Number(item.qty) || 1;
    const itemUnitPrice = Number(item.price) || 0;
    const itemGross = itemUnitPrice * itemQty;

    let itemTaxableUnit: number;
    let itemTaxableTotal: number;
    let itemCgst: number;
    let itemSgst: number;
    let itemFinalTotal: number;

    if (isTaxOnTop) {
      itemTaxableUnit = itemUnitPrice;
      itemTaxableTotal = itemGross;
      itemCgst = Math.round((itemTaxableTotal * 0.025) * 100) / 100;
      itemSgst = Math.round((itemTaxableTotal * 0.025) * 100) / 100;
      itemFinalTotal = Math.round((itemTaxableTotal + itemCgst + itemSgst) * 100) / 100;
    } else {
      itemTaxableUnit = Math.round((itemUnitPrice / 1.05) * 100) / 100;
      itemTaxableTotal = Math.round((itemGross / 1.05) * 100) / 100;
      itemCgst = Math.round((itemTaxableTotal * 0.025) * 100) / 100;
      itemSgst = Math.round((itemTaxableTotal * 0.025) * 100) / 100;
      itemFinalTotal = itemGross;
    }

    return [
      (index + 1).toString(),
      item.title || "Toy Vise Educational Toy",
      "9503", // Toys HSN Code
      itemQty.toString(),
      itemTaxableUnit.toFixed(2),
      itemTaxableTotal.toFixed(2),
      `${itemCgst.toFixed(2)} (2.5%)`,
      `${itemSgst.toFixed(2)} (2.5%)`,
      itemFinalTotal.toFixed(2),
    ];
  });

  autoTable(doc, {
    startY: 80,
    head: [
      [
        "#",
        "Item Description",
        "HSN",
        "Qty",
        "Taxable Rate (Rs.)",
        "Taxable Val (Rs.)",
        "CGST",
        "SGST",
        "Total (Rs.)",
      ],
    ],
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 56 },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 10, halign: "center" },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 22, halign: "right" },
      6: { cellWidth: 22, halign: "right" },
      7: { cellWidth: 22, halign: "right" },
      8: { cellWidth: 24, halign: "right", fontStyle: "bold" },
    },
  });

  // 4. Totals Summary
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Payment Details (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("PAYMENT & FULFILLMENT AUDIT:", 15, finalY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  
  const paymentMethodLabel = data.order.payment_method || (data.order.razorpay_payment_id ? "Razorpay Online Prepaid" : "Online Payment");
  const paymentRefText = data.order.razorpay_payment_id 
    ? data.order.razorpay_payment_id 
    : (data.order.razorpay_order_id || "Prepaid Order Verified");
  
  doc.text(`Payment Gateway: ${paymentMethodLabel}`, 15, finalY + 5);
  doc.text(`Payment Ref ID: ${paymentRefText}`, 15, finalY + 9);
  doc.text(`Fulfillment Status: ${data.order.status.toUpperCase()}`, 15, finalY + 13);
  doc.text(`Delivery Courier: ${data.order.delivery_partner_name || "Alex (Guild Club Logistics)"}`, 15, finalY + 17);

  // Financial Table (Right)
  const summaryX = 125;
  doc.setFontSize(8);
  doc.text("Subtotal (Taxable Value):", summaryX, finalY + 5);
  doc.text(`Rs. ${taxableBaseTotal.toFixed(2)}`, 195, finalY + 5, { align: "right" });

  let offset = 5;

  if (discountAmt > 0) {
    offset += 5;
    doc.setTextColor(34, 197, 94);
    doc.text("Coupon Discount:", summaryX, finalY + offset);
    doc.text(`- Rs. ${discountAmt.toFixed(2)}`, 195, finalY + offset, { align: "right" });
    doc.setTextColor(71, 85, 105);
  }

  offset += 5;
  doc.text("Delivery Fee:", summaryX, finalY + offset);
  doc.text(deliveryFeeAmt > 0 ? `Rs. ${deliveryFeeAmt.toFixed(2)}` : "FREE", 195, finalY + offset, { align: "right" });

  offset += 5;
  doc.text("Central GST (CGST 2.5%):", summaryX, finalY + offset);
  doc.text(`Rs. ${cgstAmount.toFixed(2)}`, 195, finalY + offset, { align: "right" });

  offset += 5;
  doc.text("State GST (SGST 2.5%):", summaryX, finalY + offset);
  doc.text(`Rs. ${sgstAmount.toFixed(2)}`, 195, finalY + offset, { align: "right" });

  offset += 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(summaryX - 2, finalY + offset - 4, 72, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Grand Total (INR):", summaryX, finalY + offset + 1.5);
  doc.text(`Rs. ${totalAmount.toFixed(2)}`, 195, finalY + offset + 1.5, { align: "right" });

  // 5. Terms & Declarations Footer
  const footerY = 262;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, footerY, 195, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Declaration: This is a system-generated electronic invoice issued under Section 31 of the CGST Act, 2017. No physical signature is required.",
    15,
    footerY + 5
  );
  doc.text(
    "Goods delivered can be returned or exchanged within terms. For customer support: vasuunakka@gmail.com / support@toyvise.com",
    15,
    footerY + 9
  );
  doc.text(
    `Toy Vise Store Hub: ${data.companyAddress}`,
    15,
    footerY + 13
  );

  return doc;
}
