import type {
  UserFinancialData,
  HealthMetric,
  DebtPayoffPlan,
  InvestmentRecommendation,
  GoalPlan,
  FinancialGoal
} from '@/types/finance';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num);
};

// Calculate total assets from new structure
export const calculateTotalAssets = (data: UserFinancialData): number => {
  const { assets } = data;
  const kasLikuid =
    assets.kasLikuid.tabunganBank +
    assets.kasLikuid.deposito +
    assets.kasLikuid.eWallet +
    assets.kasLikuid.uangTunai;

  const investasi =
    assets.investasi.reksadanaPasarUang +
    assets.investasi.reksadanaObligasi +
    assets.investasi.reksadanaSaham +
    assets.investasi.sahamIndonesia +
    assets.investasi.sahamUSETF +
    assets.investasi.kripto +
    assets.investasi.obligasiNegara +
    assets.investasi.emas +
    assets.investasi.lainnyaNilai;

  const asetRiil =
    assets.asetRiil.properti +
    assets.asetRiil.kendaraan +
    assets.asetRiil.barangBerharga;

  return kasLikuid + investasi + asetRiil;
};

export const calculateLiquidAssets = (data: UserFinancialData): number => {
  const { assets } = data;
  return (
    assets.kasLikuid.tabunganBank +
    assets.kasLikuid.deposito +
    assets.kasLikuid.eWallet +
    assets.kasLikuid.uangTunai +
    assets.investasi.reksadanaPasarUang +
    assets.investasi.reksadanaObligasi * 0.95 +
    assets.investasi.reksadanaSaham * 0.9
  );
};

// Calculate total liabilities from debts array
export const calculateTotalLiabilities = (data: UserFinancialData): number => {
  return data.debts.reduce((total, debt) => total + debt.totalSisaHutang, 0);
};

// Calculate total monthly debt payments
export const calculateTotalMonthlyDebtPayments = (data: UserFinancialData): number => {
  return data.debts.reduce((total, debt) => total + debt.cicilanPerBulan, 0);
};

export const calculateNetWorth = (data: UserFinancialData): number => {
  return calculateTotalAssets(data) - calculateTotalLiabilities(data);
};

// Calculate monthly income from new structure
export const calculateMonthlyIncome = (data: UserFinancialData): number => {
  const { income } = data;
  const rutinBulanan =
    income.gajiBulanan +
    income.tunjanganBulanan +
    income.penghasilanPasangan +
    income.penghasilanTambahan;

  // Convert annual to monthly
  const tidakRutinBulanan =
    (income.bonusRataPerTahun +
      income.dividenTahunan +
      income.hasilUsahaTahunan +
      income.penghasilanPasifLainnya) / 12;

  return rutinBulanan + tidakRutinBulanan;
};

// Calculate monthly expenses from new detailed structure
export const calculateMonthlyExpenses = (data: UserFinancialData): number => {
  const { expenses } = data;

  const tempatTinggal =
    expenses.tempatTinggal.biayaSewa +
    expenses.tempatTinggal.listrik +
    expenses.tempatTinggal.air +
    expenses.tempatTinggal.internet +
    expenses.tempatTinggal.keperluanRumahTangga;

  const konsumsi =
    expenses.konsumsi.makanHarian * 30 + // Assuming daily expense
    expenses.konsumsi.jajanNgopi * 20 + // ~20 days per month
    expenses.konsumsi.belanjaDapur;

  const transportasi =
    expenses.transportasi.transportHarian * 22 + // ~22 work days
    expenses.transportasi.parkir * 22 +
    expenses.transportasi.servisKendaraan;

  const kesehatanLifestyle =
    expenses.kesehatanLifestyle.vitaminSuplemen +
    expenses.kesehatanLifestyle.gymFitness +
    expenses.kesehatanLifestyle.hiburan;

  // BPJS from insurance
  const bpjsCost = data.insurance.bpjs.punya ? data.insurance.bpjs.iuranBulanan : 0;

  // Subscription costs
  let subscriptions = expenses.komunikasiSubscriptions.pulsaPaketData;
  if (expenses.komunikasiSubscriptions.spotify.aktif) subscriptions += expenses.komunikasiSubscriptions.spotify.biayaBulanan;
  if (expenses.komunikasiSubscriptions.netflix.aktif) subscriptions += expenses.komunikasiSubscriptions.netflix.biayaBulanan;
  if (expenses.komunikasiSubscriptions.youtubePremium.aktif) subscriptions += expenses.komunikasiSubscriptions.youtubePremium.biayaBulanan;
  if (expenses.komunikasiSubscriptions.googleStorage.aktif) subscriptions += expenses.komunikasiSubscriptions.googleStorage.biayaBulanan;
  if (expenses.komunikasiSubscriptions.appleIcloud.aktif) subscriptions += expenses.komunikasiSubscriptions.appleIcloud.biayaBulanan;
  if (expenses.komunikasiSubscriptions.amazonPrime.aktif) subscriptions += expenses.komunikasiSubscriptions.amazonPrime.biayaBulanan;
  subscriptions += expenses.komunikasiSubscriptions.lainnyaBiaya;

  // Custom expenses
  let customExpensesTotal = 0;
  data.customExpenses.forEach(expense => {
    switch (expense.frekuensi) {
      case 'harian': customExpensesTotal += expense.nominal * 30; break;
      case 'mingguan': customExpensesTotal += expense.nominal * 4; break;
      case 'bulanan': customExpensesTotal += expense.nominal; break;
      case 'tahunan': customExpensesTotal += expense.nominal / 12; break;
    }
  });

  const kewajibanKeluarga =
    expenses.kewajibanKeluarga.uangSekolahAnak +
    expenses.kewajibanKeluarga.sppDaycare;

  const totalDebtPayments = calculateTotalMonthlyDebtPayments(data);

  return tempatTinggal + konsumsi + transportasi + kesehatanLifestyle + bpjsCost + subscriptions + customExpensesTotal + kewajibanKeluarga + totalDebtPayments;
};

export const calculateMonthlySurplus = (data: UserFinancialData): number => {
  return calculateMonthlyIncome(data) - calculateMonthlyExpenses(data);
};

// Calculate expense breakdown by category for pie chart
export interface ExpenseBreakdown {
  category: string;
  amount: number;
  color: string;
}

export const calculateExpenseBreakdown = (data: UserFinancialData): ExpenseBreakdown[] => {
  const { expenses } = data;

  // 1. Tempat Tinggal (sewa only)
  const tempatTinggal = expenses.tempatTinggal.biayaSewa;

  // 2. Tagihan (Listrik/Air/Internet Rumah)
  const tagihan =
    expenses.tempatTinggal.listrik +
    expenses.tempatTinggal.air +
    expenses.tempatTinggal.internet;

  // 3. Makan & Minum (daily meals + snacks)
  const makanMinum =
    expenses.konsumsi.makanHarian * 30 +
    expenses.konsumsi.jajanNgopi * 20;

  // 4. Belanja Bulanan (household/grocery shopping)
  const belanjaBulanan =
    expenses.tempatTinggal.keperluanRumahTangga +
    expenses.konsumsi.belanjaDapur;

  // 5. Transportasi
  const transportasi =
    expenses.transportasi.transportHarian * 22 +
    expenses.transportasi.parkir * 22 +
    expenses.transportasi.servisKendaraan;

  // 6. Gaya Hidup
  const gayaHidup =
    expenses.kesehatanLifestyle.vitaminSuplemen +
    expenses.kesehatanLifestyle.gymFitness +
    expenses.kesehatanLifestyle.hiburan;

  // 7. Langganan
  let langganan = expenses.komunikasiSubscriptions.pulsaPaketData;
  if (expenses.komunikasiSubscriptions.spotify.aktif) langganan += expenses.komunikasiSubscriptions.spotify.biayaBulanan;
  if (expenses.komunikasiSubscriptions.netflix.aktif) langganan += expenses.komunikasiSubscriptions.netflix.biayaBulanan;
  if (expenses.komunikasiSubscriptions.youtubePremium.aktif) langganan += expenses.komunikasiSubscriptions.youtubePremium.biayaBulanan;
  if (expenses.komunikasiSubscriptions.googleStorage.aktif) langganan += expenses.komunikasiSubscriptions.googleStorage.biayaBulanan;
  if (expenses.komunikasiSubscriptions.appleIcloud.aktif) langganan += expenses.komunikasiSubscriptions.appleIcloud.biayaBulanan;
  if (expenses.komunikasiSubscriptions.amazonPrime.aktif) langganan += expenses.komunikasiSubscriptions.amazonPrime.biayaBulanan;
  langganan += expenses.komunikasiSubscriptions.lainnyaBiaya;

  // 8. Kewajiban Keluarga
  const kewajibanKeluarga =
    expenses.kewajibanKeluarga.uangSekolahAnak +
    expenses.kewajibanKeluarga.sppDaycare;

  // 9. Cicilan Hutang
  const cicilanHutang = calculateTotalMonthlyDebtPayments(data);

  // 10. Asuransi (BPJS + private insurance premiums)
  let asuransi = 0;
  if (data.insurance.bpjs.punya) asuransi += data.insurance.bpjs.iuranBulanan;
  if (data.insurance.kesehatanSwasta.punya) asuransi += data.insurance.kesehatanSwasta.premiBulanan;
  // Sum up other insurance premiums
  data.insurance.asuransiLainnya.forEach(ins => {
    asuransi += ins.premiBulanan;
  });

  // 11. Dana Darurat (monthly contribution if user adds regularly)
  const danaDarurat = data.emergencyFund.frekuensiMenambah === 'bulanan'
    ? data.emergencyFund.jumlahPenambahan
    : 0;

  // 12. Investasi (calculated from monthly savings going to investment type assets)
  // Note: We don't have a direct "monthly investment" field, so we'll leave this as 0 for current breakdown
  // The recommended allocation will calculate the ideal investment amount
  const investasi = 0;

  // 13. Lainnya (custom expenses)
  let lainnya = 0;
  data.customExpenses.forEach(expense => {
    switch (expense.frekuensi) {
      case 'harian': lainnya += expense.nominal * 30; break;
      case 'mingguan': lainnya += expense.nominal * 4; break;
      case 'bulanan': lainnya += expense.nominal; break;
      case 'tahunan': lainnya += expense.nominal / 12; break;
    }
  });

  const breakdown: ExpenseBreakdown[] = [
    { category: 'Tempat Tinggal', amount: tempatTinggal, color: '#3b82f6' }, // blue
    { category: 'Tagihan', amount: tagihan, color: '#06b6d4' }, // cyan
    { category: 'Makan & Minum', amount: makanMinum, color: '#22c55e' }, // green
    { category: 'Belanja Bulanan', amount: belanjaBulanan, color: '#84cc16' }, // lime
    { category: 'Transportasi', amount: transportasi, color: '#f59e0b' }, // amber
    { category: 'Gaya Hidup', amount: gayaHidup, color: '#8b5cf6' }, // purple
    { category: 'Langganan', amount: langganan, color: '#ec4899' }, // pink
    { category: 'Kewajiban Keluarga', amount: kewajibanKeluarga, color: '#14b8a6' }, // teal
    { category: 'Cicilan Hutang', amount: cicilanHutang, color: '#ef4444' }, // red
    { category: 'Asuransi', amount: asuransi, color: '#0ea5e9' }, // sky
    { category: 'Dana Darurat', amount: danaDarurat, color: '#10b981' }, // emerald
    { category: 'Investasi', amount: investasi, color: '#f97316' }, // orange
    { category: 'Lainnya', amount: lainnya, color: '#6b7280' }, // gray
  ];

  // Filter out zero amounts
  return breakdown.filter(item => item.amount > 0);
};

// Interface for recommended allocation values - single source of truth
export interface RecommendedAllocationValues {
  emergencyFundContribution: number; // Monthly contribution to emergency fund
  investmentContribution: number; // Monthly investment amount
  goalsContribution: number; // Monthly contribution to financial goals
  insuranceRecommendation: number; // Additional monthly insurance premium recommendation
  hasHealthInsurance: boolean;
  hasLifeInsurance: boolean;
  hasCriticalIllness: boolean;
}

// Calculate recommended allocation values - used by both Dashboard and Advisor for consistency
export const calculateRecommendedAllocationValues = (data: UserFinancialData): RecommendedAllocationValues => {
  const monthlyIncome = calculateMonthlyIncome(data);
  const currentExpenses = calculateMonthlyExpenses(data);
  const surplus = calculateMonthlySurplus(data);
  const availableSurplus = Math.max(0, surplus);

  // Check emergency fund adequacy (target: 6 months of expenses)
  const idealEmergencyFund = currentExpenses * 6;
  const currentEmergencyFund = data.emergencyFund.danaDaruratSaatIni;
  const emergencyFundGap = Math.max(0, idealEmergencyFund - currentEmergencyFund);

  // Calculate monthly contribution needed for emergency fund (target: 12 months to fill)
  const emergencyFundContribution = emergencyFundGap > 0
    ? Math.min(emergencyFundGap / 12, availableSurplus * 0.30)
    : availableSurplus * 0.10;

  // Check insurance adequacy
  const hasHealthInsurance = data.insurance.bpjs.punya || data.insurance.kesehatanSwasta.punya;
  const hasLifeInsurance = data.insurance.asuransiLainnya.some(ins => ins.jenisAsuransi === 'jiwa');
  const hasCriticalIllness = data.insurance.asuransiLainnya.some(ins => ins.jenisAsuransi === 'penyakit_kritis');

  // Calculate insurance recommendation
  let insuranceRecommendation = 0;
  if (!hasHealthInsurance || !hasLifeInsurance || !hasCriticalIllness) {
    const idealInsuranceBudget = monthlyIncome * 0.10;
    let currentInsurancePremium = 0;
    if (data.insurance.bpjs.punya) currentInsurancePremium += data.insurance.bpjs.iuranBulanan;
    if (data.insurance.kesehatanSwasta.punya) currentInsurancePremium += data.insurance.kesehatanSwasta.premiBulanan;
    data.insurance.asuransiLainnya.forEach(ins => {
      currentInsurancePremium += ins.premiBulanan;
    });
    const insuranceGap = Math.max(0, idealInsuranceBudget - currentInsurancePremium);
    if (insuranceGap > 0) {
      insuranceRecommendation = Math.min(insuranceGap, availableSurplus * 0.15);
    }
  }

  // Calculate target for financial goals - use actual needed, not capped
  // But respect priority: first emergency fund, then insurance, then goals
  const surplusAfterEmergencyAndInsurance = availableSurplus - emergencyFundContribution - insuranceRecommendation;

  let goalsContribution = 0;
  if (data.financialGoals.length > 0 && surplusAfterEmergencyAndInsurance > 0) {
    const totalGoalsNeeded = data.financialGoals.reduce((sum, goal) => {
      const remaining = goal.targetUang - goal.danaTerkumpul;
      const monthlyNeeded = remaining > 0 && goal.jangkaWaktuBulan > 0
        ? remaining / goal.jangkaWaktuBulan
        : 0;
      return sum + monthlyNeeded;
    }, 0);
    // Use actual needed amount, but never exceed REMAINING surplus after priorities
    goalsContribution = Math.min(totalGoalsNeeded, surplusAfterEmergencyAndInsurance);
  }

  // All remaining surplus goes to investment
  const investmentContribution = Math.max(0, surplusAfterEmergencyAndInsurance - goalsContribution);

  return {
    emergencyFundContribution,
    investmentContribution,
    goalsContribution,
    insuranceRecommendation,
    hasHealthInsurance,
    hasLifeInsurance,
    hasCriticalIllness,
  };
};

// Calculate recommended allocation from Financial Advisor
// This is a smarter allocation that:
// 1. Keeps current expenses as baseline (doesn't arbitrarily increase lifestyle)
// 2. Prioritizes surplus for emergency fund, goals, and investment
// 3. Only suggests lifestyle upgrades if explicitly mentioned in financial story
// Optional rentalUpgradeAmount: if user has a FEASIBLE rental upgrade, use this new amount
export const calculateRecommendedAllocation = (
  data: UserFinancialData,
  rentalUpgradeAmount?: number
): ExpenseBreakdown[] => {
  const monthlyIncome = calculateMonthlyIncome(data);
  const currentExpenses = calculateMonthlyExpenses(data);
  const surplus = calculateMonthlySurplus(data);

  // Get current expense breakdown as baseline
  const currentBreakdown = calculateExpenseBreakdown(data);

  // Calculate current totals by category
  const currentHousing = currentBreakdown.find(b => b.category === 'Tempat Tinggal')?.amount || 0;
  const currentFood = currentBreakdown.find(b => b.category === 'Makan & Minum')?.amount || 0;
  const currentTransport = currentBreakdown.find(b => b.category === 'Transportasi')?.amount || 0;
  const currentLifestyle = currentBreakdown.find(b => b.category === 'Gaya Hidup')?.amount || 0;
  const currentSubscriptions = currentBreakdown.find(b => b.category === 'Langganan')?.amount || 0;

  // Start with current expenses as baseline
  // If rental upgrade is provided and valid, use it instead of current housing
  let recommendedHousing = currentHousing;
  if (rentalUpgradeAmount && rentalUpgradeAmount > 0) {
    recommendedHousing = rentalUpgradeAmount;
  }
  let recommendedFood = currentFood;
  let recommendedTransport = currentTransport;
  let recommendedLifestyle = currentLifestyle;
  let recommendedSubscriptions = currentSubscriptions;

  // Calculate available surplus for allocation
  // If rental upgrade is applied, reduce surplus by additional housing cost
  const additionalHousingCost = recommendedHousing - currentHousing;
  let availableSurplus = Math.max(0, surplus - additionalHousingCost);

  // Check emergency fund adequacy (target: 6 months of expenses)
  const idealEmergencyFund = currentExpenses * 6;
  const currentEmergencyFund = data.emergencyFund.danaDaruratSaatIni;
  const emergencyFundGap = Math.max(0, idealEmergencyFund - currentEmergencyFund);

  // Calculate monthly contribution needed for emergency fund (target: 12 months to fill)
  const emergencyContribution = emergencyFundGap > 0 ? Math.min(emergencyFundGap / 12, availableSurplus * 0.30) : availableSurplus * 0.10;

  // Check insurance adequacy and recommend additional coverage if needed
  // Ideal: have BPJS + private health insurance + life insurance (if has dependents)
  let insuranceRecommendation = 0;
  const hasHealthInsurance = data.insurance.bpjs.punya || data.insurance.kesehatanSwasta.punya;
  const hasLifeInsurance = data.insurance.asuransiLainnya.some(ins => ins.jenisAsuransi === 'jiwa');
  const hasCriticalIllness = data.insurance.asuransiLainnya.some(ins => ins.jenisAsuransi === 'penyakit_kritis');

  // Recommend 5-10% of income for insurance if lacking protection
  if (!hasHealthInsurance || !hasLifeInsurance || !hasCriticalIllness) {
    const idealInsuranceBudget = monthlyIncome * 0.10; // 10% of income for comprehensive protection
    const currentInsurancePremium = currentBreakdown.find(b => b.category === 'Asuransi')?.amount || 0;
    const insuranceGap = Math.max(0, idealInsuranceBudget - currentInsurancePremium);

    // Only allocate if user has surplus and gap exists
    if (insuranceGap > 0) {
      insuranceRecommendation = Math.min(insuranceGap, availableSurplus * 0.15); // Max 15% of surplus for insurance
    }
  }

  // Calculate target for financial goals - use actual needed, from remaining surplus
  let goalsContribution = 0;
  const surplusAfterEmergencyAndInsurance = availableSurplus - emergencyContribution - insuranceRecommendation;
  if (data.financialGoals.length > 0 && surplusAfterEmergencyAndInsurance > 0) {
    // Sum up monthly needed for all goals
    const totalGoalsNeeded = data.financialGoals.reduce((sum, goal) => {
      const remaining = goal.targetUang - goal.danaTerkumpul;
      const monthlyNeeded = remaining > 0 && goal.jangkaWaktuBulan > 0
        ? remaining / goal.jangkaWaktuBulan
        : 0;
      return sum + monthlyNeeded;
    }, 0);
    // Use actual needed amount, but never exceed remaining surplus
    goalsContribution = Math.min(totalGoalsNeeded, surplusAfterEmergencyAndInsurance);
  }

  // All remaining surplus goes to investment (no automatic lifestyle increase)
  const remainingAfterPriorities = surplusAfterEmergencyAndInsurance - goalsContribution;
  const investmentContribution = Math.max(0, remainingAfterPriorities); // 100% of remaining to investment



  // Get additional current amounts
  const currentTagihan = currentBreakdown.find(b => b.category === 'Tagihan')?.amount || 0;
  const currentBelanja = currentBreakdown.find(b => b.category === 'Belanja Bulanan')?.amount || 0;
  const currentKeluarga = currentBreakdown.find(b => b.category === 'Kewajiban Keluarga')?.amount || 0;
  const currentDebt = currentBreakdown.find(b => b.category === 'Cicilan Hutang')?.amount || 0;
  const currentAsuransi = currentBreakdown.find(b => b.category === 'Asuransi')?.amount || 0;
  const currentLainnya = currentBreakdown.find(b => b.category === 'Lainnya')?.amount || 0;

  // Build recommended allocation
  const allocation: ExpenseBreakdown[] = [];

  // Essential expenses (kept from current)
  if (recommendedHousing > 0) {
    allocation.push({ category: 'Tempat Tinggal', amount: recommendedHousing, color: '#3b82f6' });
  }
  if (currentTagihan > 0) {
    allocation.push({ category: 'Tagihan', amount: currentTagihan, color: '#06b6d4' });
  }
  if (recommendedFood > 0) {
    allocation.push({ category: 'Makan & Minum', amount: recommendedFood, color: '#22c55e' });
  }
  if (currentBelanja > 0) {
    allocation.push({ category: 'Belanja Bulanan', amount: currentBelanja, color: '#84cc16' });
  }
  if (recommendedTransport > 0) {
    allocation.push({ category: 'Transportasi', amount: recommendedTransport, color: '#f59e0b' });
  }

  // Lifestyle (kept or slightly increased)
  if (recommendedLifestyle > 0) {
    allocation.push({ category: 'Gaya Hidup', amount: recommendedLifestyle, color: '#8b5cf6' });
  }

  // Subscriptions (kept from current)
  if (recommendedSubscriptions > 0) {
    allocation.push({ category: 'Langganan', amount: recommendedSubscriptions, color: '#ec4899' });
  }

  // Family obligations
  if (currentKeluarga > 0) {
    allocation.push({ category: 'Kewajiban Keluarga', amount: currentKeluarga, color: '#14b8a6' });
  }

  // Debt payments (if any)
  if (currentDebt > 0) {
    allocation.push({ category: 'Cicilan Hutang', amount: currentDebt, color: '#ef4444' });
  }

  // Insurance (current + recommended if lacking protection)
  const totalInsurance = currentAsuransi + insuranceRecommendation;
  if (totalInsurance > 0) {
    allocation.push({ category: 'Asuransi', amount: totalInsurance, color: '#0ea5e9' });
  }

  // Priority allocations for surplus
  if (emergencyContribution > 0) {
    allocation.push({ category: 'Dana Darurat', amount: emergencyContribution, color: '#10b981' });
  }
  if (investmentContribution > 0) {
    allocation.push({ category: 'Investasi', amount: investmentContribution, color: '#f97316' });
  }
  if (goalsContribution > 0) {
    allocation.push({ category: 'Tujuan Keuangan', amount: goalsContribution, color: '#a855f7' });
  }

  // Other
  if (currentLainnya > 0) {
    allocation.push({ category: 'Lainnya', amount: currentLainnya, color: '#6b7280' });
  }

  return allocation.filter(item => item.amount > 0);
};

export const calculateExpenseRatio = (data: UserFinancialData): number => {
  const income = calculateMonthlyIncome(data);
  if (income === 0) return 0;
  const expenses = calculateMonthlyExpenses(data) - calculateTotalMonthlyDebtPayments(data);
  return (expenses / income) * 100;
};

export const calculateSavingsRatio = (data: UserFinancialData): number => {
  const income = calculateMonthlyIncome(data);
  if (income === 0) return 0;
  const surplus = calculateMonthlySurplus(data);
  return Math.max(0, (surplus / income) * 100);
};

export const calculateDebtRatio = (data: UserFinancialData): number => {
  const income = calculateMonthlyIncome(data);
  if (income === 0) return 0;
  return (calculateTotalMonthlyDebtPayments(data) / income) * 100;
};

export const calculateSolvencyRatio = (data: UserFinancialData): number => {
  const assets = calculateTotalAssets(data);
  const liabilities = calculateTotalLiabilities(data);
  if (assets === 0) return liabilities === 0 ? 100 : 0;
  return ((assets - liabilities) / assets) * 100;
};

export const getStatusFromRatio = (
  ratio: number,
  type: 'expense' | 'savings' | 'debt' | 'solvency'
): 'healthy' | 'warning' | 'danger' => {
  switch (type) {
    case 'expense':
      if (ratio <= 50) return 'healthy';
      if (ratio <= 70) return 'warning';
      return 'danger';
    case 'savings':
      if (ratio >= 20) return 'healthy';
      if (ratio >= 10) return 'warning';
      return 'danger';
    case 'debt':
      if (ratio <= 30) return 'healthy';
      if (ratio <= 50) return 'warning';
      return 'danger';
    case 'solvency':
      if (ratio >= 50) return 'healthy';
      if (ratio >= 20) return 'warning';
      return 'danger';
    default:
      return 'warning';
  }
};

export const calculateHealthMetrics = (data: UserFinancialData): HealthMetric[] => {
  const expenseRatio = calculateExpenseRatio(data);
  const savingsRatio = calculateSavingsRatio(data);
  const debtRatio = calculateDebtRatio(data);
  const solvencyRatio = calculateSolvencyRatio(data);

  return [
    {
      name: 'Rasio Pengeluaran',
      value: expenseRatio,
      status: getStatusFromRatio(expenseRatio, 'expense'),
      description: 'Persentase pendapatan untuk pengeluaran',
      target: '< 50%',
    },
    {
      name: 'Rasio Tabungan',
      value: savingsRatio,
      status: getStatusFromRatio(savingsRatio, 'savings'),
      description: 'Persentase pendapatan yang ditabung',
      target: '> 20%',
    },
    {
      name: 'Rasio Hutang',
      value: debtRatio,
      status: getStatusFromRatio(debtRatio, 'debt'),
      description: 'Persentase cicilan dari pendapatan',
      target: '< 30%',
    },
    {
      name: 'Rasio Solvabilitas',
      value: solvencyRatio,
      status: getStatusFromRatio(solvencyRatio, 'solvency'),
      description: 'Kemampuan melunasi semua hutang',
      target: '> 50%',
    },
  ];
};

export const calculateEmergencyFundNeeded = (data: UserFinancialData): number => {
  const monthlyExpenses = calculateMonthlyExpenses(data);
  const { personalInfo } = data;

  let monthsNeeded = 3;

  if (personalInfo.statusPernikahan === 'menikah') {
    monthsNeeded = 6;
  }

  if (personalInfo.jumlahTanggungan >= 1) {
    monthsNeeded = Math.max(monthsNeeded, 6);
  }

  if (personalInfo.jumlahTanggungan >= 2) {
    monthsNeeded = 9;
  }

  if (personalInfo.jumlahTanggungan >= 3) {
    monthsNeeded = 12;
  }

  return monthlyExpenses * monthsNeeded;
};

export const calculateEmergencyFundCurrent = (data: UserFinancialData): number => {
  return data.emergencyFund.danaDaruratSaatIni;
};

export const calculateEmergencyFundMonthlyTarget = (data: UserFinancialData): number => {
  const needed = calculateEmergencyFundNeeded(data);
  const current = calculateEmergencyFundCurrent(data);
  const gap = needed - current;

  if (gap <= 0) return 0;

  // Target to reach in 12 months
  return Math.ceil(gap / 12);
};

export const calculateLifeInsuranceNeeded = (data: UserFinancialData): number => {
  const annualIncome = calculateMonthlyIncome(data) * 12;
  const { personalInfo } = data;

  let multiplier = 5;

  if (personalInfo.statusPernikahan === 'menikah') {
    multiplier = 7;
  }

  if (personalInfo.jumlahTanggungan >= 1) {
    multiplier = 10;
  }

  return annualIncome * multiplier;
};

// Generate debt payoff plan from debts array
export const generateDebtPayoffPlan = (data: UserFinancialData): DebtPayoffPlan[] => {
  const debtPlans: DebtPayoffPlan[] = data.debts.map((debt, index) => {
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

    // Priority based on interest rate (highest first - Avalanche method)
    const priorityByType: Record<string, number> = {
      kartu_kredit: 1,
      paylater: 2,
      pinjol_legal: 3,
      kta: 4,
      cicilan_hp: 5,
      kendaraan: 6,
      kpr: 7,
      lainnya: 8,
    };

    return {
      debtName: debtTypeLabels[debt.jenisHutang] || debt.jenisHutang,
      balance: debt.totalSisaHutang,
      monthlyPayment: debt.cicilanPerBulan,
      interestRate: debt.bungaPerTahun,
      payoffMonths: debt.sisaTenorBulan,
      totalInterest: (debt.totalSisaHutang * debt.bungaPerTahun / 100) * (debt.sisaTenorBulan / 12),
      priority: priorityByType[debt.jenisHutang] || 99,
    };
  });

  // Sort by priority (Avalanche method - highest interest first)
  return debtPlans.sort((a, b) => a.priority - b.priority);
};

export const generateInvestmentRecommendations = (
  data: UserFinancialData
): InvestmentRecommendation[] => {
  const surplus = calculateMonthlySurplus(data);
  const emergencyFundNeeded = calculateEmergencyFundNeeded(data);
  const emergencyFundCurrent = calculateEmergencyFundCurrent(data);

  // If emergency fund not complete, prioritize that
  if (emergencyFundCurrent < emergencyFundNeeded) {
    return [
      {
        instrument: 'Tabungan/Deposito',
        allocation: 80,
        description: 'Prioritaskan dana darurat terlebih dahulu',
        riskLevel: 'low',
        expectedReturn: '3-5% per tahun',
      },
      {
        instrument: 'Reksadana Pasar Uang',
        allocation: 20,
        description: 'Likuid dan stabil untuk dana darurat tambahan',
        riskLevel: 'low',
        expectedReturn: '4-6% per tahun',
      },
    ];
  }

  // Get risk profile from user
  const { riskProfile } = data;
  let riskLevel: 'konservatif' | 'moderat' | 'agresif' = 'moderat';

  if (riskProfile.toleransiRisiko === 'rendah') {
    riskLevel = 'konservatif';
  } else if (riskProfile.toleransiRisiko === 'tinggi') {
    riskLevel = 'agresif';
  }

  // Age-based adjustment
  if (data.personalInfo.usia > 50) {
    riskLevel = 'konservatif';
  } else if (data.personalInfo.usia > 40 && riskLevel === 'agresif') {
    riskLevel = 'moderat';
  }

  switch (riskLevel) {
    case 'konservatif':
      return [
        {
          instrument: 'Reksadana Pasar Uang',
          allocation: 40,
          description: 'Stabil dan likuid',
          riskLevel: 'low',
          expectedReturn: '4-6% per tahun',
        },
        {
          instrument: 'Reksadana Pendapatan Tetap',
          allocation: 40,
          description: 'Obligasi pemerintah dan korporasi',
          riskLevel: 'low',
          expectedReturn: '6-8% per tahun',
        },
        {
          instrument: 'Reksadana Campuran',
          allocation: 15,
          description: 'Kombinasi saham dan obligasi',
          riskLevel: 'medium',
          expectedReturn: '8-12% per tahun',
        },
        {
          instrument: 'Emas',
          allocation: 5,
          description: 'Lindung nilai inflasi',
          riskLevel: 'low',
          expectedReturn: '5-10% per tahun',
        },
      ];
    case 'moderat':
      return [
        {
          instrument: 'Reksadana Saham',
          allocation: 35,
          description: 'Indeks saham Indonesia (IDX30/LQ45)',
          riskLevel: 'high',
          expectedReturn: '10-15% per tahun',
        },
        {
          instrument: 'S&P 500 ETF (VOO/SPY)',
          allocation: 25,
          description: 'Diversifikasi global ke pasar AS',
          riskLevel: 'medium',
          expectedReturn: '8-12% per tahun',
        },
        {
          instrument: 'Reksadana Pendapatan Tetap',
          allocation: 25,
          description: 'Stabilitas portofolio',
          riskLevel: 'low',
          expectedReturn: '6-8% per tahun',
        },
        {
          instrument: 'Emas',
          allocation: 10,
          description: 'Lindung nilai',
          riskLevel: 'low',
          expectedReturn: '5-10% per tahun',
        },
        {
          instrument: 'Crypto (BTC/ETH)',
          allocation: 5,
          description: 'Spekulatif, high risk high reward',
          riskLevel: 'high',
          expectedReturn: 'Sangat volatil',
        },
      ];
    case 'agresif':
      return [
        {
          instrument: 'Reksadana Saham',
          allocation: 40,
          description: 'Saham pertumbuhan Indonesia',
          riskLevel: 'high',
          expectedReturn: '12-18% per tahun',
        },
        {
          instrument: 'S&P 500 ETF (VOO)',
          allocation: 20,
          description: 'Pasar saham AS',
          riskLevel: 'medium',
          expectedReturn: '8-12% per tahun',
        },
        {
          instrument: 'Nasdaq 100 ETF (QQQ)',
          allocation: 15,
          description: 'Saham teknologi AS',
          riskLevel: 'high',
          expectedReturn: '10-15% per tahun',
        },
        {
          instrument: 'Crypto (BTC/ETH)',
          allocation: 15,
          description: 'Aset digital',
          riskLevel: 'high',
          expectedReturn: 'Sangat volatil',
        },
        {
          instrument: 'Emerging Markets ETF (VWO)',
          allocation: 10,
          description: 'Diversifikasi negara berkembang',
          riskLevel: 'high',
          expectedReturn: '8-14% per tahun',
        },
      ];
  }
};

export const calculateGoalPlan = (
  goal: FinancialGoal,
  data: UserFinancialData
): GoalPlan => {
  const monthlyRequired = calculatePMT(goal.targetUang - goal.danaTerkumpul, goal.jangkaWaktuBulan, goal.tipeRisiko);
  const surplus = calculateMonthlySurplus(data);

  let recommendedInstruments: string[] = [];

  if (goal.jangkaWaktuBulan <= 12) {
    recommendedInstruments = ['Tabungan', 'Deposito', 'Reksadana Pasar Uang'];
  } else if (goal.jangkaWaktuBulan <= 36) {
    recommendedInstruments = ['Reksadana Pasar Uang', 'Reksadana Pendapatan Tetap'];
  } else if (goal.jangkaWaktuBulan <= 60) {
    recommendedInstruments = ['Reksadana Campuran', 'Reksadana Pendapatan Tetap'];
  } else {
    recommendedInstruments = ['Reksadana Saham', 'ETF (VOO, VTI)', 'Reksadana Campuran'];
  }

  if (goal.tipeRisiko === 'agresif' && goal.jangkaWaktuBulan > 36) {
    recommendedInstruments.push('Crypto (max 10%)');
  }

  const projectedCompletion = new Date();
  projectedCompletion.setMonth(projectedCompletion.getMonth() + goal.jangkaWaktuBulan);

  return {
    goalId: goal.id,
    goalName: goal.namaTujuan,
    targetAmount: goal.targetUang,
    currentAmount: goal.danaTerkumpul,
    monthlyRequired,
    timelineMonths: goal.jangkaWaktuBulan,
    recommendedInstruments,
    projectedCompletion,
    onTrack: surplus >= monthlyRequired,
  };
};

const calculatePMT = (
  futureValue: number,
  months: number,
  riskProfile: 'konservatif' | 'moderat' | 'agresif'
): number => {
  // Estimated annual return based on risk profile
  let annualReturn = 0.05; // 5% default

  switch (riskProfile) {
    case 'konservatif':
      annualReturn = 0.05;
      break;
    case 'moderat':
      annualReturn = 0.08;
      break;
    case 'agresif':
      annualReturn = 0.12;
      break;
  }

  const monthlyRate = annualReturn / 12;

  if (monthlyRate === 0) {
    return futureValue / months;
  }

  // PMT formula for future value
  const pmt = (futureValue * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1);

  return Math.ceil(pmt);
};

export const getOverallHealthScore = (data: UserFinancialData): number => {
  // Calculate critical and serious issue counts - same logic as Report grade
  let criticalCount = 0;
  let seriousCount = 0;
  let moderateCount = 0;

  const monthlyIncome = calculateMonthlyIncome(data);
  const monthlyExpenses = calculateMonthlyExpenses(data);
  const surplus = monthlyIncome - monthlyExpenses;
  const emergencyNeeded = calculateEmergencyFundNeeded(data);
  const emergencyCurrent = calculateEmergencyFundCurrent(data);
  const emergencyCoverage = emergencyNeeded > 0 ? (emergencyCurrent / emergencyNeeded) * 100 : 0;
  const dsr = calculateDebtRatio(data);
  const hasHealthInsurance = data.insurance.bpjs.punya || data.insurance.kesehatanSwasta.punya;
  const hasLifeInsurance = data.insurance.asuransiLainnya.some(ins => ins.jenisAsuransi === 'jiwa');

  // Check for critical issues
  if (surplus < 0) criticalCount++; // Negative cashflow
  if (emergencyCoverage < 25) criticalCount++; // Critical emergency fund

  // Check for serious issues
  if (emergencyCoverage >= 25 && emergencyCoverage < 50) seriousCount++; // Weak emergency fund
  if (dsr > 50) seriousCount++; // Dangerous debt
  if (!hasHealthInsurance) seriousCount++; // No health insurance
  if (data.personalInfo.jumlahTanggungan > 0 && !hasLifeInsurance) seriousCount++; // Family without protection

  // Check for moderate issues
  if (dsr > 30 && dsr <= 50) moderateCount++; // High debt ratio
  if (emergencyCoverage >= 50 && emergencyCoverage < 100) moderateCount++; // Incomplete emergency fund

  // Calculate score based on issue counts - aligned with Report grade logic
  // Grade F (0-39): 2+ critical
  // Grade D (40-54): 1 critical
  // Grade C (55-69): 2+ serious
  // Grade B (70-84): 1 serious
  // Grade A (85-100): no issues

  let score: number;
  if (criticalCount >= 2) {
    score = 20 + Math.max(0, 15 - criticalCount * 5); // F grade: 15-35
  } else if (criticalCount >= 1) {
    score = 40 + Math.max(0, 14 - seriousCount * 3); // D grade: 40-54
  } else if (seriousCount >= 2) {
    score = 55 + Math.max(0, 14 - seriousCount * 3); // C grade: 55-69
  } else if (seriousCount >= 1) {
    score = 70 + Math.max(0, 14 - moderateCount * 3); // B grade: 70-84
  } else {
    score = 85 + Math.max(0, 15 - moderateCount * 5); // A grade: 85-100
  }

  return Math.min(100, Math.max(0, score));
};
