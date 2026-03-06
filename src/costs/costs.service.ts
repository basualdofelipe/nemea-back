import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuppliesPerProductHistory } from '../products/entities/supplies-per-product-history.entity';
import { SupplyPriceHistory } from '../supplies/entities/supply-price-history.entity';
import {
  CostBreakdownItem,
  ProductCostData,
} from './dto/product-with-cost.dto';

@Injectable()
export class CostsService {
  constructor(
    @InjectRepository(SuppliesPerProductHistory)
    private readonly bomRepo: Repository<SuppliesPerProductHistory>,
    @InjectRepository(SupplyPriceHistory)
    private readonly priceHistoryRepo: Repository<SupplyPriceHistory>,
  ) {}

  async calculateAll(): Promise<Map<string, ProductCostData>> {
    // Query 1: All active BOM entries with product and supply relations
    const bomEntries = await this.bomRepo.find({
      where: { isActive: true },
      relations: ['product', 'supply'],
    });

    if (bomEntries.length === 0) {
      return new Map();
    }

    // Query 2: Latest price per supply using DISTINCT ON
    const latestPrices: { supply_id: string; price: string }[] =
      await this.priceHistoryRepo.query(
        `SELECT DISTINCT ON (supply_id) supply_id, price
         FROM supply_price_history
         ORDER BY supply_id, created_at DESC`,
      );

    const priceMap = new Map<string, number>();
    for (const row of latestPrices) {
      priceMap.set(row.supply_id, parseFloat(row.price));
    }

    return this.buildCostMap(bomEntries, priceMap);
  }

  async calculateForProduct(
    productId: string,
  ): Promise<ProductCostData | null> {
    // Query 1: BOM entries for this product
    const bomEntries = await this.bomRepo.find({
      where: { product: { id: productId }, isActive: true },
      relations: ['product', 'supply'],
    });

    if (bomEntries.length === 0) {
      return null;
    }

    // Query 2: Latest prices only for supplies in this BOM
    const supplyIds = bomEntries.map((entry) => entry.supply.id);
    const placeholders = supplyIds.map((_, i) => `$${i + 1}`).join(', ');

    const latestPrices: { supply_id: string; price: string }[] =
      await this.priceHistoryRepo.query(
        `SELECT DISTINCT ON (supply_id) supply_id, price
         FROM supply_price_history
         WHERE supply_id IN (${placeholders})
         ORDER BY supply_id, created_at DESC`,
        supplyIds,
      );

    const priceMap = new Map<string, number>();
    for (const row of latestPrices) {
      priceMap.set(row.supply_id, parseFloat(row.price));
    }

    // Build cost data for this single product
    const costMap = this.buildCostMap(bomEntries, priceMap);
    return costMap.get(productId) ?? null;
  }

  private buildCostMap(
    bomEntries: SuppliesPerProductHistory[],
    priceMap: Map<string, number>,
  ): Map<string, ProductCostData> {
    // Group BOM entries by product ID
    const productBom = new Map<string, SuppliesPerProductHistory[]>();
    for (const entry of bomEntries) {
      const productId = entry.product.id;
      const existing = productBom.get(productId) ?? [];
      existing.push(entry);
      productBom.set(productId, existing);
    }

    const costMap = new Map<string, ProductCostData>();

    for (const [productId, entries] of productBom) {
      const breakdown: CostBreakdownItem[] = [];
      const warnings: string[] = [];
      let totalCost = 0;

      for (const entry of entries) {
        const supply = entry.supply;
        const quantity = parseFloat(entry.quantity);
        const unitPrice = priceMap.get(supply.id) ?? null;

        let lineCost: number | null = null;
        if (unitPrice !== null) {
          lineCost = Math.round(unitPrice * quantity * 100) / 100;
          totalCost += lineCost;
        } else {
          warnings.push(`${supply.name} sin precio`);
        }

        if (!supply.isActive) {
          warnings.push(`${supply.name} inactivo`);
        }

        breakdown.push({
          supplyId: supply.id,
          supplyName: supply.name,
          supplyType: supply.type?.name ?? '',
          quantity,
          unitType: supply.unitType,
          unitPrice,
          lineCost,
          isSupplyActive: supply.isActive,
        });
      }

      costMap.set(productId, {
        cost: Math.round(totalCost * 100) / 100,
        costBreakdown: breakdown,
        costWarnings: warnings,
      });
    }

    return costMap;
  }
}
