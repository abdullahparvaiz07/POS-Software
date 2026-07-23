import settingsRepository from "./settings.repository";
import { Prisma } from "@prisma/client";
import { BadRequestError } from "../../errors";
import auditService from "../audit/audit.service";
import { cacheService } from "../../infrastructure/redis/cache.service";
import { CACHE_KEYS } from "../../infrastructure/redis/cache.keys";

const VALID_CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED", "SAR"];

export class SettingsService {
  async getSettings() {
    return settingsRepository.getSettings();
  }

  async updateSettings(userId: number | undefined, data: any, ipAddress?: string, userAgent?: string) {
    // Validate tax percentage
    if (data.taxPercentage !== undefined && (Number(data.taxPercentage) < 0 || Number(data.taxPercentage) > 100)) {
      throw new BadRequestError("Tax percentage must be between 0 and 100.");
    }

    // Filter allowed fields only to prevent Prisma unknown field errors
    const allowedFields = [
      "restaurantName", "slogan", "logo", "favicon", "phone", "email", "website",
      "address", "city", "country", "postalCode", "currency", "currencySymbol",
      "taxPercentage", "serviceCharge", "timezone", "language", "receiptHeader",
      "receiptFooter", "orderPrefix", "invoicePrefix", "theme", "allowNegativeInventory",
      "enableAutoWaiterAssignment", "enableAutoRiderAssignment", "assignmentStrategy",
      "ntn", "strn", "enableTax", "enableServiceCharges", "showLogoOnReceipt", "printTax"
    ];

    const cleanPayload: any = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        if (key === "currency") {
          cleanPayload.currency = VALID_CURRENCIES.includes(data.currency) ? data.currency : "PKR";
        } else if (key === "taxPercentage" || key === "serviceCharge") {
          cleanPayload[key] = Number(data[key]) || 0;
        } else {
          cleanPayload[key] = data[key];
        }
      }
    }

    const oldSettings = await settingsRepository.getSettings();
    const updatedSettings = await settingsRepository.updateSettings(cleanPayload);

    // Fail-safe audit logging
    auditService.logEvent({
      userId,
      module: "Settings",
      action: "UPDATE",
      entityId: updatedSettings.id,
      description: "Updated system settings",
      oldData: oldSettings,
      newData: updatedSettings,
      ipAddress,
      userAgent,
    }).catch(err => console.error("Settings audit log failed:", err));

    await cacheService.del(CACHE_KEYS.SETTINGS).catch(() => {});

    return updatedSettings;
  }
}

export default new SettingsService();