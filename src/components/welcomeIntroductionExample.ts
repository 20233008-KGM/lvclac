import { calcLiquidationPriceFromParams, calcToleranceRate } from '../calc/liquidation'

// MES uses $5 per index point. Prices, equity and fixed margins are teaching
// assumptions, not live quotes or exchange/broker margin requirements.
export const welcomeIntroductionPosition = {
  entryPrice: 6_000,
  currentPrice: 6_000,
  equity: 60_000,
  pointValue: 5,
  maintenancePerContract: 1_500,
  contracts: 10,
  addedContracts: 1,
} as const

function evaluateExample(contracts: number) {
  const position = welcomeIntroductionPosition
  const liquidationPrice = calcLiquidationPriceFromParams({
    equity: position.equity,
    currentPrice: position.currentPrice,
    totalQuantity: contracts * position.pointValue,
    maintenanceAtCurrent: contracts * position.maintenancePerContract,
    maintenanceFixed: true,
  }, 'long')
  return {
    liquidationPrice,
    toleranceRate: calcToleranceRate(position.currentPrice, liquidationPrice, 'long'),
  }
}

export const welcomeIntroductionExample = {
  before: evaluateExample(welcomeIntroductionPosition.contracts),
  after: evaluateExample(welcomeIntroductionPosition.contracts + welcomeIntroductionPosition.addedContracts),
}
