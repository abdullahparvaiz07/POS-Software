import { PricingItem, PricingResultItem, PricingSummary } from "./pricing.types";
import { PRICING_MESSAGES } from "./pricing.constants";
import { BadRequestError } from "../../errors";

class PricingService {
  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  calculateItem(item: PricingItem): PricingResultItem {
    if (item.quantity <= 0) {
      throw new BadRequestError(PRICING_MESSAGES.INVALID_QUANTITY);
    }
    if (item.unitPrice <= 0) {
      throw new BadRequestError(PRICING_MESSAGES.INVALID_PRICE);
    }

    const discountAmount = item.discountAmount ?? 0;
    const taxAmount = item.taxAmount ?? 0;
    const baseTotal = item.quantity * item.unitPrice;

    if (discountAmount > baseTotal) {
      throw new BadRequestError(PRICING_MESSAGES.DISCOUNT_EXCEEDS_SUBTOTAL);
    }

    const subtotal = this.round(baseTotal - discountAmount + taxAmount);

    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount,
      taxAmount,
      subtotal,
    };
  }

  calculateOrder(items: PricingItem[]): PricingSummary {
    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let grandTotal = 0;

    const resultItems: PricingResultItem[] = [];

    for (const item of items) {
      const calculatedItem = this.calculateItem(item);
      
      const itemBase = item.quantity * item.unitPrice;
      totalSubtotal += itemBase;
      totalDiscount += calculatedItem.discountAmount;
      totalTax += calculatedItem.taxAmount;
      
      resultItems.push(calculatedItem);
    }

    grandTotal = this.round(totalSubtotal - totalDiscount + totalTax);

    if (grandTotal < 0) {
      grandTotal = 0;
    }

    return {
      subtotal: this.round(totalSubtotal),
      discountAmount: this.round(totalDiscount),
      taxAmount: this.round(totalTax),
      grandTotal,
      items: resultItems,
    };
  }
}

export default new PricingService();
