export interface GenerateOrderNumberOptions {
  businessDate?: Date;
}

export interface GeneratedOrderNumber {
  orderNumber: string;
  sequence: number;
  businessDate: Date;
}
