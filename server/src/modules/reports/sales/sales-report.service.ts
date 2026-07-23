import salesReportRepository from "./sales-report.repository";
import { BadRequestError } from "../../../errors";

export class SalesReportService {
  private validateDates(startDate?: string, endDate?: string) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // default 30 days ago

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError("Invalid date format. Use YYYY-MM-DD.");
    }

    if (start > end) {
      throw new BadRequestError("startDate cannot be after endDate.");
    }

    // Ensure full day coverage for end date
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    return { start, end };
  }

  async getSummary(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    return salesReportRepository.getSummary(start, end);
  }

  async getDailySales(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    return salesReportRepository.getDailySales(start, end);
  }

  async getHourlySales(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    return salesReportRepository.getHourlySales(start, end);
  }

  async getTopSellingItems(startDate?: string, endDate?: string, limit: number = 10) {
    const { start, end } = this.validateDates(startDate, endDate);
    return salesReportRepository.getTopSellingItems(start, end, limit);
  }

  async getOrderTypeBreakdown(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    return salesReportRepository.getOrderTypeBreakdown(start, end);
  }

  async getPaymentMethodBreakdown(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    return salesReportRepository.getPaymentMethodBreakdown(start, end);
  }
}

export default new SalesReportService();
