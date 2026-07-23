export const buildReceiptTemplate = (order: any, settings: any): string => {
  const line = "-".repeat(32);
  let content = "";

  // Header
  if (settings?.receiptHeader) {
    content += `${settings.receiptHeader}\n`;
  } else {
    content += `${settings?.restaurantName || "RESTAURANT"}\n`;
  }
  
  content += `Order #${order.orderNumber}\n`;
  content += `${line}\n`;

  // Items
  for (const item of order.orderItems) {
    const itemName = item.menuItemName + (item.variantName ? ` - ${item.variantName}` : "");
    content += `${itemName.padEnd(20)} ${item.quantity.toString().padStart(3)}\n`;
  }

  content += `${line}\n`;

  // Totals
  content += `Subtotal          ${order.subtotal.toString().padStart(10)}\n`;
  content += `Tax               ${order.taxAmount.toString().padStart(10)}\n`;
  content += `Discount          ${order.discountAmount.toString().padStart(10)}\n`;
  content += `Total             ${order.grandTotal.toString().padStart(10)}\n`;
  
  content += `${line}\n`;

  // Payment
  content += `${order.paymentMethod.padEnd(20)} ${order.grandTotal.toString().padStart(10)}\n`;
  content += `Change            ${"0".padStart(10)}\n`;

  content += `${line}\n`;

  // Footer
  if (settings?.receiptFooter) {
    content += `${settings.receiptFooter}\n`;
  } else {
    content += `Thank You\n`;
  }

  return content;
};
