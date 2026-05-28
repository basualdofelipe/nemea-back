export interface CalcResult {
  totalCliente: number;
  tasaBase: number;
  tasaConIVA: number;
  comisionPasarela: number;
  tasaCuotas: number;
  costoFinanciacion: number;
  cpt: number;
  baseGravada: number;
  ivaDebito: number;
  ivaCreditoProducto: number;
  ivaCreditoComision: number;
  ivaNeto: number;
  retencionIIBB: number;
  netoRecibido: number;
  costoProductoConIVA: number;
  gananciaReal: number;
  margen: number;
}

export interface CalcInverseResult extends CalcResult {
  precioVenta: number;
}

export interface CalcBatchItem {
  productId: string;
  productName: string;
  cost: number;
  currentPrice: number | null;
  result: CalcResult | null;
}

export interface CalcError {
  error: true;
  message: string;
}
