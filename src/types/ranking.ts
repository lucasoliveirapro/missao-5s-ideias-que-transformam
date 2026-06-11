import type { ZCardType } from "./database";

export type TopThreeFiltersValue = {
  startDate: string;
  endDate: string;
  shift?: string;
  team?: string;
  ute?: string;
  line?: string;
  status?: string;
  includeCanceled: boolean;
  includeIntegration: boolean;
  registeredOnly: boolean;
  zType?: ZCardType | "ALL";
};

export type TopThreeItem = {
  position: number;
  operatorId: string | null;
  operatorName: string;
  badge: string | null;
  shift: string | null;
  team: string | null;
  ute: string | null;
  photoUrl: string | null;
  z2Count: number;
  z3Count: number;
  z4Count: number;
  amTotal: number;
  pmTotal: number;
  totalCards: number;
  closedTotal: number;
  closureRate: number;
};

export type TopThreeResponse = {
  period: {
    startDate: string;
    endDate: string;
  };
  items: TopThreeItem[];
  summary: {
    totalCards: number;
    z2Total: number;
    z3Total: number;
    z4Total: number;
    amTotal: number;
    pmTotal: number;
  };
};
