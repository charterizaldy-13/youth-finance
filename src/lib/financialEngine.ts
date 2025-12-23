/**
 * Financial Planning Engine
 * Based on: Financial Planning Knowledge Base Indonesia
 * 
 * This engine implements deterministic financial calculations following
 * CFP-level analysis standards for Indonesian users.
 */

import type { UserFinancialData } from '@/types/finance';
import {
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateMonthlySurplus,
  calculateTotalMonthlyDebtPayments,
  calculateLiquidAssets,
  calculateTotalAssets,
  calculateTotalLiabilities,
  formatCurrency,
} from './calculations';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface FinancialSnapshot {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashflow: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidAssets: number;
  lifeStage: string;
  incomeStability: 'stabil' | 'tidak_stabil' | 'fluktuatif';
}

export interface CashflowAnalysis {
  expenseRatio: number;
  expenseStatus: 'sehat' | 'waspada' | 'bahaya';
  savingsRatio: number;
  savingsStatus: 'sehat' | 'waspada' | 'bahaya';
  cashflowSurplus: number;
  recommendation: string;
}

export interface EmergencyFundAnalysis {
  idealMonths: number;
  idealAmount: number;
  currentAmount: number;
  coverage: number;
  status: 'kritis' | 'kurang' | 'aman';
  monthlyTarget: number;
  monthsToComplete: number;
  recommendation: string;
}

export interface DebtAnalysis {
  dsr: number;
  dsrStatus: 'sehat' | 'waspada' | 'kritis';
  totalDebt: number;
  monthlyPayments: number;
  debtsByPriority: DebtDetail[];
  avalancheStrategy: DebtPayoffStrategy;
  snowballStrategy: DebtPayoffStrategy;
  recommendation: string;
}

export interface DebtDetail {
  name: string;
  type: string;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  remainingMonths: number;
  totalInterestCost: number;
  priority: number;
}

export interface DebtPayoffStrategy {
  method: 'avalanche' | 'snowball';
  order: string[];
  totalInterestPaid: number;
  payoffMonths: number;
  monthlySavings: number;
}

export interface InsuranceNeedsAnalysis {
  health: HealthInsuranceNeeds;
  criticalIllness: CriticalIllnessNeeds;
  life: LifeInsuranceNeeds;
  protectionGaps: ProtectionGap[];
  overallStatus: 'underinsured' | 'adequate' | 'overinsured';
  recommendation: string;
}

export interface HealthInsuranceNeeds {
  recommendedClass: string;
  estimatedDailyCost: number;
  idealAnnualLimit: number;
  currentCoverage: number;
  gap: number;
  hasBPJS: boolean;
  hasPrivateInsurance: boolean;
  benefits: string[];
}

export interface CriticalIllnessNeeds {
  idealCoverage: number;
  currentCoverage: number;
  gap: number;
  recoveryYears: number;
  recommendation: string;
}

export interface LifeInsuranceNeeds {
  hlv: number;
  familyNeedApproach: number;
  recommendedCoverage: number;
  currentCoverage: number;
  gap: number;
  productiveYearsLeft: number;
  recommendation: string;
}

export interface ProtectionGap {
  type: 'health' | 'critical_illness' | 'life' | 'other';
  name: string;
  gapAmount: number;
  priority: 'tinggi' | 'sedang' | 'rendah';
  recommendation: string;
}

export interface InvestmentStrategy {
  investableAmount: number;
  riskProfile: 'konservatif' | 'moderat' | 'agresif';
  lifeStage: string;
  allocation: AssetAllocation;
  recommendedInstruments: InstrumentRecommendation[];
  monthlyInvestmentCapacity: number;
  recommendation: string;
}

export interface AssetAllocation {
  equity: number;
  fixedIncome: number;
  cash: number;
  alternative: number;
}

export interface InstrumentRecommendation {
  name: string;
  allocation: number;
  description: string;
  riskLevel: 'rendah' | 'sedang' | 'tinggi';
  expectedReturn: string;
}

export interface FinancialPriority {
  rank: number;
  category: 'protection' | 'emergency_fund' | 'debt' | 'investment' | 'legacy';
  action: string;
  amount: number;
  urgency: 'tinggi' | 'sedang' | 'rendah';
  reason: string;
}

export interface FinancialBlueprint {
  snapshot: FinancialSnapshot;
  cashflow: CashflowAnalysis;
  emergencyFund: EmergencyFundAnalysis;
  debt: DebtAnalysis;
  insurance: InsuranceNeedsAnalysis;
  investment: InvestmentStrategy;
  priorities: FinancialPriority[];
  roadmap: RoadmapItem[];
  summary: string;
}

export interface RoadmapItem {
  period: '1_bulan' | '3_bulan' | '6_bulan' | '1_tahun' | '5_tahun';
  actions: string[];
  targets: string[];
}

// ============================================
// ENGINE FUNCTIONS
// ============================================

/**
 * Determine life stage based on age (BAB 1.3)
 */
export const getLifeStage = (age: number): string => {
  if (age < 30) return 'Wealth Accumulation';
  if (age >= 30 && age < 45) return 'Growth & Protection';
  if (age >= 45 && age < 55) return 'Preservation';
  return 'Distribution';
};

/**
 * Determine income stability based on job type
 */
export const getIncomeStability = (
  jobType: string
): 'stabil' | 'tidak_stabil' | 'fluktuatif' => {
  switch (jobType) {
    case 'karyawan':
      return 'stabil';
    case 'pengusaha':
    case 'freelancer':
      return 'fluktuatif';
    default:
      return 'tidak_stabil';
  }
};

/**
 * Calculate Financial Snapshot
 */
export const calculateFinancialSnapshot = (
  data: UserFinancialData
): FinancialSnapshot => {
  const monthlyIncome = calculateMonthlyIncome(data);
  const monthlyExpenses = calculateMonthlyExpenses(data);
  const monthlyCashflow = monthlyIncome - monthlyExpenses;

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlyCashflow,
    totalAssets: calculateTotalAssets(data),
    totalLiabilities: calculateTotalLiabilities(data),
    netWorth: calculateTotalAssets(data) - calculateTotalLiabilities(data),
    liquidAssets: calculateLiquidAssets(data),
    lifeStage: getLifeStage(data.personalInfo.usia),
    incomeStability: getIncomeStability(data.personalInfo.statusPekerjaan),
  };
};

/**
 * Analyze Cashflow (BAB 2 & 3)
 */
export const analyzeCashflow = (data: UserFinancialData): CashflowAnalysis => {
  const income = calculateMonthlyIncome(data);
  const expenses = calculateMonthlyExpenses(data);
  const surplus = income - expenses;

  const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;
  const savingsRatio = income > 0 ? Math.max(0, (surplus / income) * 100) : 0;

  let expenseStatus: 'sehat' | 'waspada' | 'bahaya';
  if (expenseRatio <= 70) expenseStatus = 'sehat';
  else if (expenseRatio <= 90) expenseStatus = 'waspada';
  else expenseStatus = 'bahaya';

  let savingsStatus: 'sehat' | 'waspada' | 'bahaya';
  if (savingsRatio >= 20) savingsStatus = 'sehat';
  else if (savingsRatio >= 10) savingsStatus = 'waspada';
  else savingsStatus = 'bahaya';

  let recommendation = '';
  if (surplus < 0) {
    recommendation = `Cashflow negatif sebesar ${formatCurrency(Math.abs(surplus))}/bulan. Segera kurangi pengeluaran atau tingkatkan pendapatan.`;
  } else if (savingsRatio < 10) {
    recommendation = `Rasio tabungan hanya ${savingsRatio.toFixed(1)}%. Target minimal 20% dari pendapatan.`;
  } else if (savingsRatio < 20) {
    recommendation = `Rasio tabungan ${savingsRatio.toFixed(1)}% cukup baik, namun idealnya 20% atau lebih.`;
  } else {
    recommendation = `Cashflow sehat dengan rasio tabungan ${savingsRatio.toFixed(1)}%. Pertahankan disiplin keuangan.`;
  }

  return {
    expenseRatio,
    expenseStatus,
    savingsRatio,
    savingsStatus,
    cashflowSurplus: surplus,
    recommendation,
  };
};

/**
 * Calculate Emergency Fund Needs (BAB 4 & 11.3)
 */
export const analyzeEmergencyFund = (
  data: UserFinancialData
): EmergencyFundAnalysis => {
  const monthlyExpenses = calculateMonthlyExpenses(data);
  const surplus = calculateMonthlySurplus(data);
  const { personalInfo } = data;

  // Calculate ideal months based on status (Engine 11.3)
  let baseMonth = 3;

  if (personalInfo.statusPernikahan === 'menikah' && personalInfo.jumlahTanggungan === 0) {
    baseMonth = 6;
  } else if (personalInfo.jumlahTanggungan >= 1) {
    baseMonth = 9;
  }

  // Add 3 months for entrepreneurs/freelancers
  if (personalInfo.statusPekerjaan === 'pengusaha' || personalInfo.statusPekerjaan === 'freelancer') {
    baseMonth += 3;
  }

  const idealAmount = monthlyExpenses * baseMonth;
  const currentAmount = data.emergencyFund.danaDaruratSaatIni;
  const coverage = idealAmount > 0 ? (currentAmount / idealAmount) * 100 : 0;

  let status: 'kritis' | 'kurang' | 'aman';
  if (coverage < 50) status = 'kritis';
  else if (coverage < 100) status = 'kurang';
  else status = 'aman';

  const gap = Math.max(0, idealAmount - currentAmount);
  const monthlyTarget = gap > 0 && surplus > 0 ? Math.min(gap / 12, surplus * 0.5) : 0;
  const monthsToComplete = monthlyTarget > 0 ? Math.ceil(gap / monthlyTarget) : 0;

  let recommendation = '';
  if (status === 'kritis') {
    recommendation = `Dana darurat dalam kondisi KRITIS (${coverage.toFixed(0)}%). Prioritaskan alokasi ${formatCurrency(monthlyTarget)}/bulan hingga mencapai target.`;
  } else if (status === 'kurang') {
    recommendation = `Dana darurat masih KURANG (${coverage.toFixed(0)}%). Lanjutkan menabung ${formatCurrency(monthlyTarget)}/bulan.`;
  } else {
    recommendation = `Dana darurat AMAN (${coverage.toFixed(0)}%). Fokus ke proteksi dan investasi.`;
  }

  return {
    idealMonths: baseMonth,
    idealAmount,
    currentAmount,
    coverage,
    status,
    monthlyTarget,
    monthsToComplete,
    recommendation,
  };
};

/**
 * Analyze Debt Health (BAB 5 & 11.4)
 */
export const analyzeDebt = (data: UserFinancialData): DebtAnalysis => {
  const monthlyIncome = calculateMonthlyIncome(data);
  const monthlyPayments = calculateTotalMonthlyDebtPayments(data);
  const totalDebt = calculateTotalLiabilities(data);

  // Calculate DSR (Debt Service Ratio)
  const dsr = monthlyIncome > 0 ? (monthlyPayments / monthlyIncome) * 100 : 0;

  let dsrStatus: 'sehat' | 'waspada' | 'kritis';
  if (dsr <= 30) dsrStatus = 'sehat';
  else if (dsr <= 40) dsrStatus = 'waspada';
  else dsrStatus = 'kritis';

  // Map debts with priority
  const debtTypeLabels: Record<string, string> = {
    kta: 'KTA',
    paylater: 'PayLater',
    kartu_kredit: 'Kartu Kredit',
    pinjol_legal: 'Pinjaman Online',
    cicilan_hp: 'Cicilan HP',
    kendaraan: 'Cicilan Kendaraan',
    kpr: 'KPR',
    lainnya: 'Hutang Lainnya',
  };

  const debtsByPriority: DebtDetail[] = data.debts
    .map((debt) => ({
      name: debtTypeLabels[debt.jenisHutang] || debt.jenisHutang,
      type: debt.jenisHutang,
      balance: debt.totalSisaHutang,
      interestRate: debt.bungaPerTahun,
      monthlyPayment: debt.cicilanPerBulan,
      remainingMonths: debt.sisaTenorBulan,
      totalInterestCost:
        (debt.totalSisaHutang * debt.bungaPerTahun / 100) * (debt.sisaTenorBulan / 12),
      priority: 0,
    }))
    .sort((a, b) => b.interestRate - a.interestRate);

  // Assign priorities based on Avalanche method
  debtsByPriority.forEach((debt, index) => {
    debt.priority = index + 1;
  });

  // Calculate strategies
  const avalancheStrategy = calculatePayoffStrategy(debtsByPriority, 'avalanche');
  const snowballStrategy = calculatePayoffStrategy(
    [...debtsByPriority].sort((a, b) => a.balance - b.balance),
    'snowball'
  );

  let recommendation = '';
  if (dsrStatus === 'kritis') {
    recommendation = `DSR ${dsr.toFixed(1)}% KRITIS (>40%). Fokus pelunasan hutang berbunga tinggi segera.`;
  } else if (dsrStatus === 'waspada') {
    recommendation = `DSR ${dsr.toFixed(1)}% WASPADA. Hindari hutang baru dan percepat pelunasan.`;
  } else if (dsr > 0) {
    recommendation = `DSR ${dsr.toFixed(1)}% SEHAT. Pertahankan disiplin pembayaran.`;
  } else {
    recommendation = 'Tidak memiliki hutang. Kondisi finansial baik.';
  }

  return {
    dsr,
    dsrStatus,
    totalDebt,
    monthlyPayments,
    debtsByPriority,
    avalancheStrategy,
    snowballStrategy,
    recommendation,
  };
};

/**
 * Calculate debt payoff strategy
 */
const calculatePayoffStrategy = (
  debts: DebtDetail[],
  method: 'avalanche' | 'snowball'
): DebtPayoffStrategy => {
  const totalInterest = debts.reduce((sum, d) => sum + d.totalInterestCost, 0);
  const maxMonths = debts.length > 0 ? Math.max(...debts.map((d) => d.remainingMonths)) : 0;

  return {
    method,
    order: debts.map((d) => d.name),
    totalInterestPaid: totalInterest,
    payoffMonths: maxMonths,
    monthlySavings: method === 'avalanche' ? totalInterest * 0.1 : 0, // Estimated savings
  };
};

/**
 * Analyze Insurance Needs (BAB 6 & 11.5-11.7)
 */
export const analyzeInsuranceNeeds = (
  data: UserFinancialData
): InsuranceNeedsAnalysis => {
  const monthlyIncome = calculateMonthlyIncome(data);
  const monthlyExpenses = calculateMonthlyExpenses(data);
  const annualIncome = monthlyIncome * 12;
  const { personalInfo, insurance } = data;

  // UMR estimation (Jakarta 2024: ~5.0M)
  const UMR = 5000000;

  // Health Insurance Analysis (11.5)
  let recommendedClass = 'Standar RS Swasta';
  let estimatedDailyCost = 500000;

  if (monthlyIncome >= 3 * UMR) {
    recommendedClass = 'VIP';
    estimatedDailyCost = 2000000;
  } else if (monthlyIncome >= 2 * UMR) {
    recommendedClass = 'Kelas 1 RS Swasta';
    estimatedDailyCost = 1000000;
  }

  // Calculate ideal annual limit (180 days + buffer)
  const idealAnnualLimit = estimatedDailyCost * 180 + 200000000; // + buffer for critical illness

  // Calculate current health coverage
  let currentHealthCoverage = 0;
  const healthBenefits: string[] = [];

  if (insurance.bpjs.punya) {
    // BPJS coverage estimation based on class
    const bpjsCoverage: Record<string, number> = {
      'kelas_1': 50000000,
      'kelas_2': 30000000,
      'kelas_3': 20000000,
    };
    currentHealthCoverage += bpjsCoverage[insurance.bpjs.kelas] || 30000000;
    healthBenefits.push(`BPJS ${insurance.bpjs.kelas.replace('_', ' ')}`);
  }

  if (insurance.kesehatanSwasta.punya) {
    insurance.kesehatanSwasta.manfaat.forEach((m) => {
      currentHealthCoverage += m.limitPerTahun;
      healthBenefits.push(m.namaManfaat);
    });
  }

  const healthGap = Math.max(0, idealAnnualLimit - currentHealthCoverage);

  // Critical Illness Analysis (11.6)
  const recoveryYears = 3; // Conservative: 3-5 years
  let criticalIllnessNeed = monthlyExpenses * 12 * recoveryYears;
  if (criticalIllnessNeed < 500000000) criticalIllnessNeed = 500000000;
  criticalIllnessNeed = Math.ceil(criticalIllnessNeed / 100000000) * 100000000; // Round to 100M

  const currentCriticalIllness = insurance.asuransiLainnya
    .filter((i) => i.jenisAsuransi === 'penyakit_kritis')
    .reduce((sum, i) => sum + i.nilaiManfaat, 0);

  const ciGap = Math.max(0, criticalIllnessNeed - currentCriticalIllness);

  // Life Insurance Analysis (11.7)
  const retirementAge = 55;
  const productiveYearsLeft = Math.max(0, retirementAge - personalInfo.usia);
  const hlv = annualIncome * productiveYearsLeft;

  // Family need approach
  const dependentsYears = personalInfo.jumlahTanggungan > 0 ? 20 : 0; // Years until dependents are independent
  const annualExpenses = monthlyExpenses * 12;
  const totalDebt = calculateTotalLiabilities(data);
  const educationCost = personalInfo.jumlahTanggungan * 500000000; // Estimated education cost per child
  const liquidAssets = calculateLiquidAssets(data);

  const familyNeedApproach =
    annualExpenses * dependentsYears + totalDebt + educationCost - liquidAssets;

  const recommendedLifeCoverage = Math.max(hlv, familyNeedApproach);

  const currentLifeCoverage = insurance.asuransiLainnya
    .filter((i) => i.jenisAsuransi === 'jiwa')
    .reduce((sum, i) => sum + i.nilaiManfaat, 0);

  const lifeGap = Math.max(0, recommendedLifeCoverage - currentLifeCoverage);

  // Build protection gaps
  const protectionGaps: ProtectionGap[] = [];

  if (healthGap > 0) {
    protectionGaps.push({
      type: 'health',
      name: 'Asuransi Kesehatan',
      gapAmount: healthGap,
      priority: 'tinggi',
      recommendation: `Tambah asuransi kesehatan dengan limit ${formatCurrency(healthGap)}/tahun`,
    });
  }

  if (ciGap > 0) {
    protectionGaps.push({
      type: 'critical_illness',
      name: 'Asuransi Penyakit Kritis',
      gapAmount: ciGap,
      priority: personalInfo.usia > 40 ? 'tinggi' : 'sedang',
      recommendation: `Tambah proteksi penyakit kritis UP ${formatCurrency(ciGap)}`,
    });
  }

  if (lifeGap > 0 && personalInfo.jumlahTanggungan > 0) {
    protectionGaps.push({
      type: 'life',
      name: 'Asuransi Jiwa',
      gapAmount: lifeGap,
      priority: 'tinggi',
      recommendation: `Tambah asuransi jiwa berjangka UP ${formatCurrency(lifeGap)}`,
    });
  }

  // Overall status
  let overallStatus: 'underinsured' | 'adequate' | 'overinsured' = 'adequate';
  if (protectionGaps.length > 0) {
    overallStatus = 'underinsured';
  }

  const recommendation =
    protectionGaps.length > 0
      ? `Terdapat ${protectionGaps.length} gap proteksi yang perlu ditutup. Prioritaskan ${protectionGaps[0]?.name}.`
      : 'Proteksi asuransi sudah memadai. Review berkala setiap tahun.';

  return {
    health: {
      recommendedClass,
      estimatedDailyCost,
      idealAnnualLimit,
      currentCoverage: currentHealthCoverage,
      gap: healthGap,
      hasBPJS: insurance.bpjs.punya,
      hasPrivateInsurance: insurance.kesehatanSwasta.punya,
      benefits: healthBenefits,
    },
    criticalIllness: {
      idealCoverage: criticalIllnessNeed,
      currentCoverage: currentCriticalIllness,
      gap: ciGap,
      recoveryYears,
      recommendation:
        ciGap > 0
          ? `Perlu tambahan UP penyakit kritis ${formatCurrency(ciGap)}`
          : 'Proteksi penyakit kritis memadai',
    },
    life: {
      hlv,
      familyNeedApproach,
      recommendedCoverage: recommendedLifeCoverage,
      currentCoverage: currentLifeCoverage,
      gap: lifeGap,
      productiveYearsLeft,
      recommendation:
        lifeGap > 0 && personalInfo.jumlahTanggungan > 0
          ? `Perlu asuransi jiwa berjangka UP ${formatCurrency(lifeGap)}`
          : personalInfo.jumlahTanggungan === 0
          ? 'Tidak prioritas karena tidak ada tanggungan'
          : 'Proteksi jiwa memadai',
    },
    protectionGaps,
    overallStatus,
    recommendation,
  };
};

/**
 * Build Investment Strategy (BAB 7 & 11.8-11.9)
 */
export const buildInvestmentStrategy = (
  data: UserFinancialData
): InvestmentStrategy => {
  const surplus = calculateMonthlySurplus(data);
  const { personalInfo, riskProfile } = data;
  const age = personalInfo.usia;

  // Determine risk profile (11.8)
  let calculatedRiskProfile: 'konservatif' | 'moderat' | 'agresif' = 'moderat';

  if (age < 35 && riskProfile.toleransiRisiko === 'tinggi') {
    calculatedRiskProfile = 'agresif';
  } else if (age >= 35 && age < 50) {
    calculatedRiskProfile = 'moderat';
  } else if (age >= 50) {
    calculatedRiskProfile = 'konservatif';
  }

  // Override based on user's stated tolerance
  if (riskProfile.toleransiRisiko === 'rendah') {
    calculatedRiskProfile = 'konservatif';
  }

  // Asset allocation (11.9)
  let allocation: AssetAllocation;
  let instruments: InstrumentRecommendation[];

  switch (calculatedRiskProfile) {
    case 'agresif':
      allocation = { equity: 70, fixedIncome: 20, cash: 5, alternative: 5 };
      instruments = [
        {
          name: 'Reksadana Saham Indonesia',
          allocation: 35,
          description: 'IDX30/LQ45 untuk pertumbuhan',
          riskLevel: 'tinggi',
          expectedReturn: '12-18% p.a.',
        },
        {
          name: 'S&P 500 ETF (VOO/SPY)',
          allocation: 20,
          description: 'Diversifikasi global',
          riskLevel: 'sedang',
          expectedReturn: '8-12% p.a.',
        },
        {
          name: 'Nasdaq 100 ETF (QQQ)',
          allocation: 15,
          description: 'Saham teknologi AS',
          riskLevel: 'tinggi',
          expectedReturn: '10-15% p.a.',
        },
        {
          name: 'Reksadana Pendapatan Tetap',
          allocation: 15,
          description: 'Obligasi untuk stabilitas',
          riskLevel: 'rendah',
          expectedReturn: '6-8% p.a.',
        },
        {
          name: 'Crypto (BTC/ETH)',
          allocation: 10,
          description: 'Aset digital (max 10-15%)',
          riskLevel: 'tinggi',
          expectedReturn: 'Volatil',
        },
        {
          name: 'Emas',
          allocation: 5,
          description: 'Lindung nilai',
          riskLevel: 'rendah',
          expectedReturn: '5-10% p.a.',
        },
      ];
      break;

    case 'moderat':
      allocation = { equity: 50, fixedIncome: 30, cash: 15, alternative: 5 };
      instruments = [
        {
          name: 'Reksadana Saham',
          allocation: 30,
          description: 'Indeks saham Indonesia',
          riskLevel: 'tinggi',
          expectedReturn: '10-15% p.a.',
        },
        {
          name: 'S&P 500 ETF (VOO)',
          allocation: 20,
          description: 'Pasar saham AS',
          riskLevel: 'sedang',
          expectedReturn: '8-12% p.a.',
        },
        {
          name: 'Reksadana Pendapatan Tetap',
          allocation: 25,
          description: 'Obligasi pemerintah & korporasi',
          riskLevel: 'rendah',
          expectedReturn: '6-8% p.a.',
        },
        {
          name: 'Reksadana Pasar Uang',
          allocation: 15,
          description: 'Likuiditas tinggi',
          riskLevel: 'rendah',
          expectedReturn: '4-6% p.a.',
        },
        {
          name: 'Emas',
          allocation: 10,
          description: 'Lindung nilai inflasi',
          riskLevel: 'rendah',
          expectedReturn: '5-10% p.a.',
        },
      ];
      break;

    default: // konservatif
      allocation = { equity: 20, fixedIncome: 60, cash: 15, alternative: 5 };
      instruments = [
        {
          name: 'Reksadana Pasar Uang',
          allocation: 35,
          description: 'Stabil dan likuid',
          riskLevel: 'rendah',
          expectedReturn: '4-6% p.a.',
        },
        {
          name: 'Reksadana Pendapatan Tetap',
          allocation: 35,
          description: 'Obligasi untuk pendapatan',
          riskLevel: 'rendah',
          expectedReturn: '6-8% p.a.',
        },
        {
          name: 'Reksadana Campuran',
          allocation: 15,
          description: 'Kombinasi moderat',
          riskLevel: 'sedang',
          expectedReturn: '8-10% p.a.',
        },
        {
          name: 'Deposito',
          allocation: 10,
          description: 'Jaminan LPS',
          riskLevel: 'rendah',
          expectedReturn: '4-5% p.a.',
        },
        {
          name: 'Emas',
          allocation: 5,
          description: 'Lindung nilai',
          riskLevel: 'rendah',
          expectedReturn: '5-10% p.a.',
        },
      ];
  }

  // Calculate investable amount (after protection & emergency fund)
  const investableAmount = Math.max(0, surplus * 0.6); // Assume 60% of surplus for investment

  const recommendation =
    investableAmount > 0
      ? `Alokasikan ${formatCurrency(investableAmount)}/bulan untuk investasi dengan profil ${calculatedRiskProfile}.`
      : 'Fokus pada proteksi dan dana darurat terlebih dahulu sebelum investasi.';

  return {
    investableAmount,
    riskProfile: calculatedRiskProfile,
    lifeStage: getLifeStage(age),
    allocation,
    recommendedInstruments: instruments,
    monthlyInvestmentCapacity: investableAmount,
    recommendation,
  };
};

/**
 * Build Financial Priorities (BAB 9 & 11.10)
 */
export const buildFinancialPriorities = (
  data: UserFinancialData
): FinancialPriority[] => {
  const priorities: FinancialPriority[] = [];
  let rank = 1;

  const insuranceAnalysis = analyzeInsuranceNeeds(data);
  const emergencyAnalysis = analyzeEmergencyFund(data);
  const debtAnalysis = analyzeDebt(data);
  const surplus = calculateMonthlySurplus(data);

  // Priority 1: Protection (11.10)
  if (insuranceAnalysis.overallStatus === 'underinsured') {
    insuranceAnalysis.protectionGaps.forEach((gap) => {
      priorities.push({
        rank: rank++,
        category: 'protection',
        action: gap.recommendation,
        amount: gap.gapAmount,
        urgency: gap.priority,
        reason: 'Proteksi adalah fondasi keuangan yang sehat.',
      });
    });
  }

  // Priority 2: Emergency Fund
  if (emergencyAnalysis.status !== 'aman') {
    priorities.push({
      rank: rank++,
      category: 'emergency_fund',
      action: `Alokasikan ${formatCurrency(emergencyAnalysis.monthlyTarget)}/bulan untuk dana darurat`,
      amount: emergencyAnalysis.idealAmount - emergencyAnalysis.currentAmount,
      urgency: emergencyAnalysis.status === 'kritis' ? 'tinggi' : 'sedang',
      reason: 'Dana darurat melindungi dari kejadian tak terduga.',
    });
  }

  // Priority 3: High-interest Debt
  if (debtAnalysis.dsrStatus !== 'sehat') {
    const highInterestDebts = debtAnalysis.debtsByPriority.filter(
      (d) => d.interestRate > 15
    );
    if (highInterestDebts.length > 0) {
      priorities.push({
        rank: rank++,
        category: 'debt',
        action: `Percepat pelunasan ${highInterestDebts[0].name} (bunga ${highInterestDebts[0].interestRate}%)`,
        amount: highInterestDebts[0].balance,
        urgency: 'tinggi',
        reason: 'Hutang berbunga tinggi menggerus kekayaan.',
      });
    }
  }

  // Priority 4: Investment
  if (
    insuranceAnalysis.overallStatus === 'adequate' &&
    emergencyAnalysis.status === 'aman' &&
    surplus > 0
  ) {
    const investmentStrategy = buildInvestmentStrategy(data);
    priorities.push({
      rank: rank++,
      category: 'investment',
      action: investmentStrategy.recommendation,
      amount: investmentStrategy.investableAmount * 12,
      urgency: 'sedang',
      reason: 'Investasi untuk pertumbuhan kekayaan jangka panjang.',
    });
  }

  return priorities;
};

/**
 * Generate Financial Roadmap
 */
export const generateRoadmap = (data: UserFinancialData): RoadmapItem[] => {
  const priorities = buildFinancialPriorities(data);
  const emergencyAnalysis = analyzeEmergencyFund(data);
  const debtAnalysis = analyzeDebt(data);
  const insuranceAnalysis = analyzeInsuranceNeeds(data);

  const roadmap: RoadmapItem[] = [
    {
      period: '1_bulan',
      actions: [
        'Review dan kategorikan semua pengeluaran',
        'Set up auto-transfer untuk dana darurat',
        ...(insuranceAnalysis.protectionGaps.length > 0
          ? ['Cari penawaran asuransi untuk gap proteksi']
          : []),
      ],
      targets: [
        `Mulai alokasi dana darurat ${formatCurrency(emergencyAnalysis.monthlyTarget)}/bulan`,
      ],
    },
    {
      period: '3_bulan',
      actions: [
        ...(insuranceAnalysis.protectionGaps.length > 0
          ? ['Aktifkan polis asuransi baru']
          : []),
        'Evaluasi progress dana darurat',
        ...(debtAnalysis.dsr > 30 ? ['Negosiasi restrukturisasi hutang'] : []),
      ],
      targets: [
        `Dana darurat: ${formatCurrency(emergencyAnalysis.currentAmount + emergencyAnalysis.monthlyTarget * 3)}`,
      ],
    },
    {
      period: '6_bulan',
      actions: [
        'Review alokasi investasi',
        'Evaluasi kinerja portfolio',
        'Update kebutuhan asuransi',
      ],
      targets: [
        emergencyAnalysis.status !== 'aman'
          ? `Dana darurat mencapai ${((emergencyAnalysis.coverage + 25) / 100 * 100).toFixed(0)}%`
          : 'Pertahankan dana darurat',
      ],
    },
    {
      period: '1_tahun',
      actions: [
        'Review financial plan tahunan',
        'Update goal keuangan',
        'Evaluasi kebutuhan proteksi',
        'Rebalancing portfolio investasi',
      ],
      targets: [
        emergencyAnalysis.status === 'kritis'
          ? 'Dana darurat mencapai 50%'
          : 'Dana darurat 100%',
        ...priorities.slice(0, 2).map((p) => p.action),
      ],
    },
    {
      period: '5_tahun',
      actions: [
        'Evaluasi pencapaian tujuan keuangan',
        'Review kebutuhan proteksi sesuai life stage',
        'Pertimbangkan diversifikasi aset (properti/bisnis)',
      ],
      targets: [
        'Dana darurat terpenuhi 100%',
        'Proteksi lengkap',
        'Portfolio investasi berkembang',
        ...data.financialGoals.map((g) => g.namaTujuan),
      ],
    },
  ];

  return roadmap;
};

/**
 * Generate Complete Financial Blueprint
 */
export const generateFinancialBlueprint = (
  data: UserFinancialData
): FinancialBlueprint => {
  const snapshot = calculateFinancialSnapshot(data);
  const cashflow = analyzeCashflow(data);
  const emergencyFund = analyzeEmergencyFund(data);
  const debt = analyzeDebt(data);
  const insurance = analyzeInsuranceNeeds(data);
  const investment = buildInvestmentStrategy(data);
  const priorities = buildFinancialPriorities(data);
  const roadmap = generateRoadmap(data);

  // Generate summary
  const summaryParts: string[] = [];

  // Life stage context
  summaryParts.push(
    `Berdasarkan analisis komprehensif, Anda berada pada fase ${snapshot.lifeStage} dengan pendapatan ${formatCurrency(snapshot.monthlyIncome)}/bulan.`
  );

  // Cashflow status
  if (cashflow.cashflowSurplus > 0) {
    summaryParts.push(
      `Cashflow positif ${formatCurrency(cashflow.cashflowSurplus)}/bulan dengan rasio tabungan ${cashflow.savingsRatio.toFixed(1)}%.`
    );
  } else {
    summaryParts.push(
      `PERHATIAN: Cashflow negatif ${formatCurrency(Math.abs(cashflow.cashflowSurplus))}/bulan. Perlu evaluasi pengeluaran segera.`
    );
  }

  // Emergency fund
  summaryParts.push(`Dana darurat: ${emergencyFund.status.toUpperCase()} (${emergencyFund.coverage.toFixed(0)}%).`);

  // Debt
  if (debt.totalDebt > 0) {
    summaryParts.push(`Total hutang ${formatCurrency(debt.totalDebt)} dengan DSR ${debt.dsr.toFixed(1)}% (${debt.dsrStatus}).`);
  }

  // Protection
  summaryParts.push(`Status proteksi: ${insurance.overallStatus}.`);

  // Priority actions
  if (priorities.length > 0) {
    summaryParts.push(`\n\nPRIORITAS UTAMA:\n${priorities.slice(0, 3).map((p, i) => `${i + 1}. ${p.action}`).join('\n')}`);
  }

  const summary = summaryParts.join(' ');

  return {
    snapshot,
    cashflow,
    emergencyFund,
    debt,
    insurance,
    investment,
    priorities,
    roadmap,
    summary,
  };
};
