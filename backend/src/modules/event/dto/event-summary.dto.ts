export class ProductSummaryDto {
  productId: number;
  name: string;
  availableQuantity?: number; // Only for unsold products
  quantitySold?: number;      // Only for general product summary
}

export class EventSummaryDto {
  memberId: number;
  memberName: string;
  totalRegisteredProducts: number;
  totalSoldProducts: number;
  totalRevenue: number;
  unsoldProducts: ProductSummaryDto[];
  generalProductSummary: ProductSummaryDto[];
}