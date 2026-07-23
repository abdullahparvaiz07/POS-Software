import financialReportRepository from "./financial-report.repository";
import { BadRequestError } from "../../../errors";

export class FinancialReportService {
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
    
    const [revenue, expenses, cogs, taxes, discountsData] = await Promise.all([
      financialReportRepository.getRevenue(start, end),
      financialReportRepository.getExpenses(start, end),
      financialReportRepository.getCOGS(start, end),
      financialReportRepository.getTaxes(start, end),
      financialReportRepository.getDiscounts(start, end)
    ]);

    const grossProfit = Number(revenue) - Number(cogs);
    const netProfit = grossProfit - Number(expenses); // Simplification

    return {
      revenue,
      expenses,
      cogs,
      grossProfit,
      netProfit,
      tax: taxes,
      discounts: discountsData.totalDiscounts
    };
  }

  async getProfitLoss(startDate?: string, endDate?: string) {
    const summary = await this.getSummary(startDate, endDate);
    return {
      revenue: summary.revenue,
      cogs: summary.cogs,
      grossProfit: summary.grossProfit,
      operatingExpenses: summary.expenses,
      netProfit: summary.netProfit
    };
  }

  async getRevenue(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    const revenue = await financialReportRepository.getRevenue(start, end);
    return { revenue };
  }

  async getExpenses(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    const expenses = await financialReportRepository.getExpenses(start, end);
    return { expenses };
  }

  async getCOGS(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    const cogs = await financialReportRepository.getCOGS(start, end);
    return { cogs };
  }

  async getGrossProfit(startDate?: string, endDate?: string) {
    const summary = await this.getSummary(startDate, endDate);
    return { grossProfit: summary.grossProfit };
  }

  async getNetProfit(startDate?: string, endDate?: string) {
    const summary = await this.getSummary(startDate, endDate);
    return { netProfit: summary.netProfit };
  }

  async getTaxes(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    const taxes = await financialReportRepository.getTaxes(start, end);
    return { taxCollected: taxes, taxPaid: 0, taxPayable: taxes };
  }

  async getDiscounts(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    const { totalDiscounts, ordersWithDiscounts } = await financialReportRepository.getDiscounts(start, end);
    const revenue = await financialReportRepository.getRevenue(start, end);
    
    let discountPercentage = 0;
    if (Number(revenue) + Number(totalDiscounts) > 0) {
      discountPercentage = (Number(totalDiscounts) / (Number(revenue) + Number(totalDiscounts))) * 100;
    }

    return {
      discountAmount: totalDiscounts,
      discountPercentage: discountPercentage.toFixed(2),
      ordersWithDiscounts,
    };
  }

  async getPayments(startDate?: string, endDate?: string) {
    const { start, end } = this.validateDates(startDate, endDate);
    return financialReportRepository.getPayments(start, end);
  }

  async getCashFlow(startDate?: string, endDate?: string) {
    const summary = await this.getSummary(startDate, endDate);
    const cashIn = summary.revenue;
    const cashOut = summary.expenses; // Note: actual cashflow includes unpaid purchases as not cash out, but for this level it's fine.
    
    return {
      cashIn,
      cashOut,
      netCash: Number(cashIn) - Number(cashOut)
    };
  }
}

export default new FinancialReportService();
