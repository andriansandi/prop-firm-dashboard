export type Phase = "challenge" | "verification" | "funded";
export type TradeType = "buy" | "sell";

export interface Account {
  login: number;
  server: string;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  marginFree: number;
  marginLevel: number;
  leverage: number;
  credit: number;
  floatingProfit: number;
  time: number;
}

export interface Rules {
  firm: string;
  phase: Phase;
  initialBalance: number;
  profitTargetPct: number;
  maxDailyLossPct: number;
  maxTotalLossPct: number;
}

export interface Position {
  ticket: number;
  symbol: string;
  type: TradeType;
  volume: number;
  priceOpen: number;
  priceCurrent: number;
  sl: number;
  tp: number;
  profit: number;
  swap: number;
  openTime: number;
}

export interface Deal {
  ticket: number;
  symbol: string;
  type: TradeType;
  volume: number;
  priceOpen: number;
  priceClose: number;
  profit: number;
  commission: number;
  swap: number;
  openTime: number;
  closeTime: number;
}

export interface Performance {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  netProfit: number;
  maxDrawdownPct: number;
  dailyPnl: number;
  bestTrade: number;
  worstTrade: number;
}

export interface DashboardSnapshot {
  account: Account;
  rules: Rules;
  positions: Position[];
  performance: Performance;
  deals: Deal[];
  generatedAt: number;
}

export interface AnalysisResponse {
  analysis: string;
  model: string;
  generatedAt: number;
}
