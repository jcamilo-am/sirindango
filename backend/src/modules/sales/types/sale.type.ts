import { Sale } from "@prisma/client";

export type FindAllOptions = {
  eventId?: number;
  artisanId?: number;
  order?: 'date' | 'quantity';
};

export type MultiSaleResult = {
  sale: Sale;
  totalAmount: number;
};