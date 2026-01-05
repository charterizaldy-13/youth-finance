import { useState, useEffect } from "react";
import { GeneratingLoader } from "@/components/ui/generating-loader";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFinancialStore } from "@/store/financialStore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import logo from "@/assets/logo.png";
import {
  User,
  Wallet,
  Receipt,
  CreditCard,
  PiggyBank,
  Building2,
  Shield,
  Target,
  BarChart3,
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  X,
  MessageSquare,
  AlertTriangle,
  Info
} from "lucide-react";
import type { FinancialGoal, DebtItem, CustomExpense, HealthInsuranceBenefit, OtherInsuranceItem } from "@/types/finance";
import { KATEGORI_TUJUAN_OPTIONS } from "@/types/finance";

const steps = [
  { icon: User, title: "Identitas Diri", description: "Data pribadi Anda" },
  { icon: Wallet, title: "Pendapatan", description: "Penghasilan rutin & tidak rutin" },
  { icon: Receipt, title: "Pengeluaran", description: "Pengeluaran bulanan rinci" },
  { icon: CreditCard, title: "Hutang & Cicilan", description: "Kewajiban finansial" },
  { icon: PiggyBank, title: "Dana Darurat", description: "Simpanan darurat" },
  { icon: Building2, title: "Aset", description: "Harta yang Anda miliki" },
  { icon: Shield, title: "Asuransi", description: "Proteksi keuangan" },
  { icon: Target, title: "Tujuan Keuangan", description: "Goals finansial Anda" },
  { icon: BarChart3, title: "Profil Risiko", description: "Toleransi investasi" },
  { icon: MessageSquare, title: "Cerita Keuangan", description: "Kondisi & harapan Anda" },
];

const formatNumber = (value: string): string => {
  const num = value.replace(/\D/g, '');
  return num ? parseInt(num).toLocaleString('id-ID') : '';
};

const parseNumber = (value: string): number => {
  return parseInt(value.replace(/\D/g, '')) || 0;
};

// Convert expense to monthly
const toMonthly = (amount: number, frequency: 'harian' | 'mingguan' | 'bulanan' | 'tahunan'): number => {
  switch (frequency) {
    case 'harian': return amount * 30;
    case 'mingguan': return amount * 4;
    case 'bulanan': return amount;
    case 'tahunan': return amount / 12;
    default: return amount;
  }
};

// Reusable Number Input Component with frequency and tooltip
const NumberInput = ({
  id,
  label,
  value,
  onChange,
  placeholder = "0",
  frequency,
  tooltip
}: {
  id: string;
  label: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  frequency?: 'bulan' | 'tahun' | 'hari' | 'minggu';
  tooltip?: string;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Label htmlFor={id}>{label}</Label>
      {frequency && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          /{frequency}
        </span>
      )}
      {tooltip && (
        <div className="relative group">
          <Info size={14} className="text-muted-foreground cursor-help hover:text-accent transition-colors" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {tooltip}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover" />
          </div>
        </div>
      )}
    </div>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
      <Input
        id={id}
        className="pl-10"
        value={formatNumber(value.toString())}
        onChange={(e) => onChange(parseNumber(e.target.value))}
        placeholder={placeholder}
      />
    </div>
  </div>
);

// Section Title Component
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-semibold text-lg border-b pb-2 mb-4">{children}</h3>
);

const Onboarding = () => {
  const navigate = useNavigate();
  const {
    currentStep,
    setCurrentStep,
    data,
    setPersonalInfo,
    setIncomeInfo,
    setExpenseInfo,
    setEmergencyFundInfo,
    setAssetInfo,
    setInsuranceInfo,
    setRiskProfileInfo,
    setFinancialStory,
    addDebt,
    removeDebt,
    addGoal,
    removeGoal,
    addCustomExpense,
    removeCustomExpense,
    addHealthBenefit,
    removeHealthBenefit,
    addOtherInsurance,
    removeOtherInsurance,
    createSessionSnapshot,
  } = useFinancialStore();

  const [newGoal, setNewGoal] = useState<Partial<FinancialGoal>>({
    kategoriTujuan: 'pernikahan',
    namaTujuan: '',
    targetUang: 0,
    jangkaWaktuBulan: 12,
    prioritas: 'sedang',
    tipeRisiko: 'moderat',
    danaTerkumpul: 0,
  });

  const [newDebt, setNewDebt] = useState<Partial<DebtItem>>({
    jenisHutang: 'kta',
    totalSisaHutang: 0,
    bungaPerTahun: 0,
    cicilanPerBulan: 0,
    sisaTenorBulan: 12,
  });

  const [newCustomExpense, setNewCustomExpense] = useState<Partial<CustomExpense>>({
    nama: '',
    kategori: 'lainnya',
    frekuensi: 'bulanan',
    nominal: 0,
  });

  const [newHealthBenefit, setNewHealthBenefit] = useState<Partial<HealthInsuranceBenefit>>({
    namaManfaat: '',
    limitPerTahun: 0,
    sistemKlaim: 'cashless',
    catatan: '',
  });

  const [newOtherInsurance, setNewOtherInsurance] = useState<Partial<OtherInsuranceItem>>({
    jenisAsuransi: 'jiwa',
    namaPerusahaan: '',
    namaProduk: '',
    premiBulanan: 0,
    manfaatUtama: '',
    nilaiManfaat: 0,
    masaPertanggunganTahun: 10,
  });

  // Loading state for form completion
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate totals for validation
  const calculateTotalIncome = () => {
    const { gajiBulanan, tunjanganBulanan, bonusRataPerTahun, penghasilanPasangan, penghasilanTambahan, dividenTahunan, hasilUsahaTahunan, penghasilanPasifLainnya } = data.income;
    return gajiBulanan + tunjanganBulanan + (bonusRataPerTahun / 12) + penghasilanPasangan + penghasilanTambahan + (dividenTahunan / 12) + (hasilUsahaTahunan / 12) + (penghasilanPasifLainnya / 12);
  };

  const calculateTotalExpenses = () => {
    const { tempatTinggal, konsumsi, transportasi, kesehatanLifestyle, komunikasiSubscriptions, kewajibanKeluarga } = data.expenses;

    let total = 0;

    // Tempat Tinggal
    total += tempatTinggal.biayaSewa + tempatTinggal.listrik + tempatTinggal.air + tempatTinggal.internet + tempatTinggal.keperluanRumahTangga;

    // Konsumsi (daily to monthly)
    total += (konsumsi.makanHarian * 30) + (konsumsi.jajanNgopi * 30) + konsumsi.belanjaDapur;

    // Transportasi
    total += (transportasi.transportHarian * 30) + (transportasi.parkir * 30) + transportasi.servisKendaraan;

    // Kesehatan & Lifestyle
    total += kesehatanLifestyle.vitaminSuplemen + kesehatanLifestyle.gymFitness + kesehatanLifestyle.hiburan;

    // Subscriptions
    total += komunikasiSubscriptions.pulsaPaketData;
    if (komunikasiSubscriptions.spotify.aktif) total += komunikasiSubscriptions.spotify.biayaBulanan;
    if (komunikasiSubscriptions.netflix.aktif) total += komunikasiSubscriptions.netflix.biayaBulanan;
    if (komunikasiSubscriptions.youtubePremium.aktif) total += komunikasiSubscriptions.youtubePremium.biayaBulanan;
    if (komunikasiSubscriptions.googleStorage.aktif) total += komunikasiSubscriptions.googleStorage.biayaBulanan;
    if (komunikasiSubscriptions.appleIcloud.aktif) total += komunikasiSubscriptions.appleIcloud.biayaBulanan;
    if (komunikasiSubscriptions.amazonPrime.aktif) total += komunikasiSubscriptions.amazonPrime.biayaBulanan;
    total += komunikasiSubscriptions.lainnyaBiaya;

    // Kewajiban Keluarga
    total += kewajibanKeluarga.uangSekolahAnak + kewajibanKeluarga.sppDaycare;

    // Custom Expenses
    data.customExpenses.forEach(expense => {
      total += toMonthly(expense.nominal, expense.frekuensi);
    });

    // BPJS
    if (data.insurance.bpjs.punya) {
      total += data.insurance.bpjs.iuranBulanan;
    }

    return total;
  };

  const totalIncome = calculateTotalIncome();
  const totalExpenses = calculateTotalExpenses();
  const showExpenseWarning = totalExpenses > totalIncome && totalIncome > 0;

  const handleNext = () => {
    if (currentStep < 10) {
      setCurrentStep(currentStep + 1);
    } else {
      // Show loading animation before navigating
      setIsGenerating(true);
      // Create immutable session snapshot with advisor report
      createSessionSnapshot();
      // Wait 4 seconds for loading animation effect
      setTimeout(() => {
        navigate('/dashboard');
      }, 4000);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddGoal = () => {
    if (newGoal.kategoriTujuan && newGoal.targetUang && newGoal.targetUang > 0) {
      // Get display name from category
      const categoryLabel = KATEGORI_TUJUAN_OPTIONS.find(
        opt => opt.value === newGoal.kategoriTujuan
      )?.label || '';

      const goalToAdd = {
        ...newGoal,
        id: Date.now().toString(),
        namaTujuan: newGoal.namaTujuan
          ? `${categoryLabel}: ${newGoal.namaTujuan}`
          : categoryLabel,
      } as FinancialGoal;

      addGoal(goalToAdd);

      setNewGoal({
        kategoriTujuan: 'pernikahan',
        namaTujuan: '',
        targetUang: 0,
        jangkaWaktuBulan: 12,
        prioritas: 'sedang',
        tipeRisiko: 'moderat',
        danaTerkumpul: 0,
      });
    }
  };

  const handleAddDebt = () => {
    if (newDebt.totalSisaHutang && newDebt.totalSisaHutang > 0) {
      addDebt({
        ...newDebt,
        id: Date.now().toString(),
      } as DebtItem);
      setNewDebt({
        jenisHutang: 'kta',
        totalSisaHutang: 0,
        bungaPerTahun: 0,
        cicilanPerBulan: 0,
        sisaTenorBulan: 12,
      });
    }
  };

  const handleAddCustomExpense = () => {
    if (newCustomExpense.nama && newCustomExpense.nominal && newCustomExpense.nominal > 0) {
      addCustomExpense({
        ...newCustomExpense,
        id: Date.now().toString(),
      } as CustomExpense);
      setNewCustomExpense({
        nama: '',
        kategori: 'lainnya',
        frekuensi: 'bulanan',
        nominal: 0,
      });
    }
  };

  const handleAddHealthBenefit = () => {
    if (newHealthBenefit.namaManfaat) {
      addHealthBenefit({
        ...newHealthBenefit,
        id: Date.now().toString(),
      } as HealthInsuranceBenefit);
      setNewHealthBenefit({
        namaManfaat: '',
        limitPerTahun: 0,
        sistemKlaim: 'cashless',
        catatan: '',
      });
    }
  };

  const handleAddOtherInsurance = () => {
    if (newOtherInsurance.namaPerusahaan || newOtherInsurance.namaProduk) {
      addOtherInsurance({
        ...newOtherInsurance,
        id: Date.now().toString(),
      } as OtherInsuranceItem);
      setNewOtherInsurance({
        jenisAsuransi: 'jiwa',
        namaPerusahaan: '',
        namaProduk: '',
        premiBulanan: 0,
        manfaatUtama: '',
        nilaiManfaat: 0,
        masaPertanggunganTahun: 10,
      });
    }
  };

  const subscriptionItems = [
    { key: 'spotify', label: 'Spotify' },
    { key: 'netflix', label: 'Netflix' },
    { key: 'youtubePremium', label: 'YouTube Premium' },
    { key: 'googleStorage', label: 'Google Storage' },
    { key: 'appleIcloud', label: 'Apple iCloud' },
    { key: 'amazonPrime', label: 'Amazon Prime' },
  ] as const;

  const renderStepContent = () => {
    switch (currentStep) {
      // Step 1: Personal Info
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                value={data.personalInfo.namaLengkap}
                onChange={(e) => setPersonalInfo({ namaLengkap: e.target.value })}
                placeholder="Masukkan nama Anda"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usia">Usia</Label>
              <Input
                id="usia"
                type="number"
                min="18"
                max="100"
                value={data.personalInfo.usia || ''}
                onChange={(e) => setPersonalInfo({ usia: parseInt(e.target.value) || 0 })}
                placeholder="Contoh: 25"
              />
            </div>
            <div className="space-y-2">
              <Label>Status Pernikahan</Label>
              <Select
                value={data.personalInfo.statusPernikahan}
                onValueChange={(value: 'lajang' | 'menikah' | 'cerai') =>
                  setPersonalInfo({ statusPernikahan: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lajang">Lajang</SelectItem>
                  <SelectItem value="menikah">Menikah</SelectItem>
                  <SelectItem value="cerai">Cerai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="tanggungan">Jumlah Tanggungan</Label>
                <div className="relative group">
                  <Info size={14} className="text-muted-foreground cursor-help hover:text-accent transition-colors" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Jumlah orang yang keuangannya Anda tanggung di luar diri Anda sendiri. Contoh: anak, istri/suami yang tidak bekerja, orang tua, dll.
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover" />
                  </div>
                </div>
              </div>
              <Input
                id="tanggungan"
                type="number"
                min="0"
                max="20"
                value={data.personalInfo.jumlahTanggungan !== undefined ? data.personalInfo.jumlahTanggungan : ''}
                onChange={(e) => setPersonalInfo({ jumlahTanggungan: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domisili">Domisili</Label>
              <Input
                id="domisili"
                value={data.personalInfo.domisili}
                onChange={(e) => setPersonalInfo({ domisili: e.target.value })}
                placeholder="Contoh: Jakarta"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pekerjaan">Pekerjaan</Label>
              <Input
                id="pekerjaan"
                value={data.personalInfo.pekerjaan}
                onChange={(e) => setPersonalInfo({ pekerjaan: e.target.value })}
                placeholder="Contoh: Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label>Status Pekerjaan</Label>
              <Select
                value={data.personalInfo.statusPekerjaan}
                onValueChange={(value: 'karyawan' | 'freelancer' | 'pengusaha' | 'tidak_bekerja') =>
                  setPersonalInfo({ statusPekerjaan: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status pekerjaan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="karyawan">Karyawan</SelectItem>
                  <SelectItem value="freelancer">Freelancer</SelectItem>
                  <SelectItem value="pengusaha">Pengusaha</SelectItem>
                  <SelectItem value="tidak_bekerja">Tidak Bekerja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      // Step 2: Income
      case 2:
        return (
          <div className="space-y-6">
            <SectionTitle>Penghasilan Rutin Bulanan</SectionTitle>
            <NumberInput
              id="gaji"
              label="Gaji Bulanan"
              value={data.income.gajiBulanan}
              onChange={(val) => setIncomeInfo({ gajiBulanan: val })}
              placeholder="10.000.000"
              frequency="bulan"
              tooltip="Gaji pokok yang Anda terima setiap bulan sebelum potongan pajak dan BPJS"
            />
            <NumberInput
              id="tunjangan"
              label="Tunjangan Bulanan"
              value={data.income.tunjanganBulanan}
              onChange={(val) => setIncomeInfo({ tunjanganBulanan: val })}
              frequency="bulan"
              tooltip="Tunjangan tetap bulanan seperti: transport, makan, komunikasi, jabatan, dll"
            />
            <NumberInput
              id="bonus"
              label="Bonus Rata-rata per Tahun"
              value={data.income.bonusRataPerTahun}
              onChange={(val) => setIncomeInfo({ bonusRataPerTahun: val })}
              frequency="tahun"
              tooltip="Total bonus yang biasa Anda terima dalam setahun (THR, bonus kinerja, dll)"
            />
            <NumberInput
              id="pasangan"
              label="Penghasilan Pasangan (jika ada)"
              value={data.income.penghasilanPasangan}
              onChange={(val) => setIncomeInfo({ penghasilanPasangan: val })}
              frequency="bulan"
              tooltip="Penghasilan bulanan pasangan yang digabung untuk keuangan keluarga"
            />
            <NumberInput
              id="tambahan"
              label="Penghasilan Tambahan (Freelance)"
              value={data.income.penghasilanTambahan}
              onChange={(val) => setIncomeInfo({ penghasilanTambahan: val })}
              frequency="bulan"
              tooltip="Penghasilan sampingan rata-rata dari freelance, proyek lepas, atau side job"
            />

            <SectionTitle>Penghasilan Tidak Rutin</SectionTitle>
            <NumberInput
              id="dividen"
              label="Dividen Tahunan"
              value={data.income.dividenTahunan}
              onChange={(val) => setIncomeInfo({ dividenTahunan: val })}
              frequency="tahun"
              tooltip="Pendapatan dari pembagian keuntungan saham yang Anda miliki"
            />
            <NumberInput
              id="usaha"
              label="Hasil Usaha Tahunan"
              value={data.income.hasilUsahaTahunan}
              onChange={(val) => setIncomeInfo({ hasilUsahaTahunan: val })}
              frequency="tahun"
              tooltip="Keuntungan bersih dari bisnis/usaha yang Anda jalankan dalam setahun"
            />
            <NumberInput
              id="pasif"
              label="Penghasilan Pasif Lainnya (sewa, royalti, dll)"
              value={data.income.penghasilanPasifLainnya}
              onChange={(val) => setIncomeInfo({ penghasilanPasifLainnya: val })}
              frequency="tahun"
              tooltip="Pendapatan pasif tahunan seperti sewa properti, royalti, bunga deposito, dll"
            />
          </div>
        );

      // Step 3: Expenses
      case 3:
        return (
          <div className="space-y-6">
            {showExpenseWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Total pengeluaran (Rp {totalExpenses.toLocaleString('id-ID')}) melebihi total pendapatan (Rp {totalIncome.toLocaleString('id-ID')}). Mohon periksa kembali data Anda.
                </AlertDescription>
              </Alert>
            )}

            <SectionTitle>A. Tempat Tinggal</SectionTitle>
            <div className="space-y-2">
              <Label>Tipe Tempat Tinggal</Label>
              <Select
                value={data.expenses.tempatTinggal.tipe}
                onValueChange={(value: 'sewa_rumah' | 'kontrakan' | 'kost' | 'milik_sendiri') =>
                  setExpenseInfo({ tempatTinggal: { ...data.expenses.tempatTinggal, tipe: value } })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sewa_rumah">Sewa Rumah</SelectItem>
                  <SelectItem value="kontrakan">Kontrakan</SelectItem>
                  <SelectItem value="kost">Kost</SelectItem>
                  <SelectItem value="milik_sendiri">Milik Sendiri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <NumberInput
              id="sewa"
              label="Biaya Sewa/Angsuran/Kos"
              value={data.expenses.tempatTinggal.biayaSewa}
              onChange={(val) => setExpenseInfo({ tempatTinggal: { ...data.expenses.tempatTinggal, biayaSewa: val } })}
              frequency="bulan"
              tooltip="Biaya sewa, angsuran KPR, atau kost per bulan"
            />
            <NumberInput
              id="listrik"
              label="Listrik"
              value={data.expenses.tempatTinggal.listrik}
              onChange={(val) => setExpenseInfo({ tempatTinggal: { ...data.expenses.tempatTinggal, listrik: val } })}
              frequency="bulan"
              tooltip="Tagihan listrik rata-rata per bulan"
            />
            <NumberInput
              id="air"
              label="Air"
              value={data.expenses.tempatTinggal.air}
              onChange={(val) => setExpenseInfo({ tempatTinggal: { ...data.expenses.tempatTinggal, air: val } })}
              frequency="bulan"
              tooltip="Tagihan air PDAM atau galon per bulan"
            />
            <NumberInput
              id="internet"
              label="Internet Rumah"
              value={data.expenses.tempatTinggal.internet}
              onChange={(val) => setExpenseInfo({ tempatTinggal: { ...data.expenses.tempatTinggal, internet: val } })}
              frequency="bulan"
              tooltip="Biaya internet rumah (IndiHome, First Media, dll)"
            />
            <NumberInput
              id="rumahTangga"
              label="Keperluan Rumah Tangga"
              value={data.expenses.tempatTinggal.keperluanRumahTangga}
              onChange={(val) => setExpenseInfo({ tempatTinggal: { ...data.expenses.tempatTinggal, keperluanRumahTangga: val } })}
              frequency="bulan"
              tooltip="Sabun, deterjen, alat kebersihan, dan kebutuhan rumah tangga lainnya"
            />

            <SectionTitle>B. Konsumsi</SectionTitle>
            <NumberInput
              id="makan"
              label="Makan Harian"
              value={data.expenses.konsumsi.makanHarian}
              onChange={(val) => setExpenseInfo({ konsumsi: { ...data.expenses.konsumsi, makanHarian: val } })}
              frequency="hari"
              tooltip="Biaya makan rata-rata per hari (sarapan, makan siang, makan malam)"
            />
            <NumberInput
              id="jajan"
              label="Jajan atau Ngopi"
              value={data.expenses.konsumsi.jajanNgopi}
              onChange={(val) => setExpenseInfo({ konsumsi: { ...data.expenses.konsumsi, jajanNgopi: val } })}
              frequency="hari"
              tooltip="Biaya jajan, ngopi, atau camilan per hari"
            />
            <NumberInput
              id="dapur"
              label="Belanja Bulanan Dapur"
              value={data.expenses.konsumsi.belanjaDapur}
              onChange={(val) => setExpenseInfo({ konsumsi: { ...data.expenses.konsumsi, belanjaDapur: val } })}
              frequency="bulan"
              tooltip="Belanja kebutuhan dapur bulanan: beras, minyak, bumbu, dll"
            />

            <SectionTitle>C. Transportasi</SectionTitle>
            <NumberInput
              id="transport"
              label="Transport Harian"
              value={data.expenses.transportasi.transportHarian}
              onChange={(val) => setExpenseInfo({ transportasi: { ...data.expenses.transportasi, transportHarian: val } })}
              frequency="hari"
              tooltip="Biaya transportasi harian: bensin, ojol, bus, MRT, dll"
            />
            <NumberInput
              id="parkir"
              label="Parkir"
              value={data.expenses.transportasi.parkir}
              onChange={(val) => setExpenseInfo({ transportasi: { ...data.expenses.transportasi, parkir: val } })}
              frequency="hari"
              tooltip="Biaya parkir rata-rata per hari kerja"
            />
            <NumberInput
              id="servis"
              label="Servis Kendaraan"
              value={data.expenses.transportasi.servisKendaraan}
              onChange={(val) => setExpenseInfo({ transportasi: { ...data.expenses.transportasi, servisKendaraan: val } })}
              frequency="bulan"
              tooltip="Biaya servis, ganti oli, sparepart rata-rata per bulan"
            />

            <SectionTitle>D. Kesehatan & Lifestyle</SectionTitle>
            <NumberInput
              id="vitamin"
              label="Vitamin & Suplemen"
              value={data.expenses.kesehatanLifestyle.vitaminSuplemen}
              onChange={(val) => setExpenseInfo({ kesehatanLifestyle: { ...data.expenses.kesehatanLifestyle, vitaminSuplemen: val } })}
              frequency="bulan"
              tooltip="Biaya vitamin, suplemen, atau obat-obatan rutin per bulan"
            />
            <NumberInput
              id="gym"
              label="Gym / Fitness"
              value={data.expenses.kesehatanLifestyle.gymFitness}
              onChange={(val) => setExpenseInfo({ kesehatanLifestyle: { ...data.expenses.kesehatanLifestyle, gymFitness: val } })}
              frequency="bulan"
              tooltip="Biaya membership gym, yoga, atau olahraga rutin"
            />
            <NumberInput
              id="hiburan"
              label="Hiburan (nonton, rekreasi)"
              value={data.expenses.kesehatanLifestyle.hiburan}
              onChange={(val) => setExpenseInfo({ kesehatanLifestyle: { ...data.expenses.kesehatanLifestyle, hiburan: val } })}
              frequency="bulan"
              tooltip="Biaya hiburan bulanan: nonton, rekreasi, hangout, dll"
            />

            <SectionTitle>E. Komunikasi & Subscriptions</SectionTitle>
            <NumberInput
              id="pulsa"
              label="Pulsa & Paket Data"
              value={data.expenses.komunikasiSubscriptions.pulsaPaketData}
              onChange={(val) => setExpenseInfo({ komunikasiSubscriptions: { ...data.expenses.komunikasiSubscriptions, pulsaPaketData: val } })}
              frequency="bulan"
              tooltip="Biaya pulsa dan paket data HP per bulan"
            />

            <div className="space-y-4">
              {subscriptionItems.map((sub) => {
                const subscriptionData = data.expenses.komunikasiSubscriptions[sub.key];
                return (
                  <div key={sub.key} className="p-4 rounded-lg bg-secondary space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={sub.key}
                        checked={subscriptionData.aktif}
                        onCheckedChange={(checked) =>
                          setExpenseInfo({
                            komunikasiSubscriptions: {
                              ...data.expenses.komunikasiSubscriptions,
                              [sub.key]: { ...subscriptionData, aktif: !!checked }
                            }
                          })
                        }
                      />
                      <Label htmlFor={sub.key} className="cursor-pointer font-medium">{sub.label}</Label>
                    </div>
                    {subscriptionData.aktif && (
                      <NumberInput
                        id={`${sub.key}-biaya`}
                        label="Biaya per bulan"
                        value={subscriptionData.biayaBulanan}
                        onChange={(val) =>
                          setExpenseInfo({
                            komunikasiSubscriptions: {
                              ...data.expenses.komunikasiSubscriptions,
                              [sub.key]: { ...subscriptionData, biayaBulanan: val }
                            }
                          })
                        }
                        frequency="bulan"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subLainnyaNama">Subscription Lainnya</Label>
                <Input
                  id="subLainnyaNama"
                  value={data.expenses.komunikasiSubscriptions.lainnyaNama}
                  onChange={(e) => setExpenseInfo({ komunikasiSubscriptions: { ...data.expenses.komunikasiSubscriptions, lainnyaNama: e.target.value } })}
                  placeholder="Contoh: Disney+"
                />
              </div>
              <NumberInput
                id="subLainnyaBiaya"
                label="Biaya per bulan"
                value={data.expenses.komunikasiSubscriptions.lainnyaBiaya}
                onChange={(val) => setExpenseInfo({ komunikasiSubscriptions: { ...data.expenses.komunikasiSubscriptions, lainnyaBiaya: val } })}
                frequency="bulan"
              />
            </div>

            <SectionTitle>F. Kewajiban Keluarga</SectionTitle>
            <NumberInput
              id="sekolah"
              label="Uang Sekolah Anak"
              value={data.expenses.kewajibanKeluarga.uangSekolahAnak}
              onChange={(val) => setExpenseInfo({ kewajibanKeluarga: { ...data.expenses.kewajibanKeluarga, uangSekolahAnak: val } })}
              frequency="bulan"
              tooltip="SPP, uang buku, dan biaya sekolah rutin anak per bulan"
            />
            <NumberInput
              id="daycare"
              label="SPP/Daycare"
              value={data.expenses.kewajibanKeluarga.sppDaycare}
              onChange={(val) => setExpenseInfo({ kewajibanKeluarga: { ...data.expenses.kewajibanKeluarga, sppDaycare: val } })}
              frequency="bulan"
              tooltip="Biaya daycare atau penitipan anak per bulan"
            />

            <SectionTitle>G. Pengeluaran Tambahan</SectionTitle>

            {/* Existing Custom Expenses */}
            {data.customExpenses.length > 0 && (
              <div className="space-y-3 mb-4">
                {data.customExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary"
                  >
                    <div>
                      <p className="font-medium">{expense.nama}</p>
                      <p className="text-sm text-muted-foreground">
                        Rp {expense.nominal.toLocaleString('id-ID')} / {expense.frekuensi} • {expense.kategori}
                        <span className="ml-2 text-primary">
                          (≈ Rp {toMonthly(expense.nominal, expense.frekuensi).toLocaleString('id-ID')}/bulan)
                        </span>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomExpense(expense.id)}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom Expense */}
            <Card variant="elevated">
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customNama">Nama Pengeluaran</Label>
                  <Input
                    id="customNama"
                    value={newCustomExpense.nama}
                    onChange={(e) => setNewCustomExpense({ ...newCustomExpense, nama: e.target.value })}
                    placeholder="Contoh: Les Bahasa Inggris"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select
                      value={newCustomExpense.kategori}
                      onValueChange={(value) => setNewCustomExpense({ ...newCustomExpense, kategori: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rumah">Rumah</SelectItem>
                        <SelectItem value="konsumsi">Konsumsi</SelectItem>
                        <SelectItem value="transportasi">Transportasi</SelectItem>
                        <SelectItem value="kesehatan">Kesehatan</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="keluarga">Keluarga</SelectItem>
                        <SelectItem value="lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Frekuensi</Label>
                    <Select
                      value={newCustomExpense.frekuensi}
                      onValueChange={(value) => setNewCustomExpense({ ...newCustomExpense, frekuensi: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih frekuensi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="harian">Harian</SelectItem>
                        <SelectItem value="mingguan">Mingguan</SelectItem>
                        <SelectItem value="bulanan">Bulanan</SelectItem>
                        <SelectItem value="tahunan">Tahunan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <NumberInput
                  id="customNominal"
                  label="Nominal"
                  value={newCustomExpense.nominal || 0}
                  onChange={(val) => setNewCustomExpense({ ...newCustomExpense, nominal: val })}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAddCustomExpense}
                >
                  <Plus size={16} className="mr-2" />
                  Tambah Pengeluaran
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      // Step 4: Debts
      case 4:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan hutang & cicilan yang Anda miliki.
            </p>

            {/* Existing Debts */}
            {data.debts.length > 0 && (
              <div className="space-y-3 mb-6">
                <Label>Hutang Anda:</Label>
                {data.debts.map((debt) => (
                  <div
                    key={debt.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary"
                  >
                    <div>
                      <p className="font-medium capitalize">{debt.jenisHutang.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        Rp {debt.totalSisaHutang.toLocaleString('id-ID')} • {debt.cicilanPerBulan.toLocaleString('id-ID')}/bulan • {debt.sisaTenorBulan} bulan
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDebt(debt.id)}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Debt */}
            <Card variant="elevated">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Tambah Hutang</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Jenis Hutang</Label>
                  <Select
                    value={newDebt.jenisHutang}
                    onValueChange={(value) => setNewDebt({ ...newDebt, jenisHutang: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis hutang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kta">KTA</SelectItem>
                      <SelectItem value="paylater">PayLater</SelectItem>
                      <SelectItem value="kartu_kredit">Kartu Kredit</SelectItem>
                      <SelectItem value="pinjol_legal">Pinjaman Online Legal</SelectItem>
                      <SelectItem value="cicilan_hp">Cicilan HP</SelectItem>
                      <SelectItem value="kendaraan">Cicilan Kendaraan</SelectItem>
                      <SelectItem value="kpr">KPR</SelectItem>
                      <SelectItem value="lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <NumberInput
                  id="sisaHutang"
                  label="Total Sisa Hutang"
                  value={newDebt.totalSisaHutang || 0}
                  onChange={(val) => setNewDebt({ ...newDebt, totalSisaHutang: val })}
                />
                <div className="space-y-2">
                  <Label htmlFor="bunga">Bunga per Tahun (%)</Label>
                  <Input
                    id="bunga"
                    type="number"
                    min="0"
                    max="100"
                    value={newDebt.bungaPerTahun || ''}
                    onChange={(e) => setNewDebt({ ...newDebt, bungaPerTahun: parseFloat(e.target.value) || 0 })}
                    placeholder="12"
                  />
                </div>
                <NumberInput
                  id="cicilanBulan"
                  label="Cicilan per Bulan"
                  value={newDebt.cicilanPerBulan || 0}
                  onChange={(val) => setNewDebt({ ...newDebt, cicilanPerBulan: val })}
                />
                <div className="space-y-2">
                  <Label htmlFor="tenor">Sisa Tenor (bulan)</Label>
                  <Input
                    id="tenor"
                    type="number"
                    min="1"
                    max="360"
                    value={newDebt.sisaTenorBulan || ''}
                    onChange={(e) => setNewDebt({ ...newDebt, sisaTenorBulan: parseInt(e.target.value) || 0 })}
                    placeholder="12"
                  />
                </div>
                <Button
                  type="button"
                  variant="accent"
                  className="w-full"
                  onClick={handleAddDebt}
                >
                  <Plus size={16} className="mr-2" />
                  Simpan Hutang ke Daftar
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  ⚠️ Pastikan klik tombol di atas untuk menyimpan hutang ke daftar sebelum lanjut
                </p>
              </CardContent>
            </Card>

            {/* Info if no debts - that's okay */}
            {data.debts.length === 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Jika Anda tidak memiliki hutang, Anda bisa langsung lanjut ke step berikutnya.
                  Untuk menambahkan hutang, isi form di atas lalu klik <strong>"Simpan Hutang ke Daftar"</strong>.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      // Step 5: Emergency Fund
      case 5:
        return (
          <div className="space-y-6">
            {/* Info alert explaining the relationship with Assets */}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Penting:</strong> Dana darurat yang Anda isi di sini juga perlu dicatat di form <strong>Aset</strong> (langkah berikutnya).
                Contoh: Jika dana darurat Rp10 juta disimpan di tabungan, maka isi juga Rp10 juta di field "Tabungan Bank" pada form Aset.
              </AlertDescription>
            </Alert>

            <NumberInput
              id="danaDarurat"
              label="Dana Darurat Saat Ini"
              value={data.emergencyFund.danaDaruratSaatIni}
              onChange={(val) => setEmergencyFundInfo({ danaDaruratSaatIni: val })}
              tooltip="Jumlah uang yang Anda siapkan khusus untuk keadaan darurat (PHK, sakit, dll)"
            />
            <div className="space-y-2">
              <Label>Tipe Penyimpanan</Label>
              <p className="text-xs text-muted-foreground">Di mana Anda menyimpan dana darurat ini?</p>
              <Select
                value={data.emergencyFund.tipePenyimpanan}
                onValueChange={(value: 'tabungan' | 'deposito' | 'money_market' | 'lainnya') =>
                  setEmergencyFundInfo({ tipePenyimpanan: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tabungan">Tabungan Bank</SelectItem>
                  <SelectItem value="deposito">Deposito</SelectItem>
                  <SelectItem value="money_market">Reksadana Pasar Uang</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frekuensi Menambah Dana Darurat</Label>
              <Select
                value={data.emergencyFund.frekuensiMenambah}
                onValueChange={(value: 'bulanan' | 'tidak_rutin') =>
                  setEmergencyFundInfo({ frekuensiMenambah: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih frekuensi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                  <SelectItem value="tidak_rutin">Tidak Rutin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <NumberInput
              id="jumlahPenambahan"
              label="Jumlah Penambahan"
              value={data.emergencyFund.jumlahPenambahan}
              onChange={(val) => setEmergencyFundInfo({ jumlahPenambahan: val })}
              tooltip="Berapa yang Anda tambahkan ke dana darurat setiap kali menabung"
            />
          </div>
        );

      // Step 6: Assets
      case 6:
        return (
          <div className="space-y-6">
            {/* Reminder about emergency fund */}
            {data.emergencyFund.danaDaruratSaatIni > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>Pengingat:</strong> Anda mengisi dana darurat sebesar <strong>Rp {data.emergencyFund.danaDaruratSaatIni.toLocaleString('id-ID')}</strong> di langkah sebelumnya.
                  Pastikan nominal ini juga tercatat di form aset ini sesuai tempat penyimpanannya (Tabungan Bank/Deposito/RDPU/Emas/lainnya).
                </AlertDescription>
              </Alert>
            )}

            <SectionTitle>A. Kas & Likuid</SectionTitle>
            <NumberInput
              id="tabunganBank"
              label="Tabungan Bank"
              value={data.assets.kasLikuid.tabunganBank}
              onChange={(val) => setAssetInfo({ kasLikuid: { ...data.assets.kasLikuid, tabunganBank: val } })}
              tooltip="Total saldo di semua rekening tabungan bank Anda (termasuk dana darurat jika disimpan di sini)"
            />
            <NumberInput
              id="deposito"
              label="Deposito"
              value={data.assets.kasLikuid.deposito}
              onChange={(val) => setAssetInfo({ kasLikuid: { ...data.assets.kasLikuid, deposito: val } })}
            />
            <NumberInput
              id="eWallet"
              label="E-Wallet"
              value={data.assets.kasLikuid.eWallet}
              onChange={(val) => setAssetInfo({ kasLikuid: { ...data.assets.kasLikuid, eWallet: val } })}
            />
            <NumberInput
              id="uangTunai"
              label="Uang Tunai"
              value={data.assets.kasLikuid.uangTunai}
              onChange={(val) => setAssetInfo({ kasLikuid: { ...data.assets.kasLikuid, uangTunai: val } })}
            />

            <SectionTitle>B. Investasi</SectionTitle>
            <NumberInput
              id="rdpu"
              label="Reksadana Pasar Uang"
              value={data.assets.investasi.reksadanaPasarUang}
              onChange={(val) => setAssetInfo({ investasi: { ...data.assets.investasi, reksadanaPasarUang: val } })}
            />
            <NumberInput
              id="rdObligasi"
              label="Reksadana Obligasi"
              value={data.assets.investasi.reksadanaObligasi}
              onChange={(val) => setAssetInfo({ investasi: { ...data.assets.investasi, reksadanaObligasi: val } })}
            />
            <NumberInput
              id="rdSaham"
              label="Reksadana Saham"
              value={data.assets.investasi.reksadanaSaham}
              onChange={(val) => setAssetInfo({ investasi: { ...data.assets.investasi, reksadanaSaham: val } })}
            />
            <NumberInput
              id="sahamID"
              label="Saham Indonesia"
              value={data.assets.investasi.sahamIndonesia}
              onChange={(val) => setAssetInfo({ investasi: { ...data.assets.investasi, sahamIndonesia: val } })}
            />
            <NumberInput
              id="sahamUS"
              label="Saham US / ETF US"
              value={data.assets.investasi.sahamUSETF}
              onChange={(val) => setAssetInfo({ investasi: { ...data.assets.investasi, sahamUSETF: val } })}
            />
            <NumberInput
              id="kripto"
              label="Kripto"
              value={data.assets.investasi.kripto}
              onChange={(val) => setAssetInfo({ investasi: { ...data.assets.investasi, kripto: val } })}
            />
            <NumberInput
              id="obligasi"
              label="Obligasi Negara / SBN / ORI / Sukuk"
              value={data.assets.investasi.obligasiNegara}
              onChange={(val) => setAssetInfo({ investasi: { ...data.assets.investasi, obligasiNegara: val } })}
            />
            <NumberInput
              id="emas"
              label="Emas"
              value={data.assets.investasi.emas}
              onChange={(val) => setAssetInfo({ investasi: { ...data.assets.investasi, emas: val } })}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="investLainNama">Investasi Lainnya</Label>
                <Input
                  id="investLainNama"
                  value={data.assets.investasi.lainnyaNama}
                  onChange={(e) => setAssetInfo({ investasi: { ...data.assets.investasi, lainnyaNama: e.target.value } })}
                  placeholder="Nama investasi"
                />
              </div>
              <NumberInput
                id="investLainNilai"
                label="Nilai"
                value={data.assets.investasi.lainnyaNilai}
                onChange={(val) => setAssetInfo({ investasi: { ...data.assets.investasi, lainnyaNilai: val } })}
              />
            </div>

            <SectionTitle>C. Aset Riil</SectionTitle>
            <NumberInput
              id="properti"
              label="Properti (estimasi nilai)"
              value={data.assets.asetRiil.properti}
              onChange={(val) => setAssetInfo({ asetRiil: { ...data.assets.asetRiil, properti: val } })}
            />
            <NumberInput
              id="kendaraan"
              label="Kendaraan (estimasi nilai)"
              value={data.assets.asetRiil.kendaraan}
              onChange={(val) => setAssetInfo({ asetRiil: { ...data.assets.asetRiil, kendaraan: val } })}
            />
            <NumberInput
              id="barangBerharga"
              label="Barang Berharga (jam, koleksi, dll)"
              value={data.assets.asetRiil.barangBerharga}
              onChange={(val) => setAssetInfo({ asetRiil: { ...data.assets.asetRiil, barangBerharga: val } })}
            />
          </div>
        );

      // Step 7: Insurance
      case 7:
        return (
          <div className="space-y-6">
            <SectionTitle>A. BPJS Kesehatan</SectionTitle>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-secondary">
              <Checkbox
                id="bpjsKes"
                checked={data.insurance.bpjs.punya}
                onCheckedChange={(checked) => setInsuranceInfo({
                  bpjs: { ...data.insurance.bpjs, punya: !!checked }
                })}
              />
              <Label htmlFor="bpjsKes" className="cursor-pointer">Punya BPJS Kesehatan?</Label>
            </div>
            {data.insurance.bpjs.punya && (
              <>
                <div className="space-y-2">
                  <Label>Kelas BPJS</Label>
                  <Select
                    value={data.insurance.bpjs.kelas}
                    onValueChange={(value: 'kelas_1' | 'kelas_2' | 'kelas_3') =>
                      setInsuranceInfo({ bpjs: { ...data.insurance.bpjs, kelas: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas BPJS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kelas_1">Kelas 1</SelectItem>
                      <SelectItem value="kelas_2">Kelas 2</SelectItem>
                      <SelectItem value="kelas_3">Kelas 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="anggotaBpjs">Jumlah Anggota Keluarga yang Ditanggung</Label>
                    <div className="relative group">
                      <Info size={14} className="text-muted-foreground cursor-help hover:text-accent transition-colors" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        Hitung termasuk diri Anda sendiri. Contoh: Anda + istri + 2 anak = 4 orang.
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover" />
                      </div>
                    </div>
                  </div>
                  <Input
                    id="anggotaBpjs"
                    type="number"
                    min="1"
                    max="10"
                    value={data.insurance.bpjs.jumlahAnggotaDitanggung || ''}
                    onChange={(e) => setInsuranceInfo({
                      bpjs: { ...data.insurance.bpjs, jumlahAnggotaDitanggung: parseInt(e.target.value) || 0 }
                    })}
                    placeholder="Contoh: 4"
                  />
                </div>
                <NumberInput
                  id="iuranBpjs"
                  label="Iuran BPJS per Bulan"
                  value={data.insurance.bpjs.iuranBulanan}
                  onChange={(val) => setInsuranceInfo({
                    bpjs: { ...data.insurance.bpjs, iuranBulanan: val }
                  })}
                  tooltip="Total iuran BPJS untuk semua anggota keluarga yang Anda tanggung per bulan. Jika ditanggung perusahaan, isi 0."
                />
              </>
            )}

            <SectionTitle>B. Asuransi Kesehatan Swasta</SectionTitle>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-secondary">
              <Checkbox
                id="asuransiSwasta"
                checked={data.insurance.kesehatanSwasta.punya}
                onCheckedChange={(checked) => setInsuranceInfo({
                  kesehatanSwasta: { ...data.insurance.kesehatanSwasta, punya: !!checked }
                })}
              />
              <Label htmlFor="asuransiSwasta" className="cursor-pointer">Punya Asuransi Kesehatan Swasta?</Label>
            </div>
            {data.insurance.kesehatanSwasta.punya && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="namaPerusahaanKes">Nama Perusahaan Asuransi</Label>
                  <Input
                    id="namaPerusahaanKes"
                    value={data.insurance.kesehatanSwasta.namaPerusahaan}
                    onChange={(e) => setInsuranceInfo({
                      kesehatanSwasta: { ...data.insurance.kesehatanSwasta, namaPerusahaan: e.target.value }
                    })}
                    placeholder="Contoh: Prudential"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="namaProdukKes">Nama Produk</Label>
                  <Input
                    id="namaProdukKes"
                    value={data.insurance.kesehatanSwasta.namaProduk}
                    onChange={(e) => setInsuranceInfo({
                      kesehatanSwasta: { ...data.insurance.kesehatanSwasta, namaProduk: e.target.value }
                    })}
                    placeholder="Contoh: PRUMy Critical Care"
                  />
                </div>
                <NumberInput
                  id="premiKes"
                  label="Premi Bulanan"
                  value={data.insurance.kesehatanSwasta.premiBulanan}
                  onChange={(val) => setInsuranceInfo({
                    kesehatanSwasta: { ...data.insurance.kesehatanSwasta, premiBulanan: val }
                  })}
                />

                {/* Health Benefits */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Detail Manfaat</Label>

                  {data.insurance.kesehatanSwasta.manfaat.length > 0 && (
                    <div className="space-y-3">
                      {data.insurance.kesehatanSwasta.manfaat.map((benefit) => (
                        <div
                          key={benefit.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted"
                        >
                          <div>
                            <p className="font-medium">{benefit.namaManfaat}</p>
                            <p className="text-sm text-muted-foreground">
                              Limit: Rp {benefit.limitPerTahun.toLocaleString('id-ID')}/tahun • {benefit.sistemKlaim}
                              {benefit.catatan && ` • ${benefit.catatan}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHealthBenefit(benefit.id)}
                          >
                            <X size={18} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Card variant="elevated">
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="namaManfaat">Nama Manfaat / Rider</Label>
                        <Input
                          id="namaManfaat"
                          value={newHealthBenefit.namaManfaat}
                          onChange={(e) => setNewHealthBenefit({ ...newHealthBenefit, namaManfaat: e.target.value })}
                          placeholder="Contoh: Rawat Inap, ICU, Bedah, Kanker"
                        />
                      </div>
                      <NumberInput
                        id="limitManfaat"
                        label="Limit Manfaat per Tahun"
                        value={newHealthBenefit.limitPerTahun || 0}
                        onChange={(val) => setNewHealthBenefit({ ...newHealthBenefit, limitPerTahun: val })}
                      />
                      <div className="space-y-2">
                        <Label>Sistem Klaim</Label>
                        <Select
                          value={newHealthBenefit.sistemKlaim}
                          onValueChange={(value: 'cashless' | 'reimbursement') =>
                            setNewHealthBenefit({ ...newHealthBenefit, sistemKlaim: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih sistem klaim" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cashless">Cashless</SelectItem>
                            <SelectItem value="reimbursement">Reimbursement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="catatanManfaat">Catatan Tambahan (opsional)</Label>
                        <Input
                          id="catatanManfaat"
                          value={newHealthBenefit.catatan}
                          onChange={(e) => setNewHealthBenefit({ ...newHealthBenefit, catatan: e.target.value })}
                          placeholder="Catatan tambahan"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleAddHealthBenefit}
                      >
                        <Plus size={16} className="mr-2" />
                        Tambah Manfaat
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            <SectionTitle>C. Asuransi Lainnya</SectionTitle>

            {/* Existing Other Insurance */}
            {data.insurance.asuransiLainnya.length > 0 && (
              <div className="space-y-3 mb-4">
                {data.insurance.asuransiLainnya.map((ins) => (
                  <div
                    key={ins.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary"
                  >
                    <div>
                      <p className="font-medium capitalize">{ins.jenisAsuransi.replace('_', ' ')} - {ins.namaProduk || ins.namaPerusahaan}</p>
                      <p className="text-sm text-muted-foreground">
                        Premi: Rp {ins.premiBulanan.toLocaleString('id-ID')}/bulan • UP: Rp {ins.nilaiManfaat.toLocaleString('id-ID')} • {ins.masaPertanggunganTahun} tahun
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOtherInsurance(ins.id)}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Other Insurance */}
            <Card variant="elevated">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Tambah Asuransi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Jenis Asuransi</Label>
                  <Select
                    value={newOtherInsurance.jenisAsuransi}
                    onValueChange={(value) => setNewOtherInsurance({ ...newOtherInsurance, jenisAsuransi: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis asuransi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jiwa">Jiwa</SelectItem>
                      <SelectItem value="penyakit_kritis">Penyakit Kritis</SelectItem>
                      <SelectItem value="kecelakaan">Kecelakaan</SelectItem>
                      <SelectItem value="pendidikan">Pendidikan</SelectItem>
                      <SelectItem value="properti">Properti</SelectItem>
                      <SelectItem value="kendaraan">Kendaraan</SelectItem>
                      <SelectItem value="lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newOtherInsurance.jenisAsuransi === 'lainnya' && (
                  <div className="space-y-2">
                    <Label htmlFor="jenisAsuransiCustom">Nama Jenis Asuransi</Label>
                    <Input
                      id="jenisAsuransiCustom"
                      value={newOtherInsurance.jenisAsuransiLainnya || ''}
                      onChange={(e) => setNewOtherInsurance({ ...newOtherInsurance, jenisAsuransiLainnya: e.target.value })}
                      placeholder="Contoh: Asuransi Perjalanan"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="namaPerusahaanIns">Nama Perusahaan Asuransi</Label>
                  <Input
                    id="namaPerusahaanIns"
                    value={newOtherInsurance.namaPerusahaan}
                    onChange={(e) => setNewOtherInsurance({ ...newOtherInsurance, namaPerusahaan: e.target.value })}
                    placeholder="Contoh: Allianz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="namaProdukIns">Nama Produk</Label>
                  <Input
                    id="namaProdukIns"
                    value={newOtherInsurance.namaProduk}
                    onChange={(e) => setNewOtherInsurance({ ...newOtherInsurance, namaProduk: e.target.value })}
                    placeholder="Contoh: SmartLink Flexi Account Plus"
                  />
                </div>
                <NumberInput
                  id="premiIns"
                  label="Premi Bulanan"
                  value={newOtherInsurance.premiBulanan || 0}
                  onChange={(val) => setNewOtherInsurance({ ...newOtherInsurance, premiBulanan: val })}
                />
                <div className="space-y-2">
                  <Label htmlFor="manfaatUtama">Manfaat Utama</Label>
                  <Input
                    id="manfaatUtama"
                    value={newOtherInsurance.manfaatUtama}
                    onChange={(e) => setNewOtherInsurance({ ...newOtherInsurance, manfaatUtama: e.target.value })}
                    placeholder="Contoh: Perlindungan jiwa + investasi"
                  />
                </div>
                <NumberInput
                  id="nilaiManfaat"
                  label="Nilai Manfaat / Uang Pertanggungan"
                  value={newOtherInsurance.nilaiManfaat || 0}
                  onChange={(val) => setNewOtherInsurance({ ...newOtherInsurance, nilaiManfaat: val })}
                />
                <div className="space-y-2">
                  <Label htmlFor="masaPertanggungan">Masa Pertanggungan (tahun)</Label>
                  <Input
                    id="masaPertanggungan"
                    type="number"
                    min="1"
                    max="100"
                    value={newOtherInsurance.masaPertanggunganTahun || ''}
                    onChange={(e) => setNewOtherInsurance({ ...newOtherInsurance, masaPertanggunganTahun: parseInt(e.target.value) || 0 })}
                    placeholder="10"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAddOtherInsurance}
                >
                  <Plus size={16} className="mr-2" />
                  Tambah Asuransi
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      // Step 8: Financial Goals
      case 8:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan tujuan keuangan yang ingin Anda capai.
            </p>

            {/* Existing Goals */}
            {data.financialGoals.length > 0 && (
              <div className="space-y-3 mb-6">
                <Label>Tujuan Anda:</Label>
                {data.financialGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary"
                  >
                    <div>
                      <p className="font-medium">{goal.namaTujuan}</p>
                      <p className="text-sm text-muted-foreground">
                        Rp {goal.targetUang.toLocaleString('id-ID')} • {goal.jangkaWaktuBulan} bulan • {goal.prioritas}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGoal(goal.id)}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Goal */}
            <Card variant="elevated">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Tambah Tujuan Baru</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kategori Tujuan</Label>
                  <Select
                    value={newGoal.kategoriTujuan}
                    onValueChange={(value) => setNewGoal({ ...newGoal, kategoriTujuan: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {KATEGORI_TUJUAN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show custom name input for 'barang' or 'lainnya' categories */}
                {(newGoal.kategoriTujuan === 'barang' || newGoal.kategoriTujuan === 'lainnya') && (
                  <div className="space-y-2">
                    <Label htmlFor="namaTujuan">
                      {newGoal.kategoriTujuan === 'barang' ? 'Nama Barang' : 'Nama Tujuan Lainnya'}
                    </Label>
                    <Input
                      id="namaTujuan"
                      value={newGoal.namaTujuan}
                      onChange={(e) => setNewGoal({ ...newGoal, namaTujuan: e.target.value })}
                      placeholder={newGoal.kategoriTujuan === 'barang' ? 'Contoh: iPhone, Motor, dll' : 'Jelaskan tujuan Anda'}
                    />
                  </div>
                )}

                <NumberInput
                  id="targetUang"
                  label="Target Uang"
                  value={newGoal.targetUang || 0}
                  onChange={(val) => setNewGoal({ ...newGoal, targetUang: val })}
                />
                <div className="space-y-2">
                  <Label htmlFor="jangkaWaktu">Jangka Waktu (bulan)</Label>
                  <Input
                    id="jangkaWaktu"
                    type="number"
                    min="1"
                    max="360"
                    value={newGoal.jangkaWaktuBulan || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, jangkaWaktuBulan: parseInt(e.target.value) || 0 })}
                    placeholder="24"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prioritas</Label>
                  <Select
                    value={newGoal.prioritas}
                    onValueChange={(value: 'tinggi' | 'sedang' | 'rendah') =>
                      setNewGoal({ ...newGoal, prioritas: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih prioritas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tinggi">Tinggi</SelectItem>
                      <SelectItem value="sedang">Sedang</SelectItem>
                      <SelectItem value="rendah">Rendah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipe Risiko</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Pilih yang paling menggambarkan diri Anda dalam berinvestasi
                  </p>
                  <Select
                    value={newGoal.tipeRisiko}
                    onValueChange={(value: 'konservatif' | 'moderat' | 'agresif') =>
                      setNewGoal({ ...newGoal, tipeRisiko: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe risiko" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="konservatif" textValue="Konservatif">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Konservatif</span>
                          <span className="text-xs text-muted-foreground">Saya pemula/tidak paham investasi, lebih suka yang aman seperti emas, deposito, atau RDPU</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="moderat" textValue="Moderat">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Moderat</span>
                          <span className="text-xs text-muted-foreground">Saya cukup paham investasi tapi tidak bisa pantau intens, campuran aman + saham</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="agresif" textValue="Agresif">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Agresif</span>
                          <span className="text-xs text-muted-foreground">Saya berpengalaman di saham/kripto/forex, siap dengan fluktuasi tinggi demi return besar</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <NumberInput
                  id="danaTerkumpul"
                  label="Dana yang Sudah Terkumpul"
                  value={newGoal.danaTerkumpul || 0}
                  onChange={(val) => setNewGoal({ ...newGoal, danaTerkumpul: val })}
                />
                <Button
                  type="button"
                  variant="accent"
                  className="w-full"
                  onClick={handleAddGoal}
                >
                  <Plus size={16} className="mr-2" />
                  Simpan Tujuan ke Daftar
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  ⚠️ Pastikan klik tombol di atas untuk menyimpan tujuan ke daftar sebelum lanjut
                </p>
              </CardContent>
            </Card>

            {/* Warning if no goals added */}
            {data.financialGoals.length === 0 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Anda belum menambahkan tujuan keuangan. Isi form di atas lalu klik <strong>"Simpan Tujuan ke Daftar"</strong> untuk menyimpan.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      // Step 9: Risk Profile
      case 9:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Toleransi Risiko</Label>
              <Select
                value={data.riskProfile.toleransiRisiko}
                onValueChange={(value: 'rendah' | 'sedang' | 'tinggi') =>
                  setRiskProfileInfo({ toleransiRisiko: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih toleransi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rendah">Rendah - Saya lebih suka aman</SelectItem>
                  <SelectItem value="sedang">Sedang - Saya bisa terima volatilitas sedang</SelectItem>
                  <SelectItem value="tinggi">Tinggi - Saya siap dengan fluktuasi besar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pengalaman Investasi</Label>
              <Select
                value={data.riskProfile.pengalamanInvestasi}
                onValueChange={(value: 'pemula' | 'menengah' | 'ahli') =>
                  setRiskProfileInfo({ pengalamanInvestasi: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pengalaman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pemula">Pemula - Baru mulai belajar investasi</SelectItem>
                  <SelectItem value="menengah">Menengah - Sudah punya pengalaman 1-3 tahun</SelectItem>
                  <SelectItem value="ahli">Ahli - Pengalaman lebih dari 3 tahun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reaksi Saat Investasi Turun 20%</Label>
              <Select
                value={data.riskProfile.reaksiPenurunan}
                onValueChange={(value: 'panik_jual' | 'diam' | 'beli_lagi') =>
                  setRiskProfileInfo({ reaksiPenurunan: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih reaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="panik_jual">Panik dan jual semua</SelectItem>
                  <SelectItem value="diam">Diam dan menunggu</SelectItem>
                  <SelectItem value="beli_lagi">Beli lagi karena diskon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tujuan Utama Berinvestasi</Label>
              <Select
                value={data.riskProfile.tujuanInvestasi}
                onValueChange={(value: 'jangka_pendek' | 'jangka_menengah' | 'jangka_panjang') =>
                  setRiskProfileInfo({ tujuanInvestasi: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tujuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jangka_pendek">Jangka Pendek (&lt; 1 tahun)</SelectItem>
                  <SelectItem value="jangka_menengah">Jangka Menengah (1-5 tahun)</SelectItem>
                  <SelectItem value="jangka_panjang">Jangka Panjang (&gt;5 tahun)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      // Step 10: Financial Story
      case 10:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Ceritakan kondisi keuangan Anda saat ini, permasalahan yang sedang dihadapi, dan harapan keuangan ke depan.
            </p>

            <Textarea
              value={data.financialStory}
              onChange={(e) => setFinancialStory(e.target.value)}
              placeholder={`Contoh cerita yang bisa Anda tulis:

• "Saya ingin pindah ke kostan yang lebih bagus dengan harga Rp2.500.000/bulan, apakah memungkinkan dengan gaji saya saat ini?"

• "Saya ditawari asuransi jiwa dengan premi Rp500.000/bulan, apakah saya perlu asuransi ini atau cukup BPJS saja?"

• "Saya ingin membeli rumah dalam 3 tahun ke depan, bagaimana cara menabung untuk DP dan berapa cicilan KPR yang aman?"

• "Saya ingin beli iPhone baru seharga Rp20 juta, apakah layak dengan kondisi keuangan saya?"

• "Saya bingung mau mulai investasi tapi masih punya cicilan dan dana darurat belum cukup."

• "Penghasilan saya fluktuatif sebagai freelancer, bagaimana mengatur keuangan yang tepat?"`}
              rows={12}
              className="min-h-[250px]"
            />

            <p className="text-sm text-muted-foreground">
              Cerita ini akan membantu AI memberikan rekomendasi yang lebih personal dan sesuai dengan kebutuhan Anda.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const StepIcon = steps[currentStep - 1]?.icon || User;

  return (
    <>
      {/* Loading animation overlay */}
      {isGenerating && <GeneratingLoader text="Menganalisis" />}

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <img
              src={logo}
              alt="YouthFinance"
              className="h-8 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
              title="Kembali ke Beranda"
            />
            <div className="text-sm text-muted-foreground">
              Langkah {currentStep} dari {steps.length}
            </div>
          </div>
        </header>

        {/* Progress - Clickable Step Icons */}
        <div className="container mx-auto px-4 pt-6 pb-6">
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 pt-4 md:justify-center scroll-smooth snap-x snap-mandatory">
            {steps.map((step, index) => {
              const StepIconComponent = step.icon;
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isActive = stepNumber === currentStep;

              return (
                <button
                  key={index}
                  onClick={() => setCurrentStep(stepNumber)}
                  className={`
                  flex flex-col items-center gap-1 p-2 rounded-lg transition-all
                  hover:bg-accent/10 cursor-pointer min-w-[60px] flex-shrink-0 snap-start
                  ${isActive ? 'bg-accent/20 ring-2 ring-accent' : ''}
                  ${isCompleted ? 'text-accent' : isActive ? 'text-accent' : 'text-muted-foreground'}
                `}
                  title={step.title}
                >
                  <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-colors
                  ${isActive ? 'bg-accent text-white' : isCompleted ? 'bg-accent/20' : 'bg-secondary'}
                `}>
                    {isCompleted ? (
                      <Check size={18} />
                    ) : (
                      <StepIconComponent size={18} />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight max-w-[60px] truncate">
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Step Content */}
          <Card variant="elevated" className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <StepIcon className="text-accent" size={24} />
                </div>
                <div>
                  <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
                  <CardDescription>{steps[currentStep - 1]?.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="max-w-2xl mx-auto mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft size={16} className="mr-2" />
              Kembali
            </Button>
            <Button
              variant="accent"
              onClick={handleNext}
            >
              {currentStep === 10 ? (
                <>
                  <Check size={16} className="mr-2" />
                  Selesai
                </>
              ) : (
                <>
                  Lanjut
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Onboarding;

