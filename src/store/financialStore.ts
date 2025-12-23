import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserFinancialData,
  PersonalInfo,
  IncomeInfo,
  ExpenseInfo,
  DebtItem,
  EmergencyFundInfo,
  AssetInfo,
  InsuranceInfo,
  FinancialGoal,
  RiskProfileInfo,
  CustomExpense,
  HealthInsuranceBenefit,
  OtherInsuranceItem
} from '@/types/finance';
import { AdvisorReport, generateAdvisorReport } from '@/lib/financialAdvisor';
import { getOverallHealthScore, calculateNetWorth } from '@/lib/calculations';

// ============================================
// SESSION SNAPSHOT TYPES
// ============================================

export interface SessionSnapshot {
  id: string;
  createdAt: string;
  userName: string;
  userData: UserFinancialData; // Immutable copy
  summary: {
    score: number;
    netWorth: number;
    keyFocus: string[];
  };
  advisorReport: AdvisorReport;
  pdfFileName: string;
}

// ============================================
// DEFAULT VALUES
// ============================================

const defaultPersonalInfo: PersonalInfo = {
  namaLengkap: '',
  usia: 25,
  statusPernikahan: 'lajang',
  jumlahTanggungan: 0,
  domisili: '',
  pekerjaan: '',
  statusPekerjaan: 'karyawan',
};

const defaultIncomeInfo: IncomeInfo = {
  gajiBulanan: 0,
  tunjanganBulanan: 0,
  bonusRataPerTahun: 0,
  penghasilanPasangan: 0,
  penghasilanTambahan: 0,
  dividenTahunan: 0,
  hasilUsahaTahunan: 0,
  penghasilanPasifLainnya: 0,
};

const defaultSubscriptionItem = { aktif: false, biayaBulanan: 0 };

const defaultExpenseInfo: ExpenseInfo = {
  tempatTinggal: {
    tipe: 'kost',
    biayaSewa: 0,
    listrik: 0,
    air: 0,
    internet: 0,
    keperluanRumahTangga: 0,
  },
  konsumsi: {
    makanHarian: 0,
    jajanNgopi: 0,
    belanjaDapur: 0,
  },
  transportasi: {
    transportHarian: 0,
    parkir: 0,
    servisKendaraan: 0,
  },
  kesehatanLifestyle: {
    vitaminSuplemen: 0,
    gymFitness: 0,
    hiburan: 0,
  },
  komunikasiSubscriptions: {
    pulsaPaketData: 0,
    spotify: { ...defaultSubscriptionItem },
    netflix: { ...defaultSubscriptionItem },
    youtubePremium: { ...defaultSubscriptionItem },
    googleStorage: { ...defaultSubscriptionItem },
    appleIcloud: { ...defaultSubscriptionItem },
    amazonPrime: { ...defaultSubscriptionItem },
    lainnyaNama: '',
    lainnyaBiaya: 0,
  },
  kewajibanKeluarga: {
    uangSekolahAnak: 0,
    sppDaycare: 0,
    biayaTakTerduga: 0,
  },
};

const defaultEmergencyFundInfo: EmergencyFundInfo = {
  danaDaruratSaatIni: 0,
  tipePenyimpanan: 'tabungan',
  frekuensiMenambah: 'bulanan',
  jumlahPenambahan: 0,
};

const defaultAssetInfo: AssetInfo = {
  kasLikuid: {
    tabunganBank: 0,
    deposito: 0,
    eWallet: 0,
    uangTunai: 0,
  },
  investasi: {
    reksadanaPasarUang: 0,
    reksadanaObligasi: 0,
    reksadanaSaham: 0,
    sahamIndonesia: 0,
    sahamUSETF: 0,
    kripto: 0,
    obligasiNegara: 0,
    emas: 0,
    lainnyaNama: '',
    lainnyaNilai: 0,
  },
  asetRiil: {
    properti: 0,
    kendaraan: 0,
    barangBerharga: 0,
  },
};

const defaultInsuranceInfo: InsuranceInfo = {
  bpjs: {
    punya: false,
    kelas: '',
    iuranBulanan: 0,
    jumlahAnggotaDitanggung: 0,
  },
  kesehatanSwasta: {
    punya: false,
    namaPerusahaan: '',
    namaProduk: '',
    premiBulanan: 0,
    manfaat: [],
  },
  asuransiLainnya: [],
};

const defaultRiskProfileInfo: RiskProfileInfo = {
  toleransiRisiko: 'sedang',
  pengalamanInvestasi: 'pemula',
  reaksiPenurunan: 'diam',
  tujuanInvestasi: 'jangka_menengah',
};

// ============================================
// STORE INTERFACE
// ============================================

interface FinancialStore {
  // Form state
  currentStep: number;
  isOnboardingComplete: boolean;
  data: UserFinancialData;

  // Session state
  completedSessions: SessionSnapshot[];
  currentSessionId: string | null;

  // Form actions
  setCurrentStep: (step: number) => void;
  setPersonalInfo: (info: Partial<PersonalInfo>) => void;
  setIncomeInfo: (info: Partial<IncomeInfo>) => void;
  setExpenseInfo: (info: Partial<ExpenseInfo>) => void;
  setEmergencyFundInfo: (info: Partial<EmergencyFundInfo>) => void;
  setAssetInfo: (info: Partial<AssetInfo>) => void;
  setInsuranceInfo: (info: Partial<InsuranceInfo>) => void;
  setRiskProfileInfo: (info: Partial<RiskProfileInfo>) => void;
  setFinancialStory: (story: string) => void;
  addDebt: (debt: DebtItem) => void;
  updateDebt: (debtId: string, debt: Partial<DebtItem>) => void;
  removeDebt: (debtId: string) => void;
  addGoal: (goal: FinancialGoal) => void;
  updateGoal: (goalId: string, goal: Partial<FinancialGoal>) => void;
  removeGoal: (goalId: string) => void;
  addCustomExpense: (expense: CustomExpense) => void;
  removeCustomExpense: (expenseId: string) => void;
  addHealthBenefit: (benefit: HealthInsuranceBenefit) => void;
  removeHealthBenefit: (benefitId: string) => void;
  addOtherInsurance: (insurance: OtherInsuranceItem) => void;
  removeOtherInsurance: (insuranceId: string) => void;
  completeOnboarding: () => void;
  resetData: () => void;

  // Session actions
  createSessionSnapshot: () => string; // Returns session ID
  resetFormForNewUser: () => void;
  setCurrentSession: (id: string | null) => void;
  clearCurrentSession: () => void;
  getActiveSession: () => SessionSnapshot | null;
  deleteSession: (id: string) => void;
}

const getDefaultData = (): UserFinancialData => ({
  personalInfo: defaultPersonalInfo,
  income: defaultIncomeInfo,
  expenses: defaultExpenseInfo,
  customExpenses: [],
  debts: [],
  emergencyFund: defaultEmergencyFundInfo,
  assets: defaultAssetInfo,
  insurance: defaultInsuranceInfo,
  financialGoals: [],
  riskProfile: defaultRiskProfileInfo,
  financialStory: '',
});

// Helper to generate unique ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper to deep clone data (immutable copy)
const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Helper to safely merge stored data with defaults
const mergeWithDefaults = (storedData: Partial<UserFinancialData> | undefined): UserFinancialData => {
  const defaults = getDefaultData();
  if (!storedData) return defaults;

  return {
    personalInfo: { ...defaults.personalInfo, ...storedData.personalInfo },
    income: { ...defaults.income, ...storedData.income },
    expenses: {
      tempatTinggal: { ...defaults.expenses.tempatTinggal, ...storedData.expenses?.tempatTinggal },
      konsumsi: { ...defaults.expenses.konsumsi, ...storedData.expenses?.konsumsi },
      transportasi: { ...defaults.expenses.transportasi, ...storedData.expenses?.transportasi },
      kesehatanLifestyle: { ...defaults.expenses.kesehatanLifestyle, ...storedData.expenses?.kesehatanLifestyle },
      komunikasiSubscriptions: {
        ...defaults.expenses.komunikasiSubscriptions,
        ...storedData.expenses?.komunikasiSubscriptions,
        spotify: { ...defaultSubscriptionItem, ...storedData.expenses?.komunikasiSubscriptions?.spotify },
        netflix: { ...defaultSubscriptionItem, ...storedData.expenses?.komunikasiSubscriptions?.netflix },
        youtubePremium: { ...defaultSubscriptionItem, ...storedData.expenses?.komunikasiSubscriptions?.youtubePremium },
        googleStorage: { ...defaultSubscriptionItem, ...storedData.expenses?.komunikasiSubscriptions?.googleStorage },
        appleIcloud: { ...defaultSubscriptionItem, ...storedData.expenses?.komunikasiSubscriptions?.appleIcloud },
        amazonPrime: { ...defaultSubscriptionItem, ...storedData.expenses?.komunikasiSubscriptions?.amazonPrime },
      },
      kewajibanKeluarga: { ...defaults.expenses.kewajibanKeluarga, ...storedData.expenses?.kewajibanKeluarga },
    },
    customExpenses: storedData.customExpenses || [],
    debts: storedData.debts || [],
    emergencyFund: { ...defaults.emergencyFund, ...storedData.emergencyFund },
    assets: {
      kasLikuid: { ...defaults.assets.kasLikuid, ...storedData.assets?.kasLikuid },
      investasi: { ...defaults.assets.investasi, ...storedData.assets?.investasi },
      asetRiil: { ...defaults.assets.asetRiil, ...storedData.assets?.asetRiil },
    },
    insurance: {
      bpjs: { ...defaults.insurance.bpjs, ...storedData.insurance?.bpjs },
      kesehatanSwasta: {
        ...defaults.insurance.kesehatanSwasta,
        ...storedData.insurance?.kesehatanSwasta,
        manfaat: storedData.insurance?.kesehatanSwasta?.manfaat || [],
      },
      asuransiLainnya: storedData.insurance?.asuransiLainnya || [],
    },
    financialGoals: storedData.financialGoals || [],
    riskProfile: { ...defaults.riskProfile, ...storedData.riskProfile },
    financialStory: storedData.financialStory || '',
  };
};

export const useFinancialStore = create<FinancialStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 1,
      isOnboardingComplete: false,
      data: getDefaultData(),
      completedSessions: [],
      currentSessionId: null,

      // Form actions
      setCurrentStep: (step) => set({ currentStep: step }),
      setPersonalInfo: (info) =>
        set((state) => ({
          data: {
            ...state.data,
            personalInfo: { ...state.data.personalInfo, ...info },
          },
        })),
      setIncomeInfo: (info) =>
        set((state) => ({
          data: {
            ...state.data,
            income: { ...state.data.income, ...info },
          },
        })),
      setExpenseInfo: (info) =>
        set((state) => ({
          data: {
            ...state.data,
            expenses: { ...state.data.expenses, ...info },
          },
        })),
      setEmergencyFundInfo: (info) =>
        set((state) => ({
          data: {
            ...state.data,
            emergencyFund: { ...state.data.emergencyFund, ...info },
          },
        })),
      setAssetInfo: (info) =>
        set((state) => ({
          data: {
            ...state.data,
            assets: { ...state.data.assets, ...info },
          },
        })),
      setInsuranceInfo: (info) =>
        set((state) => ({
          data: {
            ...state.data,
            insurance: { ...state.data.insurance, ...info },
          },
        })),
      setRiskProfileInfo: (info) =>
        set((state) => ({
          data: {
            ...state.data,
            riskProfile: { ...state.data.riskProfile, ...info },
          },
        })),
      setFinancialStory: (story) =>
        set((state) => ({
          data: {
            ...state.data,
            financialStory: story,
          },
        })),
      addDebt: (debt) =>
        set((state) => ({
          data: {
            ...state.data,
            debts: [...state.data.debts, debt],
          },
        })),
      updateDebt: (debtId, debt) =>
        set((state) => ({
          data: {
            ...state.data,
            debts: state.data.debts.map((d) =>
              d.id === debtId ? { ...d, ...debt } : d
            ),
          },
        })),
      removeDebt: (debtId) =>
        set((state) => ({
          data: {
            ...state.data,
            debts: state.data.debts.filter((d) => d.id !== debtId),
          },
        })),
      addGoal: (goal) =>
        set((state) => ({
          data: {
            ...state.data,
            financialGoals: [...state.data.financialGoals, goal],
          },
        })),
      updateGoal: (goalId, goal) =>
        set((state) => ({
          data: {
            ...state.data,
            financialGoals: state.data.financialGoals.map((g) =>
              g.id === goalId ? { ...g, ...goal } : g
            ),
          },
        })),
      removeGoal: (goalId) =>
        set((state) => ({
          data: {
            ...state.data,
            financialGoals: state.data.financialGoals.filter((g) => g.id !== goalId),
          },
        })),
      addCustomExpense: (expense) =>
        set((state) => ({
          data: {
            ...state.data,
            customExpenses: [...state.data.customExpenses, expense],
          },
        })),
      removeCustomExpense: (expenseId) =>
        set((state) => ({
          data: {
            ...state.data,
            customExpenses: state.data.customExpenses.filter((e) => e.id !== expenseId),
          },
        })),
      addHealthBenefit: (benefit) =>
        set((state) => ({
          data: {
            ...state.data,
            insurance: {
              ...state.data.insurance,
              kesehatanSwasta: {
                ...state.data.insurance.kesehatanSwasta,
                manfaat: [...state.data.insurance.kesehatanSwasta.manfaat, benefit],
              },
            },
          },
        })),
      removeHealthBenefit: (benefitId) =>
        set((state) => ({
          data: {
            ...state.data,
            insurance: {
              ...state.data.insurance,
              kesehatanSwasta: {
                ...state.data.insurance.kesehatanSwasta,
                manfaat: state.data.insurance.kesehatanSwasta.manfaat.filter((b) => b.id !== benefitId),
              },
            },
          },
        })),
      addOtherInsurance: (insurance) =>
        set((state) => ({
          data: {
            ...state.data,
            insurance: {
              ...state.data.insurance,
              asuransiLainnya: [...state.data.insurance.asuransiLainnya, insurance],
            },
          },
        })),
      removeOtherInsurance: (insuranceId) =>
        set((state) => ({
          data: {
            ...state.data,
            insurance: {
              ...state.data.insurance,
              asuransiLainnya: state.data.insurance.asuransiLainnya.filter((i) => i.id !== insuranceId),
            },
          },
        })),
      completeOnboarding: () => set({ isOnboardingComplete: true }),
      resetData: () =>
        set({
          currentStep: 1,
          isOnboardingComplete: false,
          data: getDefaultData(),
        }),

      // ============================================
      // SESSION ACTIONS
      // ============================================

      createSessionSnapshot: () => {
        const state = get();
        const sessionId = generateSessionId();
        const userData = deepClone(state.data);
        const userName = userData.personalInfo.namaLengkap || 'User';
        const dateStr = new Date().toISOString().split('T')[0];

        // Generate advisor report
        const advisorReport = generateAdvisorReport(userData);

        // Calculate summary
        const score = getOverallHealthScore(userData);
        const netWorth = calculateNetWorth(userData);
        const keyFocus = advisorReport.priorityIssues
          .filter(issue => issue.classification === 'KRITIS' || issue.classification === 'PENTING')
          .slice(0, 3)
          .map(issue => issue.issue);

        const snapshot: SessionSnapshot = {
          id: sessionId,
          createdAt: new Date().toISOString(),
          userName,
          userData,
          summary: {
            score,
            netWorth,
            keyFocus,
          },
          advisorReport,
          pdfFileName: `Laporan-Keuangan-${userName}-${dateStr}.pdf`,
        };

        set((state) => ({
          completedSessions: [...state.completedSessions, snapshot],
          currentSessionId: sessionId,
          isOnboardingComplete: true,
        }));

        return sessionId;
      },

      resetFormForNewUser: () => {
        set({
          currentStep: 1,
          isOnboardingComplete: false,
          data: getDefaultData(),
          currentSessionId: null, // Clear current session so user sees fresh state
          // completedSessions are preserved for potential history
        });
      },

      setCurrentSession: (id) => {
        set({ currentSessionId: id });
      },

      clearCurrentSession: () => {
        set({ currentSessionId: null });
      },

      getActiveSession: () => {
        const state = get();
        if (!state.currentSessionId) return null;
        return state.completedSessions.find(s => s.id === state.currentSessionId) || null;
      },

      deleteSession: (id) => {
        set((state) => ({
          completedSessions: state.completedSessions.filter(s => s.id !== id),
          currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
        }));
      },
    }),
    {
      name: 'youth-finance-storage',
      version: 4, // Increment version for migration
      migrate: (persistedState: any, version: number) => {
        if (version < 4) {
          // Migrate to new structure with sessions
          return {
            currentStep: 1,
            isOnboardingComplete: persistedState?.isOnboardingComplete || false,
            data: persistedState?.data || getDefaultData(),
            completedSessions: [],
            currentSessionId: null,
          };
        }
        return persistedState as FinancialStore;
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<FinancialStore>;
        return {
          ...currentState,
          currentStep: persisted?.currentStep ?? currentState.currentStep,
          isOnboardingComplete: persisted?.isOnboardingComplete ?? currentState.isOnboardingComplete,
          data: mergeWithDefaults(persisted?.data),
          completedSessions: persisted?.completedSessions ?? [],
          currentSessionId: persisted?.currentSessionId ?? null,
        };
      },
    }
  )
);
