import purchaseReportRepository from "./purchase-report.repository";
import { BadRequestError } from "../../../errors";

export class PurchaseReportService {
  private validateDates(startDate?: string, endDate?: string) {
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestError("Invalid date format. Use YYYY-MM-DD.");
      }
      if (start > end) {
        throw new BadRequestError("startDate cannot be after endDate.");
      }
      end.setHours(23, 59, 59, 999);
      start.setHours(0, 0, 0, 0);
    }
    return { start, end };
  }

  async getSummary(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    return purchaseReportRepository.getSummary(start, end);
  }

  async getDailyPurchases(startDate: string, endDate: string) {
    if (!startDate || !endDate) throw new BadRequestError("startDate and endDate are required");
    const { start, end } = this.validateDates(startDate, endDate);
    return purchaseReportRepository.getDailyPurchases(start!, end!);
  }

  async getMonthlyPurchases(year?: number) {
    const targetYear = year || new Date().getFullYear();
    return purchaseReportRepository.getMonthlyPurchases(targetYear);
  }

  async getSupplierReport(supplierId?: number) {
    return purchaseReportRepository.getSupplierReport(supplierId);
  }

  async getPurchaseItems(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    return purchaseReportRepository.getPurchaseItems(start, end);
  }

  async getOutstandingPayments() {
    return purchaseReportRepository.getOutstandingPayments();
  }

  async getTopSuppliers(limit: number = 5) {
    return purchaseReportRepository.getTopSuppliers(limit);
  }
}

export default new PurchaseReportService();
