import prisma from "../../config/prisma";
import { Prisma } from "@prisma/client";

export class SettingsRepository {
  async getSettings() {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          restaurantName: "Restaurant POS",
          phone: "0000000000",
          address: "Default Address",
          city: "Default City",
          country: "Default Country",
          currency: "USD",
          currencySymbol: "$",
          timezone: "UTC",
          language: "en",
        }
      });
    }
    return settings;
  }

  async updateSettings(data: Prisma.SettingsUpdateInput) {
    const settings = await this.getSettings();
    return prisma.settings.update({
      where: { id: settings.id },
      data,
    });
  }
}

export default new SettingsRepository();