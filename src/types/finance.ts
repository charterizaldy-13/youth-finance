// ====================================================
// 1. IDENTITAS DIRI
// ====================================================
export interface PersonalInfo {
  namaLengkap: string;
  usia: number;
  statusPernikahan: 'lajang' | 'menikah' | 'cerai';
  jumlahTanggungan: number;
  domisili: string;
  pekerjaan: string;
  statusPekerjaan: 'karyawan' | 'freelancer' | 'pengusaha' | 'tidak_bekerja';
}

// ====================================================
// 2. PENDAPATAN
// ====================================================
export interface IncomeInfo {
  // Penghasilan rutin bulanan
  gajiBulanan: number;
  tunjanganBulanan: number;
  bonusRataPerTahun: number;
  penghasilanPasangan: number;
  penghasilanTambahan: number;
  // Penghasilan tidak rutin
  dividenTahunan: number;
  hasilUsahaTahunan: number;
  penghasilanPasifLainnya: number;
}

// ====================================================
// SUBSCRIPTION DETAIL
// ====================================================
export interface SubscriptionItem {
  aktif: boolean;
  biayaBulanan: number;
}

export interface SubscriptionsInfo {
  pulsaPaketData: number;
  spotify: SubscriptionItem;
  netflix: SubscriptionItem;
  youtubePremium: SubscriptionItem;
  googleStorage: SubscriptionItem;
  appleIcloud: SubscriptionItem;
  amazonPrime: SubscriptionItem;
  lainnyaNama: string;
  lainnyaBiaya: number;
}

// ====================================================
// CUSTOM EXPENSE
// ====================================================
export interface CustomExpense {
  id: string;
  nama: string;
  kategori: 'rumah' | 'konsumsi' | 'transportasi' | 'kesehatan' | 'lifestyle' | 'keluarga' | 'lainnya';
  frekuensi: 'harian' | 'mingguan' | 'bulanan' | 'tahunan';
  nominal: number;
}

// ====================================================
// 3. PENGELUARAN BULANAN (RINCI)
// ====================================================
export interface ExpenseInfo {
  tempatTinggal: {
    tipe: 'sewa_rumah' | 'kontrakan' | 'kost' | 'milik_sendiri';
    biayaSewa: number;
    listrik: number;
    air: number;
    internet: number;
    keperluanRumahTangga: number;
  };
  konsumsi: {
    makanHarian: number;
    jajanNgopi: number;
    belanjaDapur: number;
  };
  transportasi: {
    transportHarian: number;
    parkir: number;
    servisKendaraan: number;
  };
  kesehatanLifestyle: {
    vitaminSuplemen: number;
    gymFitness: number;
    hiburan: number;
  };
  komunikasiSubscriptions: SubscriptionsInfo;
  kewajibanKeluarga: {
    uangSekolahAnak: number;
    sppDaycare: number;
    biayaTakTerduga: number;
  };
}

// ====================================================
// 4. HUTANG & CICILAN (RINCI)
// ====================================================
export interface DebtItem {
  id: string;
  jenisHutang: 'kta' | 'paylater' | 'kartu_kredit' | 'pinjol_legal' | 'cicilan_hp' | 'kendaraan' | 'kpr' | 'lainnya';
  totalSisaHutang: number;
  bungaPerTahun: number;
  cicilanPerBulan: number;
  sisaTenorBulan: number;
}

// ====================================================
// 5. DANA DARURAT
// ====================================================
export interface EmergencyFundInfo {
  danaDaruratSaatIni: number;
  tipePenyimpanan: 'tabungan' | 'deposito' | 'money_market' | 'lainnya';
  frekuensiMenambah: 'bulanan' | 'tidak_rutin';
  jumlahPenambahan: number;
}

// ====================================================
// 6. ASET (RINCI)
// ====================================================
export interface AssetInfo {
  kasLikuid: {
    tabunganBank: number;
    deposito: number;
    eWallet: number;
    uangTunai: number;
  };
  investasi: {
    reksadanaPasarUang: number;
    reksadanaObligasi: number;
    reksadanaSaham: number;
    sahamIndonesia: number;
    sahamUSETF: number;
    kripto: number;
    obligasiNegara: number;
    emas: number;
    lainnyaNama: string;
    lainnyaNilai: number;
  };
  asetRiil: {
    properti: number;
    kendaraan: number;
    barangBerharga: number;
  };
}

// ====================================================
// BPJS KESEHATAN DETAIL
// ====================================================
export interface BPJSInfo {
  punya: boolean;
  kelas: 'kelas_1' | 'kelas_2' | 'kelas_3' | '';
  iuranBulanan: number;
  jumlahAnggotaDitanggung: number;
}

// ====================================================
// MANFAAT ASURANSI KESEHATAN SWASTA
// ====================================================
export interface HealthInsuranceBenefit {
  id: string;
  namaManfaat: string;
  limitPerTahun: number;
  sistemKlaim: 'cashless' | 'reimbursement';
  catatan: string;
}

// ====================================================
// ASURANSI KESEHATAN SWASTA DETAIL
// ====================================================
export interface PrivateHealthInsurance {
  punya: boolean;
  namaPerusahaan: string;
  namaProduk: string;
  premiBulanan: number;
  manfaat: HealthInsuranceBenefit[];
}

// ====================================================
// ASURANSI LAINNYA DETAIL
// ====================================================
export interface OtherInsuranceItem {
  id: string;
  jenisAsuransi: 'jiwa' | 'penyakit_kritis' | 'kecelakaan' | 'pendidikan' | 'properti' | 'kendaraan' | 'lainnya';
  namaPerusahaan: string;
  namaProduk: string;
  premiBulanan: number;
  manfaatUtama: string;
  nilaiManfaat: number;
  masaPertanggunganTahun: number;
}

// ====================================================
// 7. ASURANSI
// ====================================================
export interface InsuranceInfo {
  bpjs: BPJSInfo;
  kesehatanSwasta: PrivateHealthInsurance;
  asuransiLainnya: OtherInsuranceItem[];
}

// ====================================================
// 8. TUJUAN KEUANGAN
// ====================================================

export type KategoriTujuan =
  | 'pernikahan'
  | 'rumah'
  | 'kendaraan'
  | 'liburan'
  | 'ibadah'
  | 'pendidikan'
  | 'pensiun'
  | 'barang'
  | 'lainnya';

export const KATEGORI_TUJUAN_OPTIONS: { value: KategoriTujuan; label: string }[] = [
  { value: 'pernikahan', label: 'Dana Pernikahan' },
  { value: 'rumah', label: 'Dana Pembelian Rumah' },
  { value: 'kendaraan', label: 'Dana Pembelian Kendaraan' },
  { value: 'liburan', label: 'Dana Liburan' },
  { value: 'ibadah', label: 'Dana Perjalanan Ibadah (Haji/Umroh)' },
  { value: 'pendidikan', label: 'Dana Pendidikan' },
  { value: 'pensiun', label: 'Dana Pensiun' },
  { value: 'barang', label: 'Dana Beli Barang' },
  { value: 'lainnya', label: 'Tujuan Lainnya' },
];

export interface FinancialGoal {
  id: string;
  kategoriTujuan: KategoriTujuan;
  namaTujuan: string; // Custom name or item name for 'barang'/'lainnya'
  targetUang: number;
  jangkaWaktuBulan: number;
  prioritas: 'tinggi' | 'sedang' | 'rendah';
  tipeRisiko: 'konservatif' | 'moderat' | 'agresif';
  danaTerkumpul: number;
}

// ====================================================
// 9. PROFIL RISIKO
// ====================================================
export interface RiskProfileInfo {
  toleransiRisiko: 'rendah' | 'sedang' | 'tinggi';
  pengalamanInvestasi: 'pemula' | 'menengah' | 'ahli';
  reaksiPenurunan: 'panik_jual' | 'diam' | 'beli_lagi';
  tujuanInvestasi: 'jangka_pendek' | 'jangka_menengah' | 'jangka_panjang';
}

// ====================================================
// COMPLETE USER DATA
// ====================================================
export interface UserFinancialData {
  personalInfo: PersonalInfo;
  income: IncomeInfo;
  expenses: ExpenseInfo;
  customExpenses: CustomExpense[];
  debts: DebtItem[];
  emergencyFund: EmergencyFundInfo;
  assets: AssetInfo;
  insurance: InsuranceInfo;
  financialGoals: FinancialGoal[];
  riskProfile: RiskProfileInfo;
  financialStory: string;
}

// ====================================================
// HEALTH METRICS & CALCULATIONS
// ====================================================
export interface HealthMetric {
  name: string;
  value: number;
  status: 'healthy' | 'warning' | 'danger';
  description: string;
  target?: string;
}

export interface DebtPayoffPlan {
  debtName: string;
  balance: number;
  monthlyPayment: number;
  interestRate: number;
  payoffMonths: number;
  totalInterest: number;
  priority: number;
}

export interface InvestmentRecommendation {
  instrument: string;
  allocation: number;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: string;
}

export interface GoalPlan {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  monthlyRequired: number;
  timelineMonths: number;
  recommendedInstruments: string[];
  projectedCompletion: Date;
  onTrack: boolean;
}
