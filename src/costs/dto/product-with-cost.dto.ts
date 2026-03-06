import type { ProductWithPrice } from '../../products/products.service';

export interface CostBreakdownItem {
  supplyId: string;
  supplyName: string;
  supplyType: string;
  quantity: number;
  unitType: string;
  unitPrice: number | null;
  lineCost: number | null;
  isSupplyActive: boolean;
}

export interface ProductCostData {
  cost: number;
  costBreakdown: CostBreakdownItem[];
  costWarnings: string[];
}

export interface ProductWithCost extends ProductWithPrice {
  cost: number | null;
  costBreakdown: CostBreakdownItem[] | null;
  costWarnings: string[];
}
