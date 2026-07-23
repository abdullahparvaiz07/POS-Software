import kitchenReportRepository from "./kitchen-report.repository";
import { BadRequestError } from "../../../errors";

export class KitchenReportService {
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
    return kitchenReportRepository.getSummary(start, end);
  }

  async getPreparationTime(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    return kitchenReportRepository.getPreparationTime(start, end);
  }

  async getChefPerformance(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    return kitchenReportRepository.getChefPerformance(start, end);
  }

  async getQueueAnalysis() {
    return kitchenReportRepository.getQueueAnalysis();
  }

  async getDelayedOrders(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    return kitchenReportRepository.getDelayedOrders(start, end);
  }

  async getPeakHours(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    return kitchenReportRepository.getPeakHours(start, end);
  }

  async getEfficiency(startDate?: string, endDate?: string) {
    const summary = await this.getSummary(startDate, endDate);
    
    let accuracy = 100;
    if (summary.completedOrders > 0) {
      accuracy = ((summary.completedOrders - summary.delayedOrders) / summary.completedOrders) * 100;
    }

    return {
      completedOrdersPercent: accuracy > 0 ? 100 : 0, // Placeholder metric
      averageQueueTime: summary.averagePreparationTime,
      preparationAccuracy: accuracy.toFixed(2),
    };
  }
}

export default new KitchenReportService();
