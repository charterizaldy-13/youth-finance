/**
 * AI Financial Advisor Engine
 * 
 * This module provides CFP-level financial advisory output:
 * - Diagnoses financial problems (not just displays metrics)
 * - Prioritizes issues by urgency and impact
 * - Designs concrete strategies with numeric targets
 * - Creates actionable roadmaps with timelines
 * - Writes professional advisory conclusions
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
  calculateEmergencyFundNeeded,
  calculateEmergencyFundCurrent,
  calculateRecommendedAllocationValues,
  getOverallHealthScore,
} from './calculations';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface FinancialDiagnosis {
  weaknesses: DiagnosisItem[];
  hiddenRisks: DiagnosisItem[];
  falseSecurities: DiagnosisItem[];
  overallHealthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface DiagnosisItem {
  issue: string;
  severity: 'kritis' | 'serius' | 'moderat' | 'ringan';
  impact: string;
  evidence: string;
}

export interface PriorityIssue {
  rank: number;
  classification: 'KRITIS' | 'PENTING' | 'OPTIMISASI';
  issue: string;
  urgency: string;
  financialImpact: number;
  deadline: string;
  shortExplanation?: string; // One-line explanation for Fokus Utama section
  justification?: string; // "Kenapa ini KRITIS" explanation
}

export interface RecommendedStrategy {
  priority: number;
  strategyName: string;
  objective: string;
  targetAmount: number;
  targetPercentage?: number;
  timeframe: string;
  specificActions: string[];
  tradeoffs: string[];
  expectedOutcome: string;
}

export interface ActionPlanItem {
  action: string;
  amount: number;
  deadline: string;
  frequency: 'sekali' | 'bulanan' | 'tahunan';
  rationale: string;
}

export interface ActionPlanTimeline {
  shortTerm: ActionPlanItem[]; // 0-3 months
  midTerm: ActionPlanItem[];   // 3-12 months
  longTerm: ActionPlanItem[];  // >12 months
}

export interface AdvisorReport {
  diagnosis: FinancialDiagnosis;
  priorityIssues: PriorityIssue[];
  strategies: RecommendedStrategy[];
  actionPlan: ActionPlanTimeline;
  advisorConclusion: string;
  generatedAt: Date;
}

// ============================================
// NARRATIVE INTENT DETECTION (DETERMINISTIC)
// ============================================

// Lifestyle upgrade intent - distinguishes between rental vs purchase vs big-ticket items
export interface LifestyleUpgradeIntent {
  type: 'rental_upgrade' | 'home_purchase' | 'purchase' | 'vehicle' | 'travel' | 'subscription' | 'other';
  description: string;
  extractedAmount?: number; // Amount extracted from narrative
  currentExpense?: number; // Current expense in that category
  additionalCost?: number; // Difference between new and current
}

// Feasibility assessment for lifestyle upgrades
export type FeasibilityStatus = 'FEASIBLE' | 'MARGINAL' | 'NOT_FEASIBLE';

export interface LifestyleUpgradeFeasibility {
  status: FeasibilityStatus;
  message: string;
  currentSurplus: number;
  surplusAfterUpgrade: number;
  savingsRatioAfterUpgrade: number;
  alternatives?: string[];
}

export interface NarrativeIntents {
  mentionsInsurance: boolean;
  mentionsMarriage: boolean;
  mentionsConfusion: boolean;
  mentionsInvestment: boolean;
  mentionsDebt: boolean;
  mentionsEmergency: boolean;
  mentionsHousing: boolean;
  mentionsRentalUpgrade: boolean; // NEW: specifically wants to upgrade rent
  mentionsHomePurchase: boolean;  // NEW: specifically wants to buy home
  mentionsEducation: boolean;
  mentionsRetirement: boolean;
  mentionsChildren: boolean;
  mentionsSideIncome: boolean;
  mentionsJobLoss: boolean;
  lifestyleUpgrade?: LifestyleUpgradeIntent; // NEW: detected lifestyle upgrade with amount
  rawKeywords: string[];
}

/**
 * Deterministic keyword-based intent detection from user's financial story.
 * This is NOT an LLM - it uses explicit keyword matching rules.
 */
export const detectNarrativeIntents = (userStory?: string): NarrativeIntents => {
  const story = userStory?.toLowerCase() || '';
  const detectedKeywords: string[] = [];

  // Insurance concerns
  const mentionsInsurance =
    story.includes('asuransi') ||
    story.includes('bpjs') ||
    story.includes('proteksi') ||
    story.includes('jaminan kesehatan') ||
    story.includes('rawat inap') ||
    story.includes('klaim');
  if (mentionsInsurance) detectedKeywords.push('asuransi');

  // Marriage/Wedding plans
  const mentionsMarriage =
    story.includes('nikah') ||
    story.includes('menikah') ||
    story.includes('pernikahan') ||
    story.includes('tunangan') ||
    story.includes('resepsi') ||
    story.includes('wedding');
  if (mentionsMarriage) detectedKeywords.push('pernikahan');

  // Confusion/Uncertainty
  const mentionsConfusion =
    story.includes('bingung') ||
    story.includes('tidak yakin') ||
    story.includes('ragu') ||
    story.includes('tidak tahu') ||
    story.includes('apakah perlu') ||
    story.includes('bagaimana cara') ||
    story.includes('sebaiknya');
  if (mentionsConfusion) detectedKeywords.push('kebingungan');

  // Investment interests
  const mentionsInvestment =
    story.includes('saham') ||
    story.includes('emas') ||
    story.includes('crypto') ||
    story.includes('reksadana') ||
    story.includes('investasi') ||
    story.includes('obligasi') ||
    story.includes('trading') ||
    story.includes('p2p lending');
  if (mentionsInvestment) detectedKeywords.push('investasi');

  // Debt concerns
  const mentionsDebt =
    story.includes('hutang') ||
    story.includes('cicilan') ||
    story.includes('kredit') ||
    story.includes('pinjaman') ||
    story.includes('kpr') ||
    story.includes('kartu kredit') ||
    story.includes('paylater') ||
    story.includes('lunas');
  if (mentionsDebt) detectedKeywords.push('hutang');

  // Emergency fund concerns
  const mentionsEmergency =
    story.includes('dana darurat') ||
    story.includes('emergency fund') ||
    story.includes('cadangan') ||
    story.includes('jaga-jaga') ||
    story.includes('tabungan darurat');
  if (mentionsEmergency) detectedKeywords.push('dana darurat');

  // Housing goals - now distinguishes rental upgrade from home purchase
  const mentionsHousing =
    story.includes('rumah') ||
    story.includes('apartemen') ||
    story.includes('properti') ||
    story.includes('dp rumah') ||
    story.includes('kpr') ||
    story.includes('sewa') ||
    story.includes('ngontrak') ||
    story.includes('kontrakan') ||
    story.includes('kos');

  // Specific: Rental upgrade (NOT purchase)
  const mentionsRentalUpgrade =
    story.includes('pindah kontrakan') ||
    story.includes('pindah kos') ||
    story.includes('sewa lebih') ||
    story.includes('kontrakan lebih') ||
    story.includes('kos lebih') ||
    (story.includes('pindah') && (story.includes('sewa') || story.includes('kontrakan') || story.includes('kos'))) ||
    (story.includes('upgrade') && (story.includes('kontrakan') || story.includes('kos')));

  // Specific: Home purchase
  const mentionsHomePurchase =
    story.includes('beli rumah') ||
    story.includes('membeli rumah') ||
    story.includes('dp rumah') ||
    story.includes('kepemilikan rumah') ||
    story.includes('cicil rumah') ||
    story.includes('kpr') ||
    (story.includes('rumah') && story.includes('sendiri'));

  if (mentionsRentalUpgrade) detectedKeywords.push('upgrade kontrakan');
  else if (mentionsHomePurchase) detectedKeywords.push('beli rumah');
  else if (mentionsHousing) detectedKeywords.push('rumah');

  // Education funding
  const mentionsEducation =
    story.includes('pendidikan') ||
    story.includes('sekolah') ||
    story.includes('kuliah') ||
    story.includes('kursus') ||
    story.includes('les') ||
    story.includes('beasiswa');
  if (mentionsEducation) detectedKeywords.push('pendidikan');

  // Retirement planning
  const mentionsRetirement =
    story.includes('pensiun') ||
    story.includes('hari tua') ||
    story.includes('retirement') ||
    story.includes('jht') ||
    story.includes('dana pensiun');
  if (mentionsRetirement) detectedKeywords.push('pensiun');

  // Children/Family
  const mentionsChildren =
    story.includes('anak') ||
    story.includes('keluarga') ||
    story.includes('tanggungan') ||
    story.includes('hamil') ||
    story.includes('melahirkan');
  if (mentionsChildren) detectedKeywords.push('keluarga');

  // Side income aspirations
  const mentionsSideIncome =
    story.includes('penghasilan tambahan') ||
    story.includes('usaha sampingan') ||
    story.includes('freelance') ||
    story.includes('bisnis') ||
    story.includes('passive income') ||
    story.includes('side hustle');
  if (mentionsSideIncome) detectedKeywords.push('penghasilan tambahan');

  // Job security concerns
  const mentionsJobLoss =
    story.includes('phk') ||
    story.includes('kehilangan pekerjaan') ||
    story.includes('kontrak habis') ||
    story.includes('resign') ||
    story.includes('pindah kerja');
  if (mentionsJobLoss) detectedKeywords.push('keamanan kerja');

  // Big-ticket purchase intent (gadgets, electronics, etc.)
  const mentionsPurchase =
    story.includes('beli') ||
    story.includes('membeli') ||
    story.includes('buat beli') ||
    story.includes('mau beli') ||
    story.includes('ingin beli') ||
    story.includes('pengen beli') ||
    story.includes('rencana beli');

  // Check for specific purchase items
  const purchaseKeywords = [
    'iphone', 'hp', 'handphone', 'smartphone', 'ponsel',
    'laptop', 'macbook', 'notebook', 'komputer', 'pc',
    'motor', 'mobil', 'kendaraan',
    'kamera', 'drone', 'gadget',
    'tv', 'televisi', 'elektronik',
    'jam', 'watch', 'tas', 'sepatu'
  ];
  const mentionsPurchaseItem = purchaseKeywords.some(keyword => story.includes(keyword));

  if (mentionsPurchase && mentionsPurchaseItem) {
    detectedKeywords.push('pembelian barang');
  }

  // Extract lifestyle upgrade with amount
  let lifestyleUpgrade: LifestyleUpgradeIntent | undefined;

  // Try to extract amount from narrative (e.g., "2 juta", "Rp 2.000.000")
  const extractedAmount = extractAmountFromNarrative(story);

  if (mentionsRentalUpgrade) {
    lifestyleUpgrade = {
      type: 'rental_upgrade',
      description: 'Ingin pindah ke kontrakan/kos dengan harga lebih tinggi',
      extractedAmount,
    };
  } else if (mentionsHomePurchase) {
    lifestyleUpgrade = {
      type: 'home_purchase',
      description: 'Ingin membeli rumah',
      extractedAmount,
    };
  } else if (mentionsPurchase && mentionsPurchaseItem && extractedAmount) {
    // Extract what they want to buy from the story
    const itemMatch = purchaseKeywords.find(k => story.includes(k));
    lifestyleUpgrade = {
      type: 'purchase',
      description: `Ingin membeli ${itemMatch || 'barang'}`,
      extractedAmount,
    };
  }

  return {
    mentionsInsurance,
    mentionsMarriage,
    mentionsConfusion,
    mentionsInvestment,
    mentionsDebt,
    mentionsEmergency,
    mentionsHousing,
    mentionsRentalUpgrade,
    mentionsHomePurchase,
    mentionsEducation,
    mentionsRetirement,
    mentionsChildren,
    mentionsSideIncome,
    mentionsJobLoss,
    lifestyleUpgrade,
    rawKeywords: detectedKeywords,
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract numeric amount from narrative text
 * Handles formats: "2 juta", "Rp 2.000.000", "2jt", "2000000"
 */
const extractAmountFromNarrative = (story: string): number | undefined => {
  // Pattern: X juta / X jt
  const jutaMatch = story.match(/(\d+(?:[.,]\d+)?)\s*(juta|jt)/i);
  if (jutaMatch) {
    const num = parseFloat(jutaMatch[1].replace(',', '.'));
    return num * 1000000;
  }

  // Pattern: X ribu
  const ribuMatch = story.match(/(\d+(?:[.,]\d+)?)\s*ribu/i);
  if (ribuMatch) {
    const num = parseFloat(ribuMatch[1].replace(',', '.'));
    return num * 1000;
  }

  // Pattern: Rp X.XXX.XXX or Rp X
  const rpMatch = story.match(/rp\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?)/i);
  if (rpMatch) {
    const cleaned = rpMatch[1].replace(/[.,]/g, '');
    return parseInt(cleaned, 10);
  }

  return undefined;
};

/**
 * Analyze feasibility of a lifestyle upgrade based on financial data
 */
export const analyzeLifestyleUpgradeFeasibility = (
  data: UserFinancialData,
  upgrade: LifestyleUpgradeIntent
): LifestyleUpgradeFeasibility => {
  const monthlyIncome = calculateMonthlyIncome(data);
  const currentExpenses = calculateMonthlyExpenses(data);
  const currentSurplus = monthlyIncome - currentExpenses;

  // Get current expense for this category
  let currentCategoryExpense = 0;
  if (upgrade.type === 'rental_upgrade') {
    currentCategoryExpense = data.expenses.tempatTinggal?.biayaSewa || 0;
  }

  const purchaseAmount = upgrade.extractedAmount || 0;

  // For one-time purchases, calculate months needed to save
  if (upgrade.type === 'purchase') {
    const monthsToSave = currentSurplus > 0 ? Math.ceil(purchaseAmount / currentSurplus) : Infinity;
    const canAfford = currentSurplus > 0 && monthsToSave <= 24; // Max 2 years to save

    let status: FeasibilityStatus;
    let message: string;
    const alternatives: string[] = [];

    if (currentSurplus <= 0) {
      status = 'NOT_FEASIBLE';
      message = `Tidak bisa menabung untuk pembelian ini karena cashflow negatif.`;
      alternatives.push('Perbaiki cashflow terlebih dahulu');
      alternatives.push('Kurangi pengeluaran bulanan');
    } else if (monthsToSave <= 3) {
      status = 'FEASIBLE';
      message = `Layak! Dengan surplus ${formatCurrency(currentSurplus)}/bulan, target tercapai dalam ${monthsToSave} bulan.`;
    } else if (monthsToSave <= 12) {
      status = 'MARGINAL';
      message = `Memungkinkan dalam ${monthsToSave} bulan dengan menabung ${formatCurrency(Math.ceil(purchaseAmount / monthsToSave))}/bulan.`;
      alternatives.push('Pertimbangkan versi lebih terjangkau');
      alternatives.push('Cari promo/diskon untuk mempercepat');
    } else if (monthsToSave <= 24) {
      status = 'MARGINAL';
      message = `Butuh ${monthsToSave} bulan menabung. Pertimbangkan untuk menunda atau cari alternatif.`;
      alternatives.push('Pertimbangkan barang bekas/refurbished');
      alternatives.push('Tunggu promo besar seperti 11.11 atau 12.12');
    } else {
      status = 'NOT_FEASIBLE';
      message = `Butuh ${monthsToSave > 100 ? '> 100' : monthsToSave} bulan menabung. Tidak realistis dengan kondisi saat ini.`;
      alternatives.push('Cari alternatif dengan harga lebih rendah');
      alternatives.push('Tingkatkan pendapatan terlebih dahulu');
    }

    return {
      status,
      message,
      currentSurplus,
      surplusAfterUpgrade: currentSurplus, // Purchase doesn't change monthly surplus
      savingsRatioAfterUpgrade: monthlyIncome > 0 ? (currentSurplus / monthlyIncome) * 100 : 0,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    };
  }

  // For recurring expenses (rental upgrade, etc.)
  const additionalCost = purchaseAmount > currentCategoryExpense
    ? purchaseAmount - currentCategoryExpense
    : 0;

  // Calculate new situation
  const newSurplus = currentSurplus - additionalCost;
  const savingsRatioAfterUpgrade = monthlyIncome > 0 ? (newSurplus / monthlyIncome) * 100 : 0;

  // Determine feasibility
  let status: FeasibilityStatus;
  let message: string;
  const alternatives: string[] = [];

  if (newSurplus <= 0) {
    status = 'NOT_FEASIBLE';
    message = `Upgrade ini akan membuat pengeluaran melebihi pendapatan (surplus menjadi ${formatCurrency(newSurplus)}).`;
    alternatives.push('Cari pilihan yang lebih terjangkau');
    alternatives.push('Tingkatkan pendapatan terlebih dahulu');
    alternatives.push('Kurangi pengeluaran di kategori lain');
  } else if (savingsRatioAfterUpgrade < 10) {
    status = 'NOT_FEASIBLE';
    message = `Upgrade ini akan mengurangi kemampuan menabung hingga ${savingsRatioAfterUpgrade.toFixed(1)}% (minimal 10%).`;
    alternatives.push('Cari pilihan dengan harga 20-30% lebih murah');
    alternatives.push('Tunda upgrade hingga pendapatan naik');
  } else if (savingsRatioAfterUpgrade < 20) {
    status = 'MARGINAL';
    message = `Upgrade ini memungkinkan tapi mengurangi tabungan ke ${savingsRatioAfterUpgrade.toFixed(1)}% dari ideal 20%.`;
    alternatives.push('Pertimbangkan opsi yang sedikit lebih murah');
  } else {
    status = 'FEASIBLE';
    message = `Upgrade ini layak! Surplus masih ${formatCurrency(newSurplus)}/bulan dengan rasio tabungan ${savingsRatioAfterUpgrade.toFixed(1)}%.`;
  }

  return {
    status,
    message,
    currentSurplus,
    surplusAfterUpgrade: newSurplus,
    savingsRatioAfterUpgrade,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
  };
};

const getUMR = (): number => 5000000; // Jakarta 2024 UMR

const calculateDSR = (data: UserFinancialData): number => {
  const income = calculateMonthlyIncome(data);
  const debtPayments = calculateTotalMonthlyDebtPayments(data);
  return income > 0 ? (debtPayments / income) * 100 : 0;
};

const calculateExpenseRatio = (data: UserFinancialData): number => {
  const income = calculateMonthlyIncome(data);
  const expenses = calculateMonthlyExpenses(data) - calculateTotalMonthlyDebtPayments(data);
  return income > 0 ? (expenses / income) * 100 : 0;
};

const calculateSavingsRatio = (data: UserFinancialData): number => {
  const income = calculateMonthlyIncome(data);
  const surplus = calculateMonthlySurplus(data);
  return income > 0 ? Math.max(0, (surplus / income) * 100) : 0;
};

// ============================================
// STEP 1: FINANCIAL DIAGNOSIS
// ============================================

export const diagnoseFinancialCondition = (
  data: UserFinancialData,
  intents?: NarrativeIntents
): FinancialDiagnosis => {
  const weaknesses: DiagnosisItem[] = [];
  const hiddenRisks: DiagnosisItem[] = [];
  const falseSecurities: DiagnosisItem[] = [];

  // --- NARRATIVE-BASED DIAGNOSIS (inject first for visibility) ---
  if (intents && intents.rawKeywords.length > 0) {
    // User expressed insurance confusion
    if (intents.mentionsInsurance && intents.mentionsConfusion) {
      hiddenRisks.push({
        issue: 'Kebutuhan Proteksi Belum Terstruktur',
        severity: 'moderat',
        impact: 'Anda secara eksplisit menyampaikan kebingungan terkait kebutuhan asuransi. Ini menunjukkan adanya kebutuhan proteksi finansial yang belum sepenuhnya terstruktur.',
        evidence: 'Disampaikan dalam cerita keuangan Anda',
      });
    }

    // User worried about job loss
    if (intents.mentionsJobLoss) {
      hiddenRisks.push({
        issue: 'Kekhawatiran Keamanan Pekerjaan',
        severity: 'serius',
        impact: 'Anda menyebutkan kekhawatiran terkait stabilitas pekerjaan. Ini memerlukan prioritas pada dana darurat dan diversifikasi penghasilan.',
        evidence: 'Disampaikan dalam cerita keuangan Anda',
      });
    }

    // User planning major life event (marriage)
    if (intents.mentionsMarriage) {
      weaknesses.push({
        issue: 'Persiapan Dana Pernikahan',
        severity: 'moderat',
        impact: 'Anda menyebutkan rencana pernikahan. Biaya pernikahan di Indonesia rata-rata Rp50-200 juta tergantung skala. Perlu perencanaan khusus.',
        evidence: 'Disampaikan dalam cerita keuangan Anda',
      });
    }

    // User mentioned housing goal
    if (intents.mentionsHousing && intents.mentionsConfusion) {
      weaknesses.push({
        issue: 'Strategi Kepemilikan Rumah Belum Jelas',
        severity: 'moderat',
        impact: 'Anda menyebutkan ketertarikan pada rumah/properti tapi masih bingung. Perlu analisis kemampuan KPR dan strategi DP.',
        evidence: 'Disampaikan dalam cerita keuangan Anda',
      });
    }

    // User confused about investments
    if (intents.mentionsInvestment && intents.mentionsConfusion) {
      falseSecurities.push({
        issue: 'Kebingungan Pilihan Investasi',
        severity: 'ringan',
        impact: 'Anda menyebutkan ketertarikan pada investasi tapi masih ragu. Tanpa kejelasan, ada risiko memilih instrumen yang tidak sesuai profil risiko.',
        evidence: 'Disampaikan dalam cerita keuangan Anda',
      });
    }

    // User concerned about children's education
    if (intents.mentionsEducation && intents.mentionsChildren) {
      hiddenRisks.push({
        issue: 'Biaya Pendidikan Anak Perlu Direncanakan',
        severity: 'moderat',
        impact: 'Biaya pendidikan naik 10-15%/tahun. Tanpa perencanaan, dana bisa tidak mencukupi saat dibutuhkan.',
        evidence: 'Disampaikan dalam cerita keuangan Anda',
      });
    }

    // User mentioned debt concerns
    if (intents.mentionsDebt) {
      weaknesses.push({
        issue: 'Kekhawatiran Terkait Hutang',
        severity: 'serius',
        impact: 'Anda menyebutkan masalah hutang dalam cerita keuangan Anda. Hutang yang tidak terkelola dapat menggerus kekayaan dan membatasi kemampuan finansial jangka panjang.',
        evidence: 'Disampaikan dalam cerita keuangan Anda',
      });
    }

    // User has business/side income concerns
    if (intents.mentionsSideIncome) {
      hiddenRisks.push({
        issue: 'Bisnis/Usaha Sampingan Perlu Evaluasi',
        severity: 'moderat',
        impact: 'Anda menyebutkan memiliki bisnis atau usaha sampingan. Bisnis membutuhkan modal kerja, cadangan kas, dan pemisahan keuangan pribadi-bisnis yang jelas.',
        evidence: 'Disampaikan dalam cerita keuangan Anda',
      });
    }
  }

  const monthlyIncome = calculateMonthlyIncome(data);
  const monthlyExpenses = calculateMonthlyExpenses(data);
  const surplus = calculateMonthlySurplus(data);
  const dsr = calculateDSR(data);
  const expenseRatio = calculateExpenseRatio(data);
  const savingsRatio = calculateSavingsRatio(data);
  const emergencyNeeded = calculateEmergencyFundNeeded(data);
  const emergencyCurrent = calculateEmergencyFundCurrent(data);
  const emergencyCoverage = emergencyNeeded > 0 ? (emergencyCurrent / emergencyNeeded) * 100 : 0;
  const totalAssets = calculateTotalAssets(data);
  const totalLiabilities = calculateTotalLiabilities(data);
  const netWorth = totalAssets - totalLiabilities;
  const liquidAssets = calculateLiquidAssets(data);

  // --- WEAKNESSES ---

  // 1. Negative Cashflow
  if (surplus < 0) {
    weaknesses.push({
      issue: 'Cashflow Negatif',
      severity: 'kritis',
      impact: `Anda kehilangan ${formatCurrency(Math.abs(surplus))}/bulan. Dalam 12 bulan, potensi kerugian ${formatCurrency(Math.abs(surplus) * 12)}.`,
      evidence: `Pendapatan ${formatCurrency(monthlyIncome)} < Pengeluaran ${formatCurrency(monthlyExpenses)}`,
    });
  }

  // 2. Critical Emergency Fund
  if (emergencyCoverage < 25) {
    weaknesses.push({
      issue: 'Dana Darurat Hampir Tidak Ada',
      severity: 'kritis',
      impact: 'Jika terjadi PHK atau sakit, Anda tidak memiliki buffer finansial. Risiko terlilit hutang sangat tinggi.',
      evidence: `Dana darurat hanya ${emergencyCoverage.toFixed(0)}% dari kebutuhan (${formatCurrency(emergencyCurrent)} dari ${formatCurrency(emergencyNeeded)})`,
    });
  } else if (emergencyCoverage < 50) {
    weaknesses.push({
      issue: 'Dana Darurat Kurang Memadai',
      severity: 'serius',
      impact: 'Buffer finansial hanya bertahan maksimal 2-3 bulan dalam kondisi darurat.',
      evidence: `Dana darurat ${emergencyCoverage.toFixed(0)}% dari kebutuhan`,
    });
  }

  // 3. High Debt Service Ratio
  if (dsr > 50) {
    weaknesses.push({
      issue: 'Beban Hutang Sangat Tinggi',
      severity: 'kritis',
      impact: 'Lebih dari separuh pendapatan habis untuk cicilan. Tidak ada ruang untuk menabung atau investasi.',
      evidence: `DSR ${dsr.toFixed(1)}% (standar sehat: <30%)`,
    });
  } else if (dsr > 35) {
    weaknesses.push({
      issue: 'Beban Hutang Di Atas Normal',
      severity: 'serius',
      impact: 'Ruang gerak finansial terbatas. Sulit menghadapi kenaikan suku bunga atau penurunan pendapatan.',
      evidence: `DSR ${dsr.toFixed(1)}% (standar sehat: <30%)`,
    });
  }

  // 4. High Expense Ratio
  if (expenseRatio > 80) {
    weaknesses.push({
      issue: 'Gaya Hidup Melebihi Kemampuan',
      severity: 'serius',
      impact: 'Tidak ada ruang untuk saving dan investasi. Kekayaan tidak akan bertumbuh.',
      evidence: `Rasio pengeluaran ${expenseRatio.toFixed(1)}% dari pendapatan`,
    });
  }

  // 5. No or Minimal Savings
  if (savingsRatio < 10 && surplus > 0) {
    weaknesses.push({
      issue: 'Rasio Tabungan Terlalu Rendah',
      severity: 'moderat',
      impact: 'Pertumbuhan kekayaan sangat lambat. Target pensiun dan tujuan keuangan sulit tercapai.',
      evidence: `Hanya ${savingsRatio.toFixed(1)}% pendapatan yang bisa ditabung (ideal: 20%+)`,
    });
  }

  // 6. CRITICAL: Negative Net Worth
  if (netWorth < 0) {
    const debtToIncomeRatio = totalLiabilities / (monthlyIncome * 12);
    weaknesses.push({
      issue: 'Kekayaan Bersih Negatif - Hutang Melebihi Aset',
      severity: 'kritis',
      impact: `Total hutang Anda (${formatCurrency(totalLiabilities)}) melebihi total aset (${formatCurrency(totalAssets)}) sebesar ${formatCurrency(Math.abs(netWorth))}. Ini adalah kondisi krisis finansial yang memerlukan penanganan segera. Prioritas utama adalah pelunasan hutang, BUKAN investasi atau dana darurat.`,
      evidence: `Kekayaan bersih: ${formatCurrency(netWorth)}. Rasio hutang terhadap pendapatan tahunan: ${(debtToIncomeRatio * 100).toFixed(0)}%`,
    });
  }

  // 7. Very High Total Debt (even if net worth is still positive)
  if (totalLiabilities > monthlyIncome * 12 && netWorth >= 0) {
    weaknesses.push({
      issue: 'Total Hutang Sangat Tinggi',
      severity: 'serius',
      impact: `Total hutang ${formatCurrency(totalLiabilities)} setara dengan lebih dari 12 bulan pendapatan. Meskipun aset masih lebih besar, beban hutang ini berisiko tinggi.`,
      evidence: `Hutang = ${(totalLiabilities / monthlyIncome).toFixed(1)}x pendapatan bulanan`,
    });
  }

  // --- HIDDEN RISKS ---

  // 1. No Health Insurance
  if (!data.insurance.bpjs.punya && !data.insurance.kesehatanSwasta.punya) {
    hiddenRisks.push({
      issue: 'Tanpa Proteksi Kesehatan',
      severity: 'kritis',
      impact: 'Satu kali rawat inap bisa menghabiskan seluruh tabungan. Biaya RS swasta Rp1-5 juta/hari.',
      evidence: 'Tidak memiliki BPJS maupun asuransi kesehatan swasta',
    });
  }

  // 2. No Life Insurance with Dependents
  if (data.personalInfo.jumlahTanggungan > 0) {
    const hasLifeInsurance = data.insurance.asuransiLainnya.some(i => i.jenisAsuransi === 'jiwa');
    if (!hasLifeInsurance) {
      const annualIncome = monthlyIncome * 12;
      const recommendedCoverage = annualIncome * 10;
      hiddenRisks.push({
        issue: 'Keluarga Tidak Terproteksi',
        severity: 'kritis',
        impact: `Jika terjadi sesuatu pada Anda, keluarga kehilangan sumber penghasilan ${formatCurrency(annualIncome)}/tahun tanpa pengganti.`,
        evidence: `Memiliki ${data.personalInfo.jumlahTanggungan} tanggungan tanpa asuransi jiwa. Ideal: UP ${formatCurrency(recommendedCoverage)}`,
      });
    }
  }

  // 3. High-Interest Debt
  const highInterestDebts = data.debts.filter(d => d.bungaPerTahun > 20);
  if (highInterestDebts.length > 0) {
    const totalHighInterest = highInterestDebts.reduce((sum, d) => sum + d.totalSisaHutang, 0);
    const annualInterestCost = highInterestDebts.reduce((sum, d) =>
      sum + (d.totalSisaHutang * d.bungaPerTahun / 100), 0);
    hiddenRisks.push({
      issue: 'Hutang Berbunga Tinggi Menggerus Kekayaan',
      severity: 'serius',
      impact: `Anda membayar bunga ${formatCurrency(annualInterestCost)}/tahun untuk hutang ${formatCurrency(totalHighInterest)}. Uang ini seharusnya bisa untuk investasi.`,
      evidence: `${highInterestDebts.length} hutang dengan bunga >20% p.a.`,
    });
  }

  // 4. Income Instability
  if (data.personalInfo.statusPekerjaan === 'freelancer' || data.personalInfo.statusPekerjaan === 'pengusaha') {
    if (emergencyCoverage < 100) {
      hiddenRisks.push({
        issue: 'Pendapatan Tidak Stabil Tanpa Buffer Memadai',
        severity: 'moderat',
        impact: 'Pendapatan fluktuatif membutuhkan dana darurat 9-12 bulan, bukan 3-6 bulan.',
        evidence: `Status: ${data.personalInfo.statusPekerjaan}, dana darurat: ${emergencyCoverage.toFixed(0)}%`,
      });
    }
  }

  // 5. Concentration Risk in Assets
  if (totalAssets > 0) {
    const propertyValue = data.assets.asetRiil.properti + data.assets.asetRiil.kendaraan;
    const propertyRatio = (propertyValue / totalAssets) * 100;
    if (propertyRatio > 80) {
      hiddenRisks.push({
        issue: 'Aset Terlalu Terkonsentrasi di Properti/Kendaraan',
        severity: 'moderat',
        impact: 'Aset tidak likuid. Jika butuh uang cepat, sulit menjual properti dengan harga wajar.',
        evidence: `${propertyRatio.toFixed(0)}% aset dalam bentuk properti/kendaraan`,
      });
    }
  }

  // --- FALSE SECURITIES ---

  // 1. BPJS Only Coverage
  if (data.insurance.bpjs.punya && !data.insurance.kesehatanSwasta.punya && monthlyIncome > getUMR() * 2) {
    falseSecurities.push({
      issue: 'BPJS Saja Tidak Cukup untuk Gaya Hidup Anda',
      severity: 'moderat',
      impact: 'BPJS memiliki batasan: antrian panjang, kelas kamar terbatas, tidak semua RS. Untuk pendapatan Anda, perlu asuransi swasta sebagai top-up.',
      evidence: `Pendapatan ${formatCurrency(monthlyIncome)}/bulan (>${2}x UMR) tapi hanya mengandalkan BPJS`,
    });
  }

  // 2. Unit Link as Investment
  const hasUnitLink = data.insurance.asuransiLainnya.some(i =>
    i.jenisAsuransi === 'jiwa' && (i.namaProduk?.toLowerCase().includes('unit') || i.manfaatUtama?.toLowerCase().includes('unit'))
  );
  if (hasUnitLink) {
    falseSecurities.push({
      issue: 'Unit Link Bukan Investasi yang Efisien',
      severity: 'ringan',
      impact: 'Biaya admin unit link 1-3%/tahun menggerus return. Lebih baik pisahkan: asuransi jiwa murni + investasi reksadana.',
      evidence: 'Memiliki polis unit link',
    });
  }

  // 3. High Savings but No Investment
  const cashRatio = liquidAssets > 0 ? (data.assets.kasLikuid.tabunganBank / liquidAssets) * 100 : 0;
  if (cashRatio > 60 && liquidAssets > emergencyNeeded * 2) {
    falseSecurities.push({
      issue: 'Terlalu Banyak Uang di Tabungan',
      severity: 'moderat',
      impact: 'Uang di tabungan menghasilkan 2-3%/tahun, kalah dari inflasi 4-5%. Kekayaan riil menyusut.',
      evidence: `${cashRatio.toFixed(0)}% aset likuid di tabungan bank biasa`,
    });
  }

  // Calculate overall health grade based on issue severity counts
  // This is more accurate than a simple score - critical issues must impact the grade
  const criticalCount = weaknesses.filter(w => w.severity === 'kritis').length +
    hiddenRisks.filter(r => r.severity === 'kritis').length;
  const seriousCount = weaknesses.filter(w => w.severity === 'serius').length +
    hiddenRisks.filter(r => r.severity === 'serius').length;

  let overallHealthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (criticalCount >= 2) overallHealthGrade = 'F';
  else if (criticalCount >= 1) overallHealthGrade = 'D';
  else if (seriousCount >= 2) overallHealthGrade = 'C';
  else if (seriousCount >= 1 || falseSecurities.length >= 2) overallHealthGrade = 'B';
  else overallHealthGrade = 'A';

  return {
    weaknesses,
    hiddenRisks,
    falseSecurities,
    overallHealthGrade,
  };
};

// ============================================
// STEP 2: PRIORITY CLASSIFICATION
// ============================================

export const classifyPriorityIssues = (data: UserFinancialData, diagnosis: FinancialDiagnosis): PriorityIssue[] => {
  const issues: PriorityIssue[] = [];
  let rank = 1;

  const monthlyIncome = calculateMonthlyIncome(data);
  const surplus = calculateMonthlySurplus(data);
  const emergencyNeeded = calculateEmergencyFundNeeded(data);
  const emergencyCurrent = calculateEmergencyFundCurrent(data);
  const emergencyGap = emergencyNeeded - emergencyCurrent;
  const hasDependents = data.personalInfo.jumlahTanggungan > 0;
  const isMarried = data.personalInfo.statusPernikahan === 'menikah';

  // Helper: Generate justification based on issue type and user context
  const generateJustification = (issueType: string): string => {
    const dependentContext = hasDependents
      ? `${data.personalInfo.jumlahTanggungan} tanggungan yang bergantung pada penghasilan Anda`
      : isMarried ? 'pasangan Anda' : 'diri Anda sendiri';

    if (issueType.includes('Keluarga') || issueType.includes('Terproteksi')) {
      return `Karena seluruh pendapatan keluarga bergantung pada Anda (${dependentContext}), jika terjadi risiko kesehatan atau kematian, keluarga akan kehilangan sumber penghasilan ${formatCurrency(monthlyIncome)}/bulan tanpa perlindungan pengganti.`;
    }
    if (issueType.includes('Dana Darurat')) {
      return `Karena dana darurat Anda baru ${formatCurrency(emergencyCurrent)} dari kebutuhan ${formatCurrency(emergencyNeeded)}, jika terjadi kehilangan pekerjaan atau emergency medis, Anda tidak memiliki buffer finansial yang memadai.`;
    }
    if (issueType.includes('Cashflow') || issueType.includes('Negatif')) {
      return `Karena pengeluaran melebihi pendapatan sebesar ${formatCurrency(Math.abs(surplus))}/bulan, kondisi ini akan menggerus tabungan dan berpotensi menambah hutang jika tidak segera diperbaiki.`;
    }
    if (issueType.includes('Hutang') || issueType.includes('DSR')) {
      const totalDebt = calculateTotalLiabilities(data);
      return `Karena total kewajiban hutang Anda ${formatCurrency(totalDebt)} dengan cicilan yang signifikan, ini membatasi fleksibilitas keuangan dan menunda pencapaian tujuan finansial lainnya.`;
    }
    if (issueType.includes('Kesehatan')) {
      return `Karena biaya rawat inap rumah sakit bisa mencapai puluhan juta rupiah, tanpa proteksi kesehatan yang memadai, satu kejadian medis bisa menguras seluruh tabungan Anda.`;
    }
    return `Karena kondisi ini memiliki dampak langsung pada stabilitas keuangan Anda, penanganan segera diperlukan untuk menghindari konsekuensi finansial yang lebih besar.`;
  };

  // Helper: Generate short explanation for Fokus Utama section
  const generateShortExplanation = (issueType: string): string => {
    if (issueType.includes('Keluarga') || issueType.includes('Terproteksi')) {
      return 'Seluruh pendapatan keluarga bergantung pada Anda tanpa perlindungan pengganti penghasilan.';
    }
    if (issueType.includes('Dana Darurat')) {
      return 'Tidak ada buffer finansial untuk menghadapi situasi darurat atau kehilangan pekerjaan.';
    }
    if (issueType.includes('Cashflow') || issueType.includes('Negatif')) {
      return 'Pengeluaran melebihi pendapatan, kondisi ini tidak berkelanjutan.';
    }
    if (issueType.includes('Hutang') || issueType.includes('DSR')) {
      return 'Cicilan yang tidak terkontrol berpotensi membatasi fleksibilitas keuangan ke depan.';
    }
    if (issueType.includes('Kesehatan')) {
      return 'Proteksi kesehatan belum memadai untuk menanggung biaya rumah sakit.';
    }
    if (issueType.includes('Proteksi') || issueType.includes('Asuransi')) {
      return 'Gap proteksi perlu ditutup untuk melindungi aset dan penghasilan.';
    }
    if (issueType.includes('Tujuan') || issueType.includes('Dana')) {
      return 'Beberapa tujuan besar belum memiliki rencana pendanaan yang jelas.';
    }
    if (issueType.includes('Investasi')) {
      return 'Alokasi investasi belum optimal untuk pertumbuhan kekayaan jangka panjang.';
    }
    return 'Perlu perhatian untuk menjaga stabilitas keuangan Anda.';
  };

  // CRITICAL issues (must act now)
  diagnosis.weaknesses
    .filter(w => w.severity === 'kritis')
    .forEach(w => {
      let financialImpact = 0;
      if (w.issue === 'Cashflow Negatif') {
        financialImpact = Math.abs(surplus) * 12;
      } else if (w.issue.includes('Dana Darurat')) {
        financialImpact = emergencyGap;
      } else if (w.issue.includes('Hutang')) {
        financialImpact = calculateTotalLiabilities(data);
      }

      issues.push({
        rank: rank++,
        classification: 'KRITIS',
        issue: w.issue,
        urgency: 'Harus ditangani dalam 30 hari',
        financialImpact,
        deadline: '30 hari',
        shortExplanation: generateShortExplanation(w.issue),
        justification: generateJustification(w.issue),
      });
    });

  diagnosis.hiddenRisks
    .filter(r => r.severity === 'kritis')
    .forEach(r => {
      let financialImpact = 0;
      if (r.issue.includes('Kesehatan')) {
        financialImpact = 100000000; // Estimated hospital cost
      } else if (r.issue.includes('Keluarga')) {
        financialImpact = monthlyIncome * 12 * 10; // 10 years income
      }

      issues.push({
        rank: rank++,
        classification: 'KRITIS',
        issue: r.issue,
        urgency: 'Harus ditangani dalam 30 hari',
        financialImpact,
        deadline: '30 hari',
        shortExplanation: generateShortExplanation(r.issue),
        justification: generateJustification(r.issue),
      });
    });

  // IMPORTANT issues (next 3-6 months)
  [...diagnosis.weaknesses, ...diagnosis.hiddenRisks]
    .filter(item => item.severity === 'serius')
    .forEach(item => {
      issues.push({
        rank: rank++,
        classification: 'PENTING',
        issue: item.issue,
        urgency: 'Selesaikan dalam 3-6 bulan',
        financialImpact: monthlyIncome * 3,
        deadline: '3-6 bulan',
        shortExplanation: generateShortExplanation(item.issue),
      });
    });

  // OPTIMIZATION (after stability)
  [...diagnosis.weaknesses, ...diagnosis.hiddenRisks, ...diagnosis.falseSecurities]
    .filter(item => item.severity === 'moderat' || item.severity === 'ringan')
    .forEach(item => {
      issues.push({
        rank: rank++,
        classification: 'OPTIMISASI',
        issue: item.issue,
        urgency: 'Optimasi setelah fondasi stabil',
        financialImpact: monthlyIncome,
        deadline: '6-12 bulan',
        shortExplanation: generateShortExplanation(item.issue),
      });
    });

  return issues;
};

// ============================================
// STEP 3: STRATEGY DESIGN
// ============================================

export const designStrategies = (
  data: UserFinancialData,
  priorityIssues: PriorityIssue[],
  intents?: NarrativeIntents
): RecommendedStrategy[] => {
  const strategies: RecommendedStrategy[] = [];
  let priority = 1;

  const monthlyIncome = calculateMonthlyIncome(data);
  const monthlyExpenses = calculateMonthlyExpenses(data);
  const surplus = calculateMonthlySurplus(data);
  const emergencyNeeded = calculateEmergencyFundNeeded(data);
  const emergencyCurrent = calculateEmergencyFundCurrent(data);
  const emergencyGap = emergencyNeeded - emergencyCurrent;
  const totalDebt = calculateTotalLiabilities(data);
  const totalAssets = calculateTotalAssets(data);
  const netWorth = totalAssets - totalDebt;
  const monthlyDebtPayments = calculateTotalMonthlyDebtPayments(data);

  // Get unified allocation values for consistency with Dashboard
  const unifiedAllocation = calculateRecommendedAllocationValues(data);

  // =====================================================
  // DEBT CRISIS STRATEGIES (HIGHEST PRIORITY)
  // =====================================================
  const isDebtCrisis = netWorth < 0 || totalDebt > monthlyIncome * 6;

  if (isDebtCrisis && totalDebt > 0) {
    // Calculate key debt metrics
    const deficitAmount = surplus < 0 ? Math.abs(surplus) : 0;
    const currentDebtRatio = (monthlyDebtPayments / monthlyIncome) * 100;
    const yearsToPayoff = monthlyDebtPayments > 0 ? totalDebt / (monthlyDebtPayments * 12) : 0;

    // Calculate ideal additional payment to accelerate payoff
    // Target: reduce payoff time by 30-50%
    const idealAdditionalPayment = Math.max(
      deficitAmount, // At minimum, cover the deficit
      monthlyDebtPayments * 0.5, // Or 50% extra on current payments
      totalDebt / (monthlyIncome * 12) > 1 ? monthlyIncome * 0.1 : 0 // Or 10% income if high debt
    );

    // Strategy 1: Debt Repayment Acceleration
    strategies.push({
      priority: priority++,
      strategyName: 'Akselerasi Pelunasan Hutang',
      objective: netWorth < 0
        ? `Mengatasi kondisi kekayaan bersih negatif (${formatCurrency(netWorth)}) dengan memprioritaskan pelunasan hutang`
        : `Mengurangi beban hutang yang sangat tinggi (${formatCurrency(totalDebt)})`,
      targetAmount: idealAdditionalPayment,
      targetPercentage: Math.round((idealAdditionalPayment / monthlyIncome) * 100),
      timeframe: 'Segera dimulai',
      specificActions: [
        `⚠️ KONDISI KRITIS: ${netWorth < 0 ? 'Kekayaan bersih negatif' : 'Total hutang sangat tinggi'}`,
        `Total hutang: ${formatCurrency(totalDebt)} | Cicilan saat ini: ${formatCurrency(monthlyDebtPayments)}/bulan`,
        `DSR (Debt Service Ratio): ${currentDebtRatio.toFixed(1)}% dari pendapatan`,
        surplus < 0
          ? `❌ DEFISIT ${formatCurrency(Math.abs(surplus))}/bulan - perlu tambahan penghasilan atau pangkas pengeluaran`
          : `✅ Surplus ${formatCurrency(surplus)}/bulan - bisa dialokasikan untuk cicilan tambahan`,
        `Target pembayaran tambahan: ${formatCurrency(idealAdditionalPayment)}/bulan untuk percepatan pelunasan`,
        'Gunakan metode Avalanche: lunasi hutang dengan bunga tertinggi terlebih dahulu (Kartu Kredit → PayLater → Pinjol → KTA)',
        'Hubungi bank/fintech untuk restrukturisasi jika cicilan melebihi 50% pendapatan',
      ],
      tradeoffs: [
        'Fokus pelunasan hutang berarti menunda investasi dan tujuan keuangan lainnya',
        'Dana darurat dijaga minimal (1-2 bulan) sampai hutang terkendali',
        'Gaya hidup perlu dikurangi signifikan selama masa pelunasan',
      ],
      expectedOutcome: netWorth < 0
        ? 'Kekayaan bersih menjadi positif dan terbebas dari jebakan hutang'
        : `Hutang turun ke level sehat (maksimal 3x pendapatan bulanan)`,
    });

    // Strategy 2: Additional Income (if deficit or high debt)
    if (surplus < 0 || totalDebt > monthlyIncome * 12) {
      const minimumAdditionalIncome = surplus < 0
        ? Math.abs(surplus) + idealAdditionalPayment
        : idealAdditionalPayment;

      strategies.push({
        priority: priority++,
        strategyName: 'Mencari Penghasilan Tambahan',
        objective: surplus < 0
          ? `Menutup defisit ${formatCurrency(Math.abs(surplus))}/bulan dan mempercepat pelunasan hutang`
          : `Mempercepat pelunasan hutang ${formatCurrency(totalDebt)} yang sangat tinggi`,
        targetAmount: minimumAdditionalIncome,
        timeframe: '1-2 bulan ke depan',
        specificActions: [
          `🎯 TARGET: Tambahan penghasilan minimal ${formatCurrency(minimumAdditionalIncome)}/bulan`,
          'Opsi penghasilan tambahan yang bisa dieksekusi segera:',
          '• Freelance di bidang keahlian Anda (desain, programming, penulisan, dll)',
          '• Part-time weekend (F&B, retail, driver online)',
          '• Jual barang tidak terpakai di marketplace',
          '• Monetisasi hobi (fotografi, crafting, les privat)',
          '• Jika punya kendaraan: pertimbangkan rental atau ride-sharing',
          surplus < 0
            ? `Penghasilan tambahan ini akan menutup defisit dan tersisa ${formatCurrency(minimumAdditionalIncome - Math.abs(surplus))} untuk cicilan ekstra`
            : `Seluruh penghasilan tambahan dialokasikan 100% untuk pelunasan hutang`,
        ],
        tradeoffs: [
          'Membutuhkan waktu dan energi ekstra di luar pekerjaan utama',
          'Perlu keseimbangan agar tidak burnout',
          'Penghasilan tambahan mungkin tidak stabil di awal',
        ],
        expectedOutcome: `Dengan tambahan ${formatCurrency(minimumAdditionalIncome)}/bulan, estimasi pelunasan hutang bisa dipercepat 30-50%`,
      });
    }

    // Strategy 3: Expense Reduction
    if (surplus < 0 || monthlyExpenses > monthlyIncome * 0.8) {
      const targetExpenseReduction = surplus < 0
        ? Math.abs(surplus) * 0.5 // Cover 50% of deficit through expense cuts
        : monthlyExpenses * 0.15; // Or cut 15% of expenses

      strategies.push({
        priority: priority++,
        strategyName: 'Pemangkasan Pengeluaran Darurat',
        objective: `Mengurangi pengeluaran ${formatCurrency(targetExpenseReduction)}/bulan untuk dialokasikan ke pelunasan hutang`,
        targetAmount: targetExpenseReduction,
        timeframe: 'Mulai bulan ini',
        specificActions: [
          `Pengeluaran saat ini: ${formatCurrency(monthlyExpenses)}/bulan (${((monthlyExpenses / monthlyIncome) * 100).toFixed(0)}% dari pendapatan)`,
          'Area yang bisa dipangkas:',
          '• Langganan streaming/subscription yang tidak esensial',
          '• Makan di luar → masak sendiri lebih hemat 50-70%',
          '• Transportasi → gunakan transportasi umum jika memungkinkan',
          '• Gaya hidup → tunda pembelian barang non-esensial',
          '• Biaya hiburan → cari alternatif gratis/murah',
          `Target: pangkas ${formatCurrency(targetExpenseReduction)}/bulan dan dialokasikan langsung ke cicilan hutang`,
        ],
        tradeoffs: [
          'Kualitas hidup sementara menurun selama fase pelunasan',
          'Butuh disiplin tinggi menahan keinginan belanja',
          'Ini bersifat sementara sampai hutang terkendali',
        ],
        expectedOutcome: `Pengeluaran turun ${formatCurrency(targetExpenseReduction)}/bulan, mempercepat pelunasan hutang`,
      });
    }

    // Strategy 4: Debt Restructuring (if very high DSR)
    if (currentDebtRatio > 50) {
      strategies.push({
        priority: priority++,
        strategyName: 'Negosiasi & Restrukturisasi Hutang',
        objective: `Menurunkan beban cicilan dari ${currentDebtRatio.toFixed(0)}% menjadi maksimal 30% pendapatan`,
        targetAmount: monthlyDebtPayments - (monthlyIncome * 0.3),
        timeframe: '2-4 minggu',
        specificActions: [
          `⚠️ DSR saat ini: ${currentDebtRatio.toFixed(1)}% (standar sehat: <30%)`,
          'Langkah negosiasi dengan kreditur:',
          '1. Hubungi CS bank/fintech, minta opsi restrukturisasi',
          '2. Opsi: perpanjangan tenor (cicilan turun), keringanan bunga, atau grace period',
          '3. Jika ditolak, minta bicara dengan supervisor atau ajukan tertulis',
          '4. Untuk pinjol/kartu kredit: tanyakan program penyelesaian (settlement)',
          'Tips: Siapkan alasan kuat (PHK, sakit, penghasilan turun) + bukti pendapatan',
          'Hindari: mengambil hutang baru untuk menutup hutang lama (gali lubang tutup lubang)',
        ],
        tradeoffs: [
          'Proses negosiasi membutuhkan waktu dan kesabaran',
          'Perpanjangan tenor berarti total bunga yang dibayar lebih besar',
          'Mungkin mempengaruhi credit score sementara',
        ],
        expectedOutcome: 'Cicilan bulanan turun sehingga cashflow menjadi positif dan bisa mulai menabung lagi',
      });
    }
  }

  // --- NARRATIVE-BASED STRATEGIES (personalized) ---
  if (intents) {
    // Insurance strategy when user mentions insurance concerns
    if (intents.mentionsInsurance) {
      // Use unified allocation value for consistency with Dashboard
      const recommendedInsurance = unifiedAllocation.insuranceRecommendation;
      const missingProtections: string[] = [];
      if (!unifiedAllocation.hasHealthInsurance) missingProtections.push('Asuransi Kesehatan');
      if (!unifiedAllocation.hasLifeInsurance) missingProtections.push('Asuransi Jiwa');
      if (!unifiedAllocation.hasCriticalIllness) missingProtections.push('Asuransi Penyakit Kritis');

      strategies.push({
        priority: priority++,
        strategyName: 'Optimalisasi Proteksi Asuransi',
        objective: 'Menjawab kebutuhan proteksi yang Anda sampaikan dengan struktur asuransi yang tepat',
        targetAmount: recommendedInsurance, // Monthly premium increase (consistent with Dashboard)
        targetPercentage: 10,
        timeframe: '30-60 hari',
        specificActions: [
          missingProtections.length > 0
            ? `⚠️ Proteksi yang belum dimiliki: ${missingProtections.join(', ')}`
            : '✓ Proteksi dasar sudah lengkap',
          recommendedInsurance > 0
            ? `Rekomendasi tambahan premi: ${formatCurrency(recommendedInsurance)}/bulan`
            : 'Budget asuransi sudah optimal',
          'Pertahankan BPJS Kesehatan sebagai proteksi dasar (wajib)',
          'Evaluasi asuransi kesehatan swasta dengan sistem cashless untuk RS pilihan',
          'Pertimbangkan asuransi jiwa berjangka (term life) jika memiliki tanggungan',
          'Hindari unit link, pilih asuransi murni yang lebih cost-effective',
        ],
        tradeoffs: [
          'Premi asuransi adalah biaya tetap yang mengurangi alokasi investasi',
          'Asuransi jiwa berjangka tidak ada nilai tunai, tapi premi jauh lebih murah',
        ],
        expectedOutcome: 'Struktur proteksi yang jelas: BPJS + top-up kesehatan + term life sesuai kebutuhan',
      });
    }

    // Marriage planning strategy
    if (intents.mentionsMarriage) {
      // Find goal with kategoriTujuan = 'pernikahan' (new format)
      // OR fallback to keyword matching for backward compatibility (old format)
      const marriageGoal = data.financialGoals.find(g => {
        // New format: check kategoriTujuan
        if (g.kategoriTujuan === 'pernikahan') return true;

        // Old format fallback: check namaTujuan for marriage keywords
        const name = g.namaTujuan?.toLowerCase() || '';
        return (
          name.includes('nikah') ||
          name.includes('menikah') ||
          name.includes('pernikahan') ||
          name.includes('wedding') ||
          name.includes('kawin')
        );
      });

      // Use user's goal data if available
      const weddingBudget = marriageGoal?.targetUang || monthlyIncome * 20;
      const budgetSource = marriageGoal ? 'dari tujuan keuangan Anda' : 'estimasi berdasarkan pendapatan';
      const existingSavings = marriageGoal?.danaTerkumpul || 0;
      const remainingAmount = weddingBudget - existingSavings;
      const userTimeframe = marriageGoal?.jangkaWaktuBulan || 24; // default 2 tahun

      // Calculate required monthly savings
      const requiredMonthly = remainingAmount > 0 ? Math.ceil(remainingAmount / userTimeframe) : 0;

      // Check feasibility against surplus
      const isFeasible = surplus >= requiredMonthly;
      const surplusPercentage = surplus > 0 ? Math.round((requiredMonthly / surplus) * 100) : 0;

      // Recommend instrument based on timeframe
      let recommendedInstrument = '';
      let instrumentReason = '';
      if (userTimeframe <= 12) {
        recommendedInstrument = 'Deposito atau Tabungan Berjangka';
        instrumentReason = 'Timeframe pendek (<1 tahun), prioritaskan keamanan dan likuiditas';
      } else if (userTimeframe <= 24) {
        recommendedInstrument = 'Reksadana Pasar Uang atau Deposito';
        instrumentReason = 'Timeframe 1-2 tahun, balance antara return dan keamanan';
      } else if (userTimeframe <= 36) {
        recommendedInstrument = 'Reksadana Obligasi atau Campuran';
        instrumentReason = 'Timeframe 2-3 tahun, bisa sedikit agresif untuk return lebih baik';
      } else {
        recommendedInstrument = 'Reksadana Saham atau ETF';
        instrumentReason = 'Timeframe panjang (>3 tahun), maksimalkan potensi growth';
      }

      const actions: string[] = [
        `Target dana pernikahan: ${formatCurrency(weddingBudget)} (${budgetSource})`,
        `Timeframe: ${userTimeframe} bulan (${(userTimeframe / 12).toFixed(1)} tahun)`,
        existingSavings > 0
          ? `Dana terkumpul: ${formatCurrency(existingSavings)}, sisa kebutuhan: ${formatCurrency(remainingAmount)}`
          : `Mulai dari nol dengan kebutuhan total ${formatCurrency(remainingAmount)}`,
        ``,
        `💵 SURPLUS TERSEDIA: ${formatCurrency(surplus)}/bulan`,
        `   └─ (Pendapatan - Pengeluaran - Cicilan - Asuransi)`,
        `💰 KEBUTUHAN UNTUK GOAL INI: ${formatCurrency(requiredMonthly)}/bulan`,
        `   └─ (Target ${formatCurrency(remainingAmount)} ÷ ${userTimeframe} bulan)`,
        ``,
        `📊 Instrumen rekomendasi: ${recommendedInstrument}`,
        `   └─ ${instrumentReason}`,
      ];

      // Add feasibility analysis
      if (surplus > 0) {
        if (isFeasible) {
          const allocationPercent = Math.round((requiredMonthly / surplus) * 100);
          actions.push(``);
          actions.push(`✅ FEASIBLE: Alokasikan ${formatCurrency(requiredMonthly)} (${allocationPercent}% dari surplus)`);
          actions.push(`   └─ Sisa surplus untuk tujuan lain: ${formatCurrency(surplus - requiredMonthly)}/bulan`);
        } else {
          const shortfall = requiredMonthly - surplus;
          actions.push(``);
          actions.push(`⚠️ TIDAK FEASIBLE: Kebutuhan melebihi surplus sebesar ${formatCurrency(shortfall)}/bulan`);
          actions.push(`   └─ Opsi 1: Perpanjang timeframe menjadi ${Math.ceil(remainingAmount / surplus)} bulan`);
          actions.push(`   └─ Opsi 2: Kurangi target budget menjadi ${formatCurrency(surplus * userTimeframe)}`);
        }
      } else {
        actions.push(``);
        actions.push(`⚠️ SURPLUS NEGATIF: Perbaiki arus kas terlebih dahulu`);
        actions.push(`   └─ Kurangi pengeluaran atau tingkatkan pendapatan`);
      }

      strategies.push({
        priority: priority++,
        strategyName: 'Perencanaan Dana Pernikahan',
        objective: 'Mempersiapkan dana pernikahan tanpa mengorbankan fondasi keuangan',
        targetAmount: weddingBudget,
        timeframe: `${userTimeframe} bulan`,
        specificActions: actions,
        tradeoffs: [
          isFeasible
            ? `Alokasikan ${surplusPercentage}% surplus untuk dana pernikahan`
            : 'Perlu menyesuaikan timeline atau skala acara dengan kemampuan',
          'Investasi growth mungkin ditunda, fokus ke instrumen aman',
        ],
        expectedOutcome: `Dana ${formatCurrency(weddingBudget)} siap dalam ${userTimeframe} bulan dengan tabungan ${formatCurrency(requiredMonthly)}/bulan`,
      });
    }

    // Rental upgrade strategy (pindah kontrakan/kos)
    if (intents.mentionsRentalUpgrade && intents.lifestyleUpgrade) {
      const upgrade = intents.lifestyleUpgrade;
      const feasibility = analyzeLifestyleUpgradeFeasibility(data, upgrade);
      const currentRent = data.expenses.tempatTinggal?.biayaSewa || 0;
      const newRent = upgrade.extractedAmount || 0;
      const additionalCost = newRent > currentRent ? newRent - currentRent : 0;

      const actions: string[] = [
        `🏠 Keinginan: ${upgrade.description}`,
        newRent > 0
          ? `💰 Target sewa baru: ${formatCurrency(newRent)}/bulan`
          : `💰 Nominal target belum disebutkan dalam cerita`,
        currentRent > 0
          ? `📍 Sewa saat ini: ${formatCurrency(currentRent)}/bulan`
          : `📍 Belum ada data sewa saat ini`,
        additionalCost > 0
          ? `📈 Biaya tambahan: ${formatCurrency(additionalCost)}/bulan`
          : '',
        ``,
        `💵 SURPLUS SAAT INI: ${formatCurrency(feasibility.currentSurplus)}/bulan`,
        `   └─ (Pendapatan - Pengeluaran - Cicilan)`,
        `💵 SURPLUS SETELAH UPGRADE: ${formatCurrency(feasibility.surplusAfterUpgrade)}/bulan`,
        `📊 Rasio tabungan setelah upgrade: ${feasibility.savingsRatioAfterUpgrade.toFixed(1)}%`,
        ``,
      ].filter(a => a !== '');

      // Add feasibility result
      if (feasibility.status === 'FEASIBLE') {
        actions.push(`✅ STATUS: LAYAK`);
        actions.push(`   └─ ${feasibility.message}`);
      } else if (feasibility.status === 'MARGINAL') {
        actions.push(`⚠️ STATUS: MARGINAL (BISA TETAPI PERLU HATI-HATI)`);
        actions.push(`   └─ ${feasibility.message}`);
        if (feasibility.alternatives) {
          feasibility.alternatives.forEach(alt => {
            actions.push(`   └─ Alternatif: ${alt}`);
          });
        }
      } else {
        actions.push(`❌ STATUS: TIDAK LAYAK`);
        actions.push(`   └─ ${feasibility.message}`);
        if (feasibility.alternatives) {
          feasibility.alternatives.forEach(alt => {
            actions.push(`   └─ Saran: ${alt}`);
          });
        }
      }

      strategies.push({
        priority: priority++,
        strategyName: 'Analisis Upgrade Tempat Tinggal',
        objective: 'Menganalisis kelayakan pindah ke kontrakan/kos dengan harga baru',
        targetAmount: newRent,
        timeframe: 'Keputusan segera',
        specificActions: actions,
        tradeoffs:
          feasibility.status === 'FEASIBLE'
            ? ['Upgrade layak dilakukan dengan kondisi keuangan saat ini']
            : feasibility.status === 'MARGINAL'
              ? ['Bisa dilakukan tapi perlu mengurangi pengeluaran di area lain']
              : ['Perlu menunda atau mencari opsi lebih terjangkau'],
        expectedOutcome:
          feasibility.status === 'FEASIBLE'
            ? `Pindah ke tempat baru dengan sewa ${formatCurrency(newRent)}/bulan, surplus tetap sehat`
            : `Perlu adjustment sebelum upgrade tempat tinggal`,
      });
    }

    // Big-ticket purchase analysis strategy (iPhone, laptop, etc.)
    if (intents.lifestyleUpgrade && intents.lifestyleUpgrade.type === 'purchase') {
      const upgrade = intents.lifestyleUpgrade;
      const feasibility = analyzeLifestyleUpgradeFeasibility(data, upgrade);
      const purchaseAmount = upgrade.extractedAmount || 0;
      const monthsToSave = surplus > 0 ? Math.ceil(purchaseAmount / surplus) : Infinity;

      const actions: string[] = [
        `🛒 Keinginan: ${upgrade.description}`,
        purchaseAmount > 0
          ? `💰 Harga target: ${formatCurrency(purchaseAmount)}`
          : `💰 Nominal belum disebutkan dalam cerita`,
        ``,
        `💵 SURPLUS SAAT INI: ${formatCurrency(surplus)}/bulan`,
        `   └─ (Pendapatan - Pengeluaran - Cicilan)`,
        surplus > 0
          ? `📅 WAKTU MENABUNG: ${monthsToSave} bulan untuk mencapai target`
          : `❌ Tidak bisa menabung karena surplus negatif`,
        ``,
      ];

      // Add feasibility result
      if (feasibility.status === 'FEASIBLE') {
        actions.push(`✅ STATUS: LAYAK`);
        actions.push(`   └─ ${feasibility.message}`);
      } else if (feasibility.status === 'MARGINAL') {
        actions.push(`⚠️ STATUS: MEMUNGKINKAN TAPI PERLU WAKTU`);
        actions.push(`   └─ ${feasibility.message}`);
        if (feasibility.alternatives) {
          feasibility.alternatives.forEach(alt => {
            actions.push(`   └─ Saran: ${alt}`);
          });
        }
      } else {
        actions.push(`❌ STATUS: TIDAK LAYAK SAAT INI`);
        actions.push(`   └─ ${feasibility.message}`);
        if (feasibility.alternatives) {
          feasibility.alternatives.forEach(alt => {
            actions.push(`   └─ Saran: ${alt}`);
          });
        }
      }

      strategies.push({
        priority: priority++,
        strategyName: 'Analisis Pembelian Barang',
        objective: `Menganalisis kelayakan pembelian: ${upgrade.description}`,
        targetAmount: purchaseAmount,
        timeframe: monthsToSave <= 12 ? `${monthsToSave} bulan menabung` : 'Perlu perencanaan jangka panjang',
        specificActions: actions,
        tradeoffs:
          feasibility.status === 'FEASIBLE'
            ? ['Pembelian dapat dilakukan dalam waktu singkat tanpa mengorbankan tabungan']
            : feasibility.status === 'MARGINAL'
              ? ['Perlu waktu menabung, pertimbangkan prioritas keuangan lain']
              : ['Tidak realistis dengan kondisi saat ini, perlu meningkatkan pendapatan atau mengurangi target'],
        expectedOutcome:
          feasibility.status === 'FEASIBLE'
            ? `Bisa membeli ${upgrade.description} dalam ${monthsToSave} bulan`
            : `Perlu adjustment ekspektasi atau timeline`,
      });
    }

    // Housing/Home purchase strategy (beli rumah - NOT rental)
    if (intents.mentionsHomePurchase || (intents.mentionsHousing && !intents.mentionsRentalUpgrade)) {
      // Find goal with kategoriTujuan = 'rumah' (new format)
      // OR fallback to keyword matching for backward compatibility (old format)
      const housingGoal = data.financialGoals.find(g => {
        // New format: check kategoriTujuan
        if (g.kategoriTujuan === 'rumah') return true;

        // Old format fallback: check namaTujuan for housing keywords
        const name = g.namaTujuan?.toLowerCase() || '';
        return (
          name.includes('rumah') ||
          name.includes('properti') ||
          name.includes('apartemen') ||
          name.includes('dp') ||
          name.includes('house')
        );
      });

      // Use user's goal or estimate
      const dpTarget = housingGoal?.targetUang || monthlyIncome * 24; // ~2 tahun gaji sebagai DP
      const existingSavings = housingGoal?.danaTerkumpul || 0;
      const remainingAmount = dpTarget - existingSavings;
      const userTimeframe = housingGoal?.jangkaWaktuBulan || 36; // default 3 tahun

      // Calculate required monthly savings
      const requiredMonthly = remainingAmount > 0 ? Math.ceil(remainingAmount / userTimeframe) : 0;

      // Check feasibility against surplus
      const isFeasible = surplus >= requiredMonthly;
      const surplusPercentage = surplus > 0 ? Math.round((requiredMonthly / surplus) * 100) : 0;

      // Estimate property price if DP is 20%
      const estimatedProperty = dpTarget * 5;
      const maxKPR = monthlyIncome * 0.3;

      const actions: string[] = [
        `Target DP: ${formatCurrency(dpTarget)}`,
        `Timeframe: ${userTimeframe} bulan (${(userTimeframe / 12).toFixed(1)} tahun)`,
        existingSavings > 0
          ? `Dana terkumpul: ${formatCurrency(existingSavings)}, sisa: ${formatCurrency(remainingAmount)}`
          : `Mulai dari nol dengan kebutuhan ${formatCurrency(remainingAmount)}`,
        ``,
        `💵 SURPLUS TERSEDIA: ${formatCurrency(surplus)}/bulan`,
        `   └─ (Pendapatan - Pengeluaran - Cicilan - Asuransi)`,
        `💰 KEBUTUHAN UNTUK DP: ${formatCurrency(requiredMonthly)}/bulan`,
        `   └─ (Target ${formatCurrency(remainingAmount)} ÷ ${userTimeframe} bulan)`,
        ``,
        `📊 Instrumen: Reksadana Pasar Uang atau Deposito (aman, likuid)`,
        `🏠 Untuk properti ~${formatCurrency(estimatedProperty)} (DP 20%)`,
        `📋 Max cicilan KPR ideal: ${formatCurrency(maxKPR)}/bulan (30% income)`,
      ];

      if (surplus > 0) {
        if (isFeasible) {
          const allocationPercent = Math.round((requiredMonthly / surplus) * 100);
          actions.push(``);
          actions.push(`✅ FEASIBLE: Alokasikan ${formatCurrency(requiredMonthly)} (${allocationPercent}% dari surplus)`);
          actions.push(`   └─ Sisa surplus untuk tujuan lain: ${formatCurrency(surplus - requiredMonthly)}/bulan`);
        } else {
          const shortfall = requiredMonthly - surplus;
          actions.push(``);
          actions.push(`⚠️ TIDAK FEASIBLE: Kebutuhan melebihi surplus sebesar ${formatCurrency(shortfall)}/bulan`);
          actions.push(`   └─ Opsi 1: Perpanjang timeframe menjadi ${Math.ceil(remainingAmount / surplus)} bulan`);
          actions.push(`   └─ Opsi 2: Cari properti lebih murah atau DP lebih kecil`);
        }
      } else {
        actions.push(``);
        actions.push(`⚠️ SURPLUS NEGATIF: Perbaiki arus kas terlebih dahulu`);
      }

      strategies.push({
        priority: priority++,
        strategyName: 'Strategi Kepemilikan Rumah',
        objective: 'Membangun DP rumah dan mempersiapkan kemampuan KPR',
        targetAmount: dpTarget,
        targetPercentage: 20,
        timeframe: `${userTimeframe} bulan`,
        specificActions: actions,
        tradeoffs: [
          isFeasible
            ? `Alokasikan ${surplusPercentage}% surplus untuk DP rumah`
            : 'Perlu menyesuaikan timeline atau target properti',
          'DP besar = cicilan ringan, DP kecil = bisa lebih cepat tapi cicilan berat',
        ],
        expectedOutcome: `DP ${formatCurrency(dpTarget)} siap dalam ${userTimeframe} bulan dengan tabungan ${formatCurrency(requiredMonthly)}/bulan`,
      });
    }

    // Investment clarity strategy
    if (intents.mentionsInvestment && intents.mentionsConfusion) {
      // Use unified allocation value for consistency with Dashboard
      const monthlyInvestment = unifiedAllocation.investmentContribution;
      strategies.push({
        priority: priority++,
        strategyName: 'Pemilihan Investasi Sesuai Profil',
        objective: 'Memberikan kejelasan pilihan investasi berdasarkan profil risiko dan timeframe Anda',
        targetAmount: monthlyInvestment, // Monthly investment target (consistent with Dashboard)
        timeframe: 'Ongoing',
        specificActions: [
          `Profil risiko Anda: ${data.riskProfile.toleransiRisiko}`,
          `Rekomendasi investasi: ${formatCurrency(monthlyInvestment)}/bulan`,
          data.riskProfile.toleransiRisiko === 'rendah'
            ? 'Fokus: Deposito (40%), Reksadana Pasar Uang (40%), Emas (20%)'
            : data.riskProfile.toleransiRisiko === 'sedang'
              ? 'Fokus: Reksadana Campuran (50%), Saham/Reksadana Saham (30%), Emas (20%)'
              : 'Fokus: Saham/Reksadana Saham (60%), Reksadana Campuran (30%), Crypto (10% maks)',
          'Mulai dengan reksadana untuk diversifikasi otomatis',
          'Hindari trading aktif jika tidak punya waktu belajar',
          'Konsisten: investasi rutin lebih penting dari timing pasar',
        ],
        tradeoffs: [
          'Return tinggi = risiko tinggi, pastikan sesuai tolerance',
          'Crypto sangat volatil, hanya untuk dana yang siap hilang',
        ],
        expectedOutcome: 'Portofolio investasi sesuai profil risiko dan tujuan keuangan',
      });
    }

    // Debt management strategy when user mentions debt concerns
    if (intents.mentionsDebt) {
      const totalDebtPayments = calculateTotalMonthlyDebtPayments(data);
      const totalDebt = calculateTotalLiabilities(data);
      const hasStructuredDebtData = totalDebt > 0;

      strategies.push({
        priority: priority++,
        strategyName: 'Strategi Pengelolaan Hutang',
        objective: 'Mengatasi kekhawatiran hutang yang Anda sampaikan dengan rencana pelunasan yang terstruktur',
        targetAmount: totalDebt, // Will be 0 if not entered in form
        timeframe: '12-36 bulan tergantung jumlah',
        specificActions: [
          !hasStructuredDebtData
            ? '⚠️ Anda menyebut hutang di cerita, tapi data hutang belum diisi di form. Lengkapi data hutang untuk analisis lebih akurat.'
            : `Total hutang tercatat: ${formatCurrency(totalDebt)} dengan cicilan ${formatCurrency(totalDebtPayments)}/bulan`,
          'Buat daftar lengkap semua hutang: jenis, sisa, bunga, dan cicilan bulanan',
          'Prioritaskan pelunasan hutang dengan bunga tertinggi (avalanche method)',
          'Alokasikan minimal 30% surplus untuk percepatan pelunasan hutang',
          'Hindari hutang baru selama proses pelunasan',
          'Jika ada hutang bisnis: pisahkan keuangan pribadi dan bisnis',
        ],
        tradeoffs: [
          'Investasi growth mungkin perlu ditunda hingga hutang berbunga tinggi lunas',
          'Mungkin perlu mengurangi gaya hidup sementara untuk percepatan pelunasan',
        ],
        expectedOutcome: 'Beban hutang berkurang, cashflow membaik, stress finansial berkurang',
      });
    }

    // Business/Side income strategy
    if (intents.mentionsSideIncome) {
      strategies.push({
        priority: priority++,
        strategyName: 'Optimalisasi Bisnis & Penghasilan Tambahan',
        objective: 'Menstabilkan dan mengoptimalkan bisnis yang Anda sampaikan',
        targetAmount: monthlyIncome * 0.2 * 12, // 20% additional income target
        timeframe: '6-12 bulan',
        specificActions: [
          'Pisahkan rekening pribadi dan rekening bisnis (wajib)',
          'Buat laporan keuangan bisnis sederhana: pemasukan, pengeluaran, profit',
          'Siapkan dana cadangan bisnis: minimal 3 bulan biaya operasional',
          'Jika bisnis mengalami defisit: evaluasi apakah perlu inject modal atau pivot',
          'Jangan gunakan uang pribadi untuk menutup kerugian bisnis tanpa batas',
          'Pertimbangkan: apakah bisnis ini viable atau perlu dilikuidasi?',
        ],
        tradeoffs: [
          'Bisnis membutuhkan waktu dan modal: pastikan tidak mengorbankan keuangan pribadi',
          'Bisnis defisit terus-menerus mungkin perlu keputusan sulit (tutup/pivot)',
        ],
        expectedOutcome: 'Bisnis terkelola dengan baik, tidak mengganggu keuangan pribadi',
      });
    }
  }
  // --- END NARRATIVE-BASED STRATEGIES ---

  // Strategy for Cashflow Issues
  if (priorityIssues.some(p => p.issue.includes('Cashflow'))) {
    const targetCut = Math.abs(surplus) + (monthlyIncome * 0.1);
    strategies.push({
      priority: priority++,
      strategyName: 'Perbaikan Cashflow Darurat',
      objective: 'Mengubah cashflow negatif menjadi positif dengan surplus minimal 10%',
      targetAmount: targetCut,
      targetPercentage: 10,
      timeframe: '30 hari',
      specificActions: [
        `Potong pengeluaran non-esensial sebesar ${formatCurrency(targetCut)}/bulan`,
        'Identifikasi 3 pengeluaran terbesar dan negosiasikan penurunan',
        'Pertimbangkan side income atau overtime untuk tambahan pendapatan',
        'Set up budget tracking harian/mingguan',
      ],
      tradeoffs: [
        'Mungkin perlu menurunkan standar gaya hidup sementara',
        'Membutuhkan disiplin ketat dalam 3 bulan pertama',
      ],
      expectedOutcome: `Surplus positif ${formatCurrency(monthlyIncome * 0.1)}/bulan dalam 30 hari`,
    });
  }

  // Strategy for Emergency Fund
  if (priorityIssues.some(p => p.issue.includes('Dana Darurat'))) {
    // Use unified allocation value for consistency with Dashboard
    const monthlyAllocation = unifiedAllocation.emergencyFundContribution;
    const monthsToComplete = monthlyAllocation > 0 ? Math.ceil(emergencyGap / monthlyAllocation) : 24;

    strategies.push({
      priority: priority++,
      strategyName: 'Pembangunan Dana Darurat',
      objective: `Membangun dana darurat ${formatCurrency(emergencyNeeded)} (3-12 bulan pengeluaran)`,
      targetAmount: monthlyAllocation, // Monthly contribution target (consistent with Dashboard)
      timeframe: `${monthsToComplete} bulan`,
      specificActions: [
        `Alokasikan ${formatCurrency(monthlyAllocation)}/bulan via auto-debit`,
        'Simpan di deposito atau reksadana pasar uang (likuid, aman)',
        'Jangan investasikan dana darurat di instrumen berisiko',
        'Review dan sesuaikan target setiap 6 bulan',
      ],
      tradeoffs: [
        'Investasi pertumbuhan ditunda sampai dana darurat tercapai 50%',
        'Return rendah (4-6%) tapi prioritas adalah keamanan',
      ],
      expectedOutcome: `Dana darurat ${formatCurrency(emergencyNeeded)} tercapai dalam ${monthsToComplete} bulan`,
    });
  }

  // Strategy for High Debt
  if (priorityIssues.some(p => p.issue.includes('Hutang'))) {
    const highInterestDebts = data.debts
      .filter(d => d.bungaPerTahun > 15)
      .sort((a, b) => b.bungaPerTahun - a.bungaPerTahun);

    if (highInterestDebts.length > 0) {
      const firstDebt = highInterestDebts[0];
      const extraPayment = Math.min(surplus * 0.3, firstDebt.totalSisaHutang / 12);

      strategies.push({
        priority: priority++,
        strategyName: 'Akselerasi Pelunasan Hutang (Avalanche Method)',
        objective: 'Lunasi hutang berbunga tertinggi terlebih dahulu untuk minimalisir bunga',
        targetAmount: firstDebt.totalSisaHutang,
        timeframe: `${Math.ceil(firstDebt.totalSisaHutang / (firstDebt.cicilanPerBulan + extraPayment))} bulan`,
        specificActions: [
          `Prioritas: ${firstDebt.jenisHutang} (bunga ${firstDebt.bungaPerTahun}%)`,
          `Tambah pembayaran ${formatCurrency(extraPayment)}/bulan di atas cicilan minimum`,
          'Setelah lunas, gulirkan ke hutang bunga tertinggi berikutnya (snowball effect)',
          'Hindari hutang baru selama proses pelunasan',
        ],
        tradeoffs: [
          'Alokasi investasi dikurangi selama pelunasan hutang',
          'Perlu disiplin menghindari hutang konsumtif baru',
        ],
        expectedOutcome: `Hemat bunga ${formatCurrency(firstDebt.totalSisaHutang * firstDebt.bungaPerTahun / 100)} per tahun`,
      });
    }
  }

  // Strategy for Protection Gap
  if (priorityIssues.some(p => p.issue.includes('Proteksi') || p.issue.includes('Kesehatan') || p.issue.includes('Keluarga'))) {
    const annualIncome = monthlyIncome * 12;
    const recommendedLifeUP = annualIncome * 10;
    const estimatedPremium = recommendedLifeUP * 0.003; // ~0.3% of UP for term life

    strategies.push({
      priority: priority++,
      strategyName: 'Pengamanan Proteksi Keluarga',
      objective: 'Memastikan keluarga terlindungi dari risiko kesehatan dan kematian',
      targetAmount: recommendedLifeUP,
      timeframe: '30-60 hari',
      specificActions: [
        'Aktifkan BPJS Kesehatan jika belum (wajib)',
        `Pertimbangkan asuransi jiwa berjangka UP ${formatCurrency(recommendedLifeUP)} (premi ~${formatCurrency(estimatedPremium / 12)}/bulan)`,
        'Tambah asuransi kesehatan swasta sebagai top-up BPJS jika pendapatan > 2x UMR',
        'Pertimbangkan critical illness coverage jika usia >35 tahun',
      ],
      tradeoffs: [
        `Premi asuransi menambah pengeluaran tetap ~${formatCurrency(estimatedPremium / 12)}/bulan`,
        'Pilih asuransi murni (term life), bukan unit link',
      ],
      expectedOutcome: 'Keluarga terlindungi dengan coverage memadai sesuai kebutuhan',
    });
  }

  // Strategy for Investment (only if foundation is stable)
  const hasFoundation = !priorityIssues.some(p => p.classification === 'KRITIS');
  if (hasFoundation && surplus > 0) {
    const investableAmount = surplus * 0.4;

    strategies.push({
      priority: priority++,
      strategyName: 'Strategi Investasi Pertumbuhan',
      objective: 'Mengembangkan kekayaan jangka panjang sesuai profil risiko',
      targetAmount: investableAmount * 12,
      timeframe: '12 bulan pertama, ongoing',
      specificActions: [
        `Mulai investasi rutin ${formatCurrency(investableAmount)}/bulan`,
        `Alokasi berdasarkan profil risiko ${data.riskProfile.toleransiRisiko}`,
        'Diversifikasi: reksadana saham, obligasi, dan emas',
        'Review dan rebalancing portfolio setiap 6 bulan',
      ],
      tradeoffs: [
        'Investasi memiliki risiko, nilai bisa turun jangka pendek',
        'Butuh komitmen jangka panjang (minimal 3-5 tahun)',
      ],
      expectedOutcome: `Akumulasi ${formatCurrency(investableAmount * 12 * 1.1)} dalam 1 tahun (asumsi return 10%)`,
    });
  }

  return strategies;
};

// ============================================
// STEP 4: ACTION PLAN TIMELINE
// ============================================

export const buildActionPlan = (data: UserFinancialData, strategies: RecommendedStrategy[]): ActionPlanTimeline => {
  const shortTerm: ActionPlanItem[] = [];
  const midTerm: ActionPlanItem[] = [];
  const longTerm: ActionPlanItem[] = [];

  const monthlyIncome = calculateMonthlyIncome(data);
  const surplus = calculateMonthlySurplus(data);
  const emergencyNeeded = calculateEmergencyFundNeeded(data);
  const emergencyCurrent = calculateEmergencyFundCurrent(data);
  const emergencyGap = emergencyNeeded - emergencyCurrent;

  // Get unified allocation values for consistency with Dashboard
  const unifiedAllocation = calculateRecommendedAllocationValues(data);

  // === SHORT TERM (0-3 months) ===

  // 1. Budget Setup
  shortTerm.push({
    action: 'Set up sistem tracking pengeluaran (aplikasi atau spreadsheet)',
    amount: 0,
    deadline: 'Minggu 1',
    frequency: 'sekali',
    rationale: 'Tidak bisa mengelola apa yang tidak diukur. Tracking adalah fondasi kontrol keuangan.',
  });

  // 2. Auto-debit for savings (using unified allocation value)
  if (unifiedAllocation.emergencyFundContribution > 0) {
    shortTerm.push({
      action: `Set up auto-debit tabungan/dana darurat ${formatCurrency(unifiedAllocation.emergencyFundContribution)}/bulan`,
      amount: unifiedAllocation.emergencyFundContribution,
      deadline: 'Minggu 1',
      frequency: 'bulanan',
      rationale: 'Pay yourself first. Otomatisasi mencegah godaan spending.',
    });
  }

  // 3. BPJS Activation
  if (!data.insurance.bpjs.punya) {
    shortTerm.push({
      action: 'Daftar BPJS Kesehatan untuk seluruh anggota keluarga',
      amount: 150000 * (data.personalInfo.jumlahTanggungan + 1),
      deadline: 'Minggu 2',
      frequency: 'bulanan',
      rationale: 'BPJS adalah proteksi kesehatan dasar wajib dengan biaya terjangkau.',
    });
  }

  // 4. Life Insurance for dependents
  if (data.personalInfo.jumlahTanggungan > 0 &&
    !data.insurance.asuransiLainnya.some(i => i.jenisAsuransi === 'jiwa')) {
    const annualIncome = monthlyIncome * 12;
    const upRecommended = annualIncome * 10;
    const estimatedPremium = upRecommended * 0.003 / 12;

    shortTerm.push({
      action: `Aktifkan asuransi jiwa berjangka UP ${formatCurrency(upRecommended)}`,
      amount: estimatedPremium,
      deadline: 'Bulan 1',
      frequency: 'bulanan',
      rationale: `Melindungi ${data.personalInfo.jumlahTanggungan} tanggungan jika terjadi sesuatu pada pencari nafkah.`,
    });
  }

  // 5. High-interest debt extra payment
  const highInterestDebt = data.debts.find(d => d.bungaPerTahun > 20);
  if (highInterestDebt && surplus > 0) {
    const extraPayment = Math.min(surplus * 0.3, highInterestDebt.totalSisaHutang / 6);
    shortTerm.push({
      action: `Bayar extra ${formatCurrency(extraPayment)}/bulan untuk ${highInterestDebt.jenisHutang}`,
      amount: extraPayment,
      deadline: 'Mulai bulan ini',
      frequency: 'bulanan',
      rationale: `Hutang bunga ${highInterestDebt.bungaPerTahun}% menggerus kekayaan. Prioritas pelunasan.`,
    });
  }

  // === MID TERM (3-12 months) ===

  // 1. Emergency Fund Progress
  if (emergencyGap > 0) {
    midTerm.push({
      action: `Capai dana darurat 50% (${formatCurrency(emergencyNeeded * 0.5)})`,
      amount: emergencyNeeded * 0.5 - emergencyCurrent,
      deadline: 'Bulan 6',
      frequency: 'sekali',
      rationale: 'Milestone 50% memberikan buffer minimum untuk kondisi darurat ringan.',
    });
  }

  // 2. Start Investing (using unified allocation value)
  if (unifiedAllocation.investmentContribution > 0) {
    midTerm.push({
      action: `Mulai investasi rutin ${formatCurrency(unifiedAllocation.investmentContribution)}/bulan`,
      amount: unifiedAllocation.investmentContribution,
      deadline: 'Bulan 4',
      frequency: 'bulanan',
      rationale: 'Setelah dana darurat 30%+, mulai investasi untuk pertumbuhan kekayaan.',
    });
  }

  // 3. Insurance Review (using unified allocation value)
  const insuranceAction = unifiedAllocation.insuranceRecommendation > 0
    ? `Tambah proteksi asuransi ${formatCurrency(unifiedAllocation.insuranceRecommendation)}/bulan`
    : 'Review kecukupan proteksi asuransi (kesehatan, jiwa, penyakit kritis)';
  midTerm.push({
    action: insuranceAction,
    amount: unifiedAllocation.insuranceRecommendation,
    deadline: 'Bulan 6',
    frequency: 'tahunan',
    rationale: 'Kebutuhan proteksi berubah seiring perubahan pendapatan dan tanggungan.',
  });

  // 4. Debt Milestone
  if (data.debts.length > 0) {
    const totalDebt = calculateTotalLiabilities(data);
    midTerm.push({
      action: 'Lunasi minimal 1 hutang berbunga tinggi',
      amount: data.debts.sort((a, b) => a.totalSisaHutang - b.totalSisaHutang)[0]?.totalSisaHutang || 0,
      deadline: 'Bulan 12',
      frequency: 'sekali',
      rationale: 'Quick win untuk momentum. Cicilan yang freed-up dialihkan ke hutang berikutnya.',
    });
  }

  // === LONG TERM (>12 months) ===

  // 1. Emergency Fund Complete
  if (emergencyGap > 0) {
    longTerm.push({
      action: `Dana darurat 100% tercapai (${formatCurrency(emergencyNeeded)})`,
      amount: emergencyNeeded,
      deadline: 'Tahun 2',
      frequency: 'sekali',
      rationale: 'Fondasi keuangan lengkap. Bebas fokus pada pertumbuhan kekayaan.',
    });
  }

  // 2. Financial Goals Progress
  data.financialGoals.forEach(goal => {
    longTerm.push({
      action: `Progress tujuan: ${goal.namaTujuan}`,
      amount: goal.targetUang,
      deadline: `${goal.jangkaWaktuBulan} bulan`,
      frequency: 'sekali',
      rationale: `Tujuan prioritas ${goal.prioritas}. Investasi sesuai timeframe.`,
    });
  });

  // 3. Portfolio Review
  longTerm.push({
    action: 'Review komprehensif: rebalancing portfolio, update tujuan keuangan',
    amount: 0,
    deadline: 'Setiap tahun',
    frequency: 'tahunan',
    rationale: 'Pastikan alokasi aset masih sesuai dengan usia dan tujuan.',
  });

  // 4. Passive Income Development
  if (calculateTotalAssets(data) > monthlyIncome * 60) {
    longTerm.push({
      action: 'Develop sumber passive income (dividen, properti sewaan, dll)',
      amount: monthlyIncome * 12,
      deadline: 'Tahun 5',
      frequency: 'tahunan',
      rationale: 'Diversifikasi sumber pendapatan menuju financial independence.',
    });
  }

  return {
    shortTerm,
    midTerm,
    longTerm,
  };
};

// ============================================
// STEP 5: ADVISOR CONCLUSION
// ============================================

export const writeAdvisorConclusion = (
  data: UserFinancialData,
  diagnosis: FinancialDiagnosis,
  priorityIssues: PriorityIssue[],
  strategies: RecommendedStrategy[],
  intents?: NarrativeIntents
): string => {
  const name = data.personalInfo.namaLengkap || 'Bapak/Ibu';
  const monthlyIncome = calculateMonthlyIncome(data);
  const surplus = calculateMonthlySurplus(data);
  const netWorth = calculateTotalAssets(data) - calculateTotalLiabilities(data);

  const criticalIssues = priorityIssues.filter(p => p.classification === 'KRITIS');
  const importantIssues = priorityIssues.filter(p => p.classification === 'PENTING');

  let conclusion = `Kepada ${name},\n\n`;

  // Opening assessment
  conclusion += `Berdasarkan analisis komprehensif kondisi keuangan Anda, dengan pendapatan ${formatCurrency(monthlyIncome)}/bulan `;
  conclusion += `dan kekayaan bersih ${formatCurrency(netWorth)}, `;
  conclusion += `kondisi finansial Anda mendapat nilai ${diagnosis.overallHealthGrade}.\n\n`;

  // === NARRATIVE ACKNOWLEDGMENT (CRITICAL PERSONALIZATION) ===
  if (intents && intents.rawKeywords.length > 0) {
    conclusion += `**MENGENAI PERTANYAAN ANDA:**\n`;

    // Insurance concern acknowledgment
    if (intents.mentionsInsurance && intents.mentionsConfusion) {
      conclusion += `\nTerkait pertanyaan Anda mengenai apakah perlu memiliki asuransi tambahan selain BPJS, `;
      conclusion += `berdasarkan kondisi keuangan dan rencana hidup yang Anda sampaikan, `;
      conclusion += `asuransi tambahan bersifat opsional namun direkomendasikan sebagai mitigasi risiko finansial.\n\n`;
      conclusion += `Fokus utama sebaiknya pada asuransi kesehatan murni atau asuransi jiwa berjangka, `;
      conclusion += `dengan premi yang tetap proporsional terhadap pendapatan Anda (maks 10%) `;
      conclusion += `dan tidak mengganggu tujuan keuangan lain.\n\n`;
    } else if (intents.mentionsInsurance) {
      conclusion += `\nMengenai kebutuhan proteksi asuransi yang Anda sampaikan: `;
      conclusion += `BPJS Kesehatan adalah fondasi wajib. `;
      if (data.personalInfo.jumlahTanggungan > 0) {
        conclusion += `Karena Anda memiliki ${data.personalInfo.jumlahTanggungan} tanggungan, asuransi jiwa berjangka sangat direkomendasikan. `;
      }
      if (monthlyIncome > getUMR() * 2) {
        conclusion += `Dengan level pendapatan Anda, asuransi kesehatan swasta sebagai top-up BPJS juga layak dipertimbangkan.\n\n`;
      } else {
        conclusion += `BPJS sudah cukup memadai untuk saat ini, fokuskan pada dana darurat terlebih dahulu.\n\n`;
      }
    }

    // Marriage planning acknowledgment
    if (intents.mentionsMarriage) {
      conclusion += `\nMengenai rencana pernikahan yang Anda sampaikan: `;
      conclusion += `ini adalah life event yang membutuhkan perencanaan finansial khusus. `;
      conclusion += `Saya menyarankan untuk membuat rekening terpisah khusus dana pernikahan `;
      conclusion += `dan memprioritaskan saving untuk tujuan ini tanpa mengorbankan dana darurat.\n\n`;
    }

    // Housing concern acknowledgment - distinguish rental upgrade vs home purchase
    if (intents.mentionsRentalUpgrade && intents.lifestyleUpgrade) {
      // User wants to upgrade rental (sewa/kos/kontrakan)
      const feasibility = analyzeLifestyleUpgradeFeasibility(data, intents.lifestyleUpgrade);
      const newRent = intents.lifestyleUpgrade.extractedAmount || 0;

      conclusion += `\nMengenai keinginan pindah ke tempat sewaan yang lebih baik yang Anda sampaikan: `;
      if (feasibility.status === 'FEASIBLE') {
        conclusion += `berdasarkan kondisi keuangan Anda, upgrade sewa ke ${formatCurrency(newRent)}/bulan LAYAK dilakukan. `;
        conclusion += `Surplus Anda akan tetap sehat di ${formatCurrency(feasibility.surplusAfterUpgrade)}/bulan setelah upgrade.\n\n`;
      } else if (feasibility.status === 'MARGINAL') {
        conclusion += `upgrade sewa ke ${formatCurrency(newRent)}/bulan MEMUNGKINKAN namun perlu penyesuaian prioritas. `;
        conclusion += `Surplus Anda akan turun menjadi ${formatCurrency(feasibility.surplusAfterUpgrade)}/bulan. `;
        conclusion += `${feasibility.message}\n\n`;
      } else {
        conclusion += `saat ini upgrade ke ${formatCurrency(newRent)}/bulan BELUM DISARANKAN karena akan membebani keuangan Anda. `;
        conclusion += `${feasibility.message}`;
        if (feasibility.alternatives && feasibility.alternatives.length > 0) {
          conclusion += ` Saran: ${feasibility.alternatives[0]}\n\n`;
        } else {
          conclusion += `\n\n`;
        }
      }
    } else if (intents.mentionsHomePurchase || (intents.mentionsHousing && !intents.mentionsRentalUpgrade)) {
      // User wants to buy a house (KPR)
      conclusion += `\nMengenai keinginan memiliki rumah yang Anda sampaikan: `;
      conclusion += `berdasarkan kemampuan finansial Anda saat ini, properti dengan cicilan maksimal `;
      conclusion += `${formatCurrency(monthlyIncome * 0.3)}/bulan adalah batas aman. `;
      conclusion += `Fokuskan pada mengumpulkan DP 20% terlebih dahulu sebelum mengambil KPR.\n\n`;
    }

    // Investment confusion acknowledgment
    if (intents.mentionsInvestment && intents.mentionsConfusion) {
      conclusion += `\nMengenai kebingungan pilihan investasi yang Anda sampaikan: `;
      conclusion += `tidak perlu merasa overwhelmed. Berdasarkan profil risiko ${data.riskProfile.toleransiRisiko} Anda, `;
      conclusion += `mulailah dengan reksadana yang sesuai yang memberikan diversifikasi otomatis. `;
      conclusion += `Konsistensi investasi rutin lebih penting daripada timing pasar yang sempurna.\n\n`;
    }

    // Job loss concern acknowledgment
    if (intents.mentionsJobLoss) {
      conclusion += `\nMengenai kekhawatiran terkait keamanan pekerjaan yang Anda sampaikan: `;
      conclusion += `ini adalah concern yang valid dan bijaksana. Prioritaskan untuk membangun dana darurat `;
      conclusion += `minimal 6 bulan pengeluaran (${formatCurrency(calculateEmergencyFundNeeded(data))}). `;
      conclusion += `Pertimbangkan juga untuk mengembangkan skill atau side income sebagai backup.\n\n`;
    }

    // Debt concern acknowledgment
    if (intents.mentionsDebt) {
      const totalDebt = calculateTotalLiabilities(data);
      const monthlyDebtPayments = calculateTotalMonthlyDebtPayments(data);
      conclusion += `\nMengenai hutang yang Anda sampaikan dalam cerita keuangan: `;
      if (totalDebt > 0) {
        conclusion += `berdasarkan data, total kewajiban Anda saat ini ${formatCurrency(totalDebt)} `;
        conclusion += `dengan cicilan ${formatCurrency(monthlyDebtPayments)}/bulan. `;
      }
      conclusion += `Hutang bukan sesuatu yang perlu ditakuti selama dikelola dengan baik. `;
      conclusion += `Prioritaskan pelunasan hutang berbunga tinggi terlebih dahulu. `;
      conclusion += `Jika hutang tersebut adalah hutang bisnis, pastikan untuk memisahkan keuangan pribadi dan bisnis `;
      conclusion += `agar tidak saling membebani.\n\n`;
    }

    // Business/Side income acknowledgment
    if (intents.mentionsSideIncome) {
      conclusion += `\nMengenai bisnis/usaha yang Anda sampaikan: `;
      conclusion += `memiliki bisnis sampingan adalah langkah bagus untuk diversifikasi penghasilan. `;
      conclusion += `Namun, perlu diingat bahwa bisnis yang sedang defisit membutuhkan evaluasi serius. `;
      conclusion += `Pertanyaan kunci: apakah bisnis ini bisa diperbaiki dengan strategi yang berbeda, `;
      conclusion += `atau apakah sudah waktunya untuk cut loss dan fokus pada karir utama? `;
      conclusion += `Jangan sampai kerugian bisnis menggerus tabungan dan keuangan pribadi Anda.\n\n`;
    }
  }
  // === END NARRATIVE ACKNOWLEDGMENT ===

  // Critical issues summary
  if (criticalIssues.length > 0) {
    conclusion += `**PERHATIAN UTAMA:**\n`;
    conclusion += `Saya mengidentifikasi ${criticalIssues.length} masalah KRITIS yang harus segera ditangani:\n`;
    criticalIssues.forEach((issue, i) => {
      conclusion += `${i + 1}. ${issue.issue} - dampak finansial ${formatCurrency(issue.financialImpact)}\n`;
    });
    conclusion += `\nMasalah-masalah ini tidak boleh ditunda karena dapat mengakibatkan kerugian signifikan atau risiko besar bagi keluarga Anda.\n\n`;
  }

  // Primary recommendation
  if (strategies.length > 0) {
    conclusion += `**REKOMENDASI PRIORITAS:**\n`;
    conclusion += `Langkah pertama yang harus Anda ambil adalah: ${strategies[0].strategyName}.\n`;
    conclusion += `Target: ${strategies[0].objective}\n`;
    conclusion += `Timeframe: ${strategies[0].timeframe}\n\n`;
  }

  // Positive aspects
  if (surplus > 0) {
    conclusion += `**ASPEK POSITIF:**\n`;
    conclusion += `Anda memiliki cashflow positif ${formatCurrency(surplus)}/bulan. `;
    conclusion += `Ini adalah modal yang baik untuk memperbaiki kondisi keuangan. `;
    conclusion += `Kunci keberhasilan adalah disiplin mengalokasikan surplus ini sesuai prioritas.\n\n`;
  }

  // Next steps
  conclusion += `**LANGKAH SELANJUTNYA:**\n`;
  conclusion += `1. Dalam 7 hari: Set up sistem tracking pengeluaran dan auto-debit tabungan\n`;
  if (criticalIssues.some(i => i.issue.includes('Proteksi') || i.issue.includes('Kesehatan'))) {
    conclusion += `2. Dalam 30 hari: Amankan proteksi asuransi untuk keluarga\n`;
  }
  conclusion += `3. Review progress setiap bulan dan sesuaikan strategi jika diperlukan\n\n`;

  // Closing
  conclusion += `Ingat: Perjalanan menuju kebebasan finansial adalah maraton, bukan sprint. `;
  conclusion += `Yang penting adalah konsistensi dan disiplin dalam menjalankan rencana ini. `;
  conclusion += `Jika ada perubahan signifikan dalam situasi keuangan Anda, segera lakukan review ulang.\n\n`;

  conclusion += `Salam hangat,\n`;
  conclusion += `AI Financial Advisor YouthFinance`;

  return conclusion;
};

// ============================================
// MAIN FUNCTION: GENERATE FULL ADVISOR REPORT
// ============================================

export const generateAdvisorReport = (data: UserFinancialData): AdvisorReport => {
  // Step 0: Detect narrative intents from user's financial story
  const intents = detectNarrativeIntents(data.financialStory);

  // Step 1: Diagnosis (with narrative intents)
  const diagnosis = diagnoseFinancialCondition(data, intents);

  // Step 2: Priority Classification
  const priorityIssues = classifyPriorityIssues(data, diagnosis);

  // Step 3: Strategy Design (with narrative intents)
  const strategies = designStrategies(data, priorityIssues, intents);

  // Step 4: Action Plan
  const actionPlan = buildActionPlan(data, strategies);

  // Step 5: Advisor Conclusion (with narrative intents)
  const advisorConclusion = writeAdvisorConclusion(data, diagnosis, priorityIssues, strategies, intents);

  return {
    diagnosis,
    priorityIssues,
    strategies,
    actionPlan,
    advisorConclusion,
    generatedAt: new Date(),
  };
};
