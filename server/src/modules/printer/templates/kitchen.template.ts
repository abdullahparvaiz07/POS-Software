export const buildKitchenTemplate = (order: any, kitchenItems: any[]): string => {
  const line = "-".repeat(32);
  let content = "";

  content += `KITCHEN\n`;
  content += `Order #${order.orderNumber}\n`;
  if (order.tableNumber) {
    content += `Table ${order.tableNumber}\n`;
  }
  content += `${line}\n`;

  for (const item of kitchenItems) {
    const itemName = item.menuItemName + (item.variantName ? ` - ${item.variantName}` : "");
    content += `${item.quantity.toString().padStart(2)} ${itemName}\n`;
    
    if (item.notes) {
      const notes = item.notes.split('\n');
      for (const note of notes) {
        content += `   * ${note}\n`;
      }
    }
  }

  content += `${line}\n`;
  return content;
};
