import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinancialStore } from "@/store/financialStore";
import {
  formatCurrency,
  calculateHealthMetrics,
  calculateNetWorth,
  calculateMonthlyIncome,
  calculateMonthlySurplus,
  calculateEmergencyFundNeeded,
  calculateEmergencyFundCurrent,
  getOverallHealthScore,
  generateInvestmentRecommendations,
  calculateExpenseBreakdown,
  calculateRecommendedAllocation,
  calculateRecommendedAllocationValues
} from "@/lib/calculations";
import { detectNarrativeIntents, analyzeLifestyleUpgradeFeasibility } from "@/lib/financialAdvisor";
import type { ExpenseBreakdown } from "@/lib/calculations";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Wallet,
  Info,
  Percent,
  CreditCard,
  Building,
  DollarSign,
  HelpCircle,
  BarChart3
} from "lucide-react";

// Circular Progress Ring Component
const CircularProgress = ({ value, max, color, size = 120, strokeWidth = 10 }: {
  value: number;
  max: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Dynamic font size based on chart size
  const getFontSize = () => {
    if (size <= 50) return 'text-xs';
    if (size <= 80) return 'text-sm';
    if (size <= 100) return 'text-lg';
    return 'text-2xl';
  };

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease-out'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${getFontSize()}`}>{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

// Tooltip component for explanations
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  return (
    <div className="group relative inline-flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50 shadow-lg">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

// Mini Bar Chart Component
const MiniBarChart = ({ value, maxValue, label, color }: {
  value: number;
  maxValue: number;
  label: string;
  color: string;
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-600">{label}</span>
        <span className="text-xs font-semibold">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Expense Pie Chart Component
const ExpensePieChart = ({
  data,
  title,
  totalLabel
}: {
  data: ExpenseBreakdown[];
  title: string;
  totalLabel: string;
}) => {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  // Calculate pie slices
  let currentAngle = 0;
  const slices = data.map(item => {
    const percentage = total > 0 ? (item.amount / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...item, percentage, startAngle, angle };
  });

  // SVG pie chart path generator - smaller radius for better fit
  const getSlicePath = (startAngle: number, angle: number, radius: number = 60) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (startAngle + angle - 90) * (Math.PI / 180);

    const x1 = 80 + radius * Math.cos(startRad);
    const y1 = 80 + radius * Math.sin(startRad);
    const x2 = 80 + radius * Math.cos(endRad);
    const y2 = 80 + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return `M 80 80 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="flex flex-col">
      <h4 className="font-semibold text-sm mb-4 text-center">{title}</h4>

      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4">
        {/* SVG Pie Chart - smaller size */}
        <div className="flex flex-col items-center flex-shrink-0">
          <svg width="140" height="140" viewBox="0 0 160 160">
            {slices.map((slice, index) => (
              <path
                key={index}
                d={getSlicePath(slice.startAngle, slice.angle)}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-300 hover:opacity-80"
              >
                <title>{slice.category}: {formatCurrency(slice.amount)} ({slice.percentage.toFixed(1)}%)</title>
              </path>
            ))}
            {/* Center circle for donut effect */}
            <circle cx="80" cy="80" r="35" fill="white" />
          </svg>

          {/* Total text below the chart */}
          <div className="text-center mt-2">
            <p className="text-xs text-muted-foreground">{totalLabel}</p>
            <p className="text-sm font-bold text-slate-700">{formatCurrency(total)}</p>
          </div>
        </div>

        {/* Detailed Legend with amounts */}
        <div className="flex-1 space-y-1.5 w-full">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center justify-between text-xs gap-2 py-1 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate">{slice.category}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-medium text-slate-700">{formatCurrency(slice.amount)}</span>
                <span className="text-muted-foreground w-10 text-right">({slice.percentage.toFixed(0)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { isOnboardingComplete, getActiveSession, currentSessionId } = useFinancialStore();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Get active session data
  const activeSession = getActiveSession();

  // Show intro state if no completed session
  if (!currentSessionId || !activeSession) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <PiggyBank className="mx-auto mb-6 text-accent" size={64} />
          <h1 className="text-3xl font-bold mb-4">Selamat Datang!</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Lengkapi data keuangan Anda terlebih dahulu untuk melihat analisis dan rekomendasi.
          </p>
          <Button variant="accent" size="lg" onClick={() => navigate('/onboarding')}>
            Mulai Perencanaan
            <ArrowRight className="ml-2" />
          </Button>
        </div>
      </Layout>
    );
  }

  // Use data from active session snapshot (immutable)
  const data = activeSession.userData;
  const healthMetrics = calculateHealthMetrics(data);
  const netWorth = activeSession.summary.netWorth;
  const monthlyIncome = calculateMonthlyIncome(data);
  const surplus = calculateMonthlySurplus(data);
  const emergencyNeeded = calculateEmergencyFundNeeded(data);
  const emergencyCurrent = calculateEmergencyFundCurrent(data);
  const healthScore = activeSession.summary.score;
  const investments = generateInvestmentRecommendations(data);

  const emergencyProgress = emergencyNeeded > 0 ? (emergencyCurrent / emergencyNeeded) * 100 : 0;
  const savingsRatio = monthlyIncome > 0 ? (surplus / monthlyIncome) * 100 : 0;

  // Expense breakdown for pie charts
  const currentExpenses = calculateExpenseBreakdown(data);

  // Detect rental upgrade from user's financial story
  const intents = detectNarrativeIntents(data.financialStory);
  let rentalUpgradeAmount: number | undefined;

  if (intents.mentionsRentalUpgrade && intents.lifestyleUpgrade) {
    const feasibility = analyzeLifestyleUpgradeFeasibility(data, intents.lifestyleUpgrade);
    // Only apply if feasible or marginal
    if (feasibility.status === 'FEASIBLE' || feasibility.status === 'MARGINAL') {
      rentalUpgradeAmount = intents.lifestyleUpgrade.extractedAmount;
    }
  }

  // Pass rental upgrade amount if detected for consistent allocation
  const recommendedAllocation = calculateRecommendedAllocation(data, rentalUpgradeAmount);

  // Get unified allocation values for investment amount display
  const unifiedAllocation = calculateRecommendedAllocationValues(data);
  const totalInvestmentAmount = unifiedAllocation.investmentContribution;

  // Extract goalsContribution from recommendedAllocation (which accounts for rental upgrade)
  // This ensures the goal section shows the same amount as Alokasi Rekomendasi
  const actualGoalsContribution = recommendedAllocation.find(item => item.category === 'Tujuan Keuangan')?.amount || 0;

  const getStatusIcon = (status: string) => {
    if (status === 'healthy') return <CheckCircle className="text-green-500" size={20} />;
    if (status === 'warning') return <AlertTriangle className="text-yellow-500" size={20} />;
    return <AlertTriangle className="text-red-500" size={20} />;
  };

  const getStatusClass = (status: string) => {
    if (status === 'healthy') return 'bg-green-50 border-green-200 text-green-800';
    if (status === 'warning') return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    return 'bg-red-50 border-red-200 text-red-800';
  };

  const getScoreColor = () => {
    if (healthScore >= 80) return '#22c55e'; // green
    if (healthScore >= 60) return '#eab308'; // yellow
    if (healthScore >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getScoreLabel = () => {
    if (healthScore >= 80) return { label: 'Sangat Baik', description: 'Keuangan Anda dalam kondisi sehat!' };
    if (healthScore >= 60) return { label: 'Baik', description: 'Ada beberapa area yang bisa ditingkatkan.' };
    if (healthScore >= 40) return { label: 'Perlu Perhatian', description: 'Beberapa aspek keuangan perlu diperbaiki.' };
    return { label: 'Kritis', description: 'Diperlukan tindakan segera untuk memperbaiki keuangan.' };
  };

  const metricExplanations: Record<string, string> = {
    'Rasio Pengeluaran': 'Persentase pendapatan yang digunakan untuk pengeluaran. Idealnya di bawah 70% agar Anda memiliki ruang untuk menabung.',
    'Rasio Tabungan': 'Persentase pendapatan yang berhasil Anda sisihkan untuk tabungan. Target ideal adalah 20% atau lebih dari pendapatan.',
    'Rasio Hutang': 'Perbandingan cicilan hutang terhadap pendapatan. Sebaiknya tidak lebih dari 30% untuk menjaga kesehatan finansial.',
    'Rasio Solvabilitas': 'Kemampuan aset untuk menutup semua kewajiban. Nilai 100% atau lebih menunjukkan kondisi solvabel.'
  };

  // Dynamic interpretation based on actual metric values
  const getMetricInterpretation = (name: string, value: number, status: string): string => {
    switch (name) {
      case 'Rasio Pengeluaran':
        if (value < 50) {
          return `Luar biasa! Anda hanya menggunakan ${value.toFixed(1)}% pendapatan untuk pengeluaran. Artinya dari setiap Rp 1 juta pendapatan, Anda hanya menggunakan Rp ${(value * 10000).toLocaleString('id-ID')} untuk pengeluaran dan bisa menyisihkan sisanya.`;
        } else if (value < 70) {
          return `Baik! ${value.toFixed(1)}% pendapatan Anda digunakan untuk pengeluaran. Masih tersisa ${(100 - value).toFixed(1)}% (sekitar Rp ${formatCurrency(monthlyIncome * (100 - value) / 100)}) untuk ditabung atau diinvestasikan.`;
        } else if (value < 90) {
          return `Perlu perhatian. ${value.toFixed(1)}% pendapatan habis untuk pengeluaran. Hanya tersisa ${(100 - value).toFixed(1)}% untuk tabungan. Coba kurangi pengeluaran tidak penting.`;
        } else {
          return `Kritis! Hampir seluruh pendapatan (${value.toFixed(1)}%) habis untuk pengeluaran. Anda perlu segera mengevaluasi dan mengurangi pengeluaran.`;
        }

      case 'Rasio Tabungan':
        if (value >= 30) {
          return `Sangat baik! Anda berhasil menabung ${value.toFixed(1)}% dari pendapatan (${formatCurrency(monthlyIncome * value / 100)}/bulan). Ini melebihi target ideal 20%.`;
        } else if (value >= 20) {
          return `Bagus! ${value.toFixed(1)}% pendapatan Anda berhasil ditabung (${formatCurrency(monthlyIncome * value / 100)}/bulan). Anda sudah mencapai target minimum 20%.`;
        } else if (value >= 10) {
          return `Cukup. ${value.toFixed(1)}% pendapatan Anda ditabung (${formatCurrency(monthlyIncome * value / 100)}/bulan). Tingkatkan hingga 20% untuk keamanan finansial yang lebih baik.`;
        } else if (value > 0) {
          return `Perlu ditingkatkan. Hanya ${value.toFixed(1)}% yang bisa ditabung. Target minimal adalah 20% dari pendapatan.`;
        } else {
          return `Kritis! Tidak ada dana yang bisa ditabung. Anda perlu segera mengevaluasi pengeluaran dan mencari cara untuk menyisihkan tabungan.`;
        }

      case 'Rasio Hutang':
        if (value === 0) {
          return `Excellent! Anda tidak memiliki cicilan hutang. Ini kondisi ideal untuk memaksimalkan tabungan dan investasi.`;
        } else if (value < 15) {
          return `Sangat baik! Cicilan hutang hanya ${value.toFixed(1)}% dari pendapatan (${formatCurrency(monthlyIncome * value / 100)}/bulan). Hutang Anda masih sangat terkendali.`;
        } else if (value < 30) {
          return `Masih aman. ${value.toFixed(1)}% pendapatan Anda untuk cicilan (${formatCurrency(monthlyIncome * value / 100)}/bulan). Masih di bawah batas maksimum 30%.`;
        } else if (value < 50) {
          return `Perlu perhatian! ${value.toFixed(1)}% pendapatan habis untuk cicilan. Ini melebihi batas aman 30%. Hindari menambah hutang baru.`;
        } else {
          return `Kritis! Lebih dari separuh pendapatan (${value.toFixed(1)}%) habis untuk cicilan. Pertimbangkan restrukturisasi hutang.`;
        }

      case 'Rasio Solvabilitas':
        if (value >= 200) {
          return `Sangat kuat! Total aset Anda ${value.toFixed(1)}% dari kewajiban. Artinya aset Anda 2x lipat lebih besar dari hutang.`;
        } else if (value >= 100) {
          return `Sehat! Aset Anda (${value.toFixed(1)}%) cukup untuk menutup semua hutang. Kondisi keuangan Anda solvabel.`;
        } else if (value >= 50) {
          return `Perlu perhatian. Aset hanya ${value.toFixed(1)}% dari kewajiban. Fokus pada pelunasan hutang dan penambahan aset.`;
        } else {
          return `Kritis! Aset Anda hanya ${value.toFixed(1)}% dari kewajiban. Anda memiliki net worth negatif. Prioritaskan pelunasan hutang.`;
        }

      default:
        return '';
    }
  };

  const metricIcons: Record<string, React.ReactNode> = {
    'Rasio Pengeluaran': <CreditCard className="text-orange-500" size={24} />,
    'Rasio Tabungan': <PiggyBank className="text-green-500" size={24} />,
    'Rasio Hutang': <Building className="text-red-500" size={24} />,
    'Rasio Solvabilitas': <Shield className="text-blue-500" size={24} />
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Halo, {data.personalInfo.namaLengkap || 'Pengguna'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Berikut ringkasan kesehatan finansial Anda. Klik ikon <HelpCircle size={14} className="inline" /> untuk penjelasan lebih detail.
          </p>
        </div>

        {/* Main Score Card with Circular Progress */}
        <Card variant="elevated" className="mb-8 bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Health Score with Ring */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg width="140" height="140" className="transform -rotate-90">
                    <circle cx="70" cy="70" r="60" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
                    <circle
                      cx="70" cy="70" r="60"
                      stroke={getScoreColor()}
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: 377,
                        strokeDashoffset: 377 - (healthScore / 100) * 377,
                        transition: 'stroke-dashoffset 1s ease-out'
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{healthScore}</span>
                    <span className="text-xs text-white/60">dari 100</span>
                  </div>
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">Skor Kesehatan Finansial</p>
                  <p className="text-xl font-bold" style={{ color: getScoreColor() }}>{getScoreLabel().label}</p>
                  <p className="text-white/60 text-sm mt-1 max-w-xs">{getScoreLabel().description}</p>
                </div>
              </div>

              {/* Net Worth */}
              <div className="text-center md:text-right">
                <div className="flex items-center justify-center md:justify-end gap-2 mb-2">
                  <Wallet className="text-white/70" size={20} />
                  <p className="text-white/70">Kekayaan Bersih</p>
                  <Tooltip content="Total aset dikurangi total kewajiban. Menunjukkan nilai bersih keuangan Anda saat ini.">
                    <HelpCircle size={14} className="text-white/50 cursor-help" />
                  </Tooltip>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white">{formatCurrency(netWorth)}</div>
                <p className="text-white/50 text-xs mt-2">
                  {netWorth >= 0 ? '✓ Aset melebihi kewajiban' : '⚠ Kewajiban melebihi aset'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats with Better Explanations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Pendapatan Bulanan */}
          <Card variant="elevated" className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="text-green-600" size={20} />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">Pendapatan Bulanan</span>
                </div>
                <Tooltip content="Total pendapatan aktif (gaji) dan pasif yang Anda terima setiap bulan.">
                  <HelpCircle size={16} className="text-slate-400 cursor-help" />
                </Tooltip>
              </div>
              <div className="text-2xl font-bold text-slate-800 mb-2">{formatCurrency(monthlyIncome)}</div>
              <p className="text-xs text-slate-500">
                Ini adalah total penghasilan Anda per bulan dari semua sumber.
              </p>
            </CardContent>
          </Card>

          {/* Surplus Bulanan */}
          <Card variant="elevated" className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${surplus >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {surplus >= 0 ? <TrendingUp className="text-green-600" size={20} /> : <TrendingDown className="text-red-600" size={20} />}
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">Surplus Bulanan</span>
                </div>
                <Tooltip content="Selisih antara pendapatan dan pengeluaran. Surplus positif berarti Anda memiliki sisa uang untuk ditabung atau diinvestasikan.">
                  <HelpCircle size={16} className="text-slate-400 cursor-help" />
                </Tooltip>
              </div>
              <div className={`text-2xl font-bold mb-2 ${surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(surplus)}
              </div>
              <div className="flex items-center gap-2 text-xs">
                {surplus >= 0 ? (
                  <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ {savingsRatio.toFixed(1)}% dari pendapatan</span>
                ) : (
                  <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full">⚠ Defisit - pengeluaran melebihi pendapatan</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dana Darurat with Progress */}
          <Card variant="elevated" className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Shield className="text-blue-600" size={20} />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">Dana Darurat</span>
                </div>
                <Tooltip content="Dana cadangan untuk situasi darurat. Idealnya mencukupi 3-6 bulan pengeluaran untuk single, atau 6-12 bulan jika memiliki tanggungan.">
                  <HelpCircle size={16} className="text-slate-400 cursor-help" />
                </Tooltip>
              </div>
              <div className="flex items-center gap-4">
                <CircularProgress
                  value={emergencyCurrent}
                  max={emergencyNeeded}
                  color={emergencyProgress >= 100 ? '#22c55e' : emergencyProgress >= 50 ? '#eab308' : '#ef4444'}
                  size={60}
                  strokeWidth={6}
                />
                <div>
                  <p className="text-xs text-slate-500">Terkumpul</p>
                  <p className="font-bold text-slate-800">{formatCurrency(emergencyCurrent)}</p>
                  <p className="text-xs text-slate-400">dari {formatCurrency(emergencyNeeded)}</p>
                </div>
              </div>
              <p className="text-xs mt-3 text-slate-500">
                {emergencyProgress >= 100
                  ? '✓ Dana darurat Anda sudah mencukupi!'
                  : `Perlu menabung ${formatCurrency(emergencyNeeded - emergencyCurrent)} lagi`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Health Metrics with Visual Bars and Better Icons */}
        <Card variant="elevated" className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <BarChart3 className="text-accent" size={20} />
                </div>
                <div>
                  <CardTitle>Indikator Kesehatan Finansial</CardTitle>
                  <CardDescription>Evaluasi rasio keuangan Anda dengan penjelasan detail</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {healthMetrics.map((metric, index) => (
                <div key={index} className={`p-5 rounded-xl border-2 ${getStatusClass(metric.status)} transition-all hover:shadow-md`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                        {metricIcons[metric.name] || <Percent size={24} />}
                      </div>
                      <div>
                        <span className="font-semibold text-lg">{metric.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Tooltip content={metricExplanations[metric.name] || metric.description}>
                            <HelpCircle size={14} className="text-slate-400 cursor-help" />
                          </Tooltip>
                          <span className="text-xs opacity-70">Target: {metric.target}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusIcon(metric.status)}
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-3xl font-bold">{metric.value.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${metric.status === 'healthy' ? 'bg-green-500' :
                          metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${Math.min(metric.value, 100)}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-sm opacity-90 leading-relaxed">{getMetricInterpretation(metric.name, metric.value, metric.status)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown Comparison - Pie Charts */}
        <Card variant="elevated" className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <BarChart3 className="text-accent" size={20} />
              </div>
              <div>
                <CardTitle>Perbandingan Alokasi Keuangan</CardTitle>
                <CardDescription>Kondisi saat ini vs rekomendasi Financial Advisor</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Current Expenses */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <ExpensePieChart
                  data={currentExpenses}
                  title="📊 Pengeluaran Saat Ini"
                  totalLabel="Total/bulan"
                />
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Berdasarkan data pengeluaran yang Anda masukkan
                </p>
              </div>

              {/* Recommended Allocation */}
              <div className="p-4 bg-green-50 rounded-xl">
                <ExpensePieChart
                  data={recommendedAllocation}
                  title="✨ Alokasi Rekomendasi"
                  totalLabel="Pendapatan"
                />
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Berdasarkan perhitungan yang disesuaikan dengan kebutuhan dan keinginan Anda
                </p>
                <p className="text-xs text-center text-blue-600 mt-2 italic">
                  💡 Tujuan Keuangan adalah target Anda, Investasi adalah alat untuk mencapainya — keduanya saling terhubung.
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">💡 Insight:</p>
              <p className="text-sm text-blue-800">
                {surplus >= 0
                  ? `Surplus Anda saat ini ${formatCurrency(surplus)}/bulan (${savingsRatio.toFixed(1)}% dari pendapatan). ${savingsRatio >= 20 ? 'Bagus! Anda sudah mencapai target minimal 20%.' : 'Idealnya, alokasikan minimal 20% untuk tabungan & investasi.'}`
                  : `Anda mengalami defisit ${formatCurrency(Math.abs(surplus))}/bulan. Perlu mengurangi pengeluaran atau meningkatkan pendapatan.`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Investment Recommendations with Pie Chart Visual */}
        <Card variant="elevated" className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Target className="text-accent" size={20} />
              </div>
              <div>
                <CardTitle>Rekomendasi Investasi</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  Alokasi portofolio berdasarkan profil risiko Anda
                  <Tooltip content="Rekomendasi ini berdasarkan analisis usia, pendapatan, dan toleransi risiko Anda. Diversifikasi membantu mengelola risiko.">
                    <HelpCircle size={14} className="text-slate-400 cursor-help" />
                  </Tooltip>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Total Investment Amount */}
            {totalInvestmentAmount > 0 && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">
                  <span className="font-medium">Total Rekomendasi Investasi:</span>{' '}
                  <span className="font-bold text-green-800">{formatCurrency(totalInvestmentAmount)}/bulan</span>
                </p>
              </div>
            )}

            {/* Visual Allocation Bar */}
            <div className="mb-6">
              <p className="text-sm text-slate-500 mb-2">Visualisasi Alokasi</p>
              <div className="h-6 bg-slate-100 rounded-full overflow-hidden flex">
                {investments.map((inv, index) => {
                  const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-orange-500'];
                  return (
                    <div
                      key={index}
                      className={`${colors[index % colors.length]} h-full transition-all duration-500`}
                      style={{ width: `${inv.allocation}%` }}
                      title={`${inv.instrument}: ${inv.allocation}%`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {investments.map((inv, index) => {
                  const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-orange-500'];
                  return (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                      <span className="text-slate-600">{inv.instrument} ({inv.allocation}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {investments.map((inv, index) => {
                const nominalAmount = (inv.allocation / 100) * totalInvestmentAmount;
                return (
                  <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {inv.allocation}%
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">{inv.instrument}</p>
                        <Tooltip content={`${inv.description}. Return historis sekitar ${inv.expectedReturn}.`}>
                          <Info size={14} className="text-slate-400 cursor-help" />
                        </Tooltip>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{inv.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                          Return: {inv.expectedReturn}
                        </span>
                        {totalInvestmentAmount > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                            {formatCurrency(nominalAmount)}/bulan
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Goals with Better Progress Visualization */}
        {data.financialGoals.length > 0 && (
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Target className="text-accent" size={20} />
                </div>
                <div>
                  <CardTitle>Tujuan Keuangan Anda</CardTitle>
                  <CardDescription>Pantau perkembangan setiap tujuan finansial Anda</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.financialGoals.map((goal, index) => {
                  const progress = goal.targetUang > 0 ? (goal.danaTerkumpul / goal.targetUang) * 100 : 0;
                  const remaining = goal.targetUang - goal.danaTerkumpul;

                  // Calculate monthly needed based on user's timeline
                  const userMonthlyNeeded = goal.targetUang > 0 && goal.jangkaWaktuBulan > 0
                    ? remaining / goal.jangkaWaktuBulan
                    : 0;

                  // Get available allocation for goals from recommendedAllocation (accounts for rental upgrade)
                  // Distribute equally if multiple goals, or single goal gets all
                  const goalsCount = data.financialGoals.length || 1;
                  const availableForThisGoal = actualGoalsContribution / goalsCount;

                  // Calculate adjusted timeframe if allocation is less than needed
                  const adjustedTimeframe = availableForThisGoal > 0
                    ? Math.ceil(remaining / availableForThisGoal)
                    : goal.jangkaWaktuBulan;
                  const needsExtension = availableForThisGoal > 0 && availableForThisGoal < userMonthlyNeeded;

                  // Use the available allocation, not the required amount
                  const recommendedMonthly = Math.min(availableForThisGoal, userMonthlyNeeded);

                  return (
                    <div key={goal.id} className="p-5 border rounded-xl bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-semibold text-lg text-slate-800">{goal.namaTujuan}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                            <span>{goal.jangkaWaktuBulan} bulan</span>
                            <span>•</span>
                            <span className="capitalize">{goal.tipeRisiko}</span>
                          </p>
                        </div>
                        <CircularProgress
                          value={goal.danaTerkumpul}
                          max={goal.targetUang}
                          color={progress >= 100 ? '#22c55e' : '#3b82f6'}
                          size={50}
                          strokeWidth={5}
                        />
                      </div>

                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="text-xs text-slate-500">Target</p>
                          <p className="text-xl font-bold text-accent">{formatCurrency(goal.targetUang)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Terkumpul</p>
                          <p className="text-lg font-semibold text-slate-700">{formatCurrency(goal.danaTerkumpul)}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>

                      {remaining > 0 && (() => {
                        // Determine recommended instrument based on ADJUSTED timeline
                        const effectiveTimeframe = needsExtension ? adjustedTimeframe : goal.jangkaWaktuBulan;
                        let instrument = '';
                        let instrumentDetail = '';
                        if (effectiveTimeframe <= 12) {
                          instrument = 'Deposito / Reksadana Pasar Uang';
                          instrumentDetail = 'aman untuk jangka pendek';
                        } else if (effectiveTimeframe <= 36) {
                          instrument = 'Reksadana Pendapatan Tetap';
                          instrumentDetail = 'cocok untuk 1-3 tahun';
                        } else {
                          instrument = 'Reksadana Campuran / Saham';
                          instrumentDetail = 'optimal untuk jangka panjang';
                        }
                        return (
                          <div className="text-xs bg-slate-50 rounded-lg p-3 space-y-2">
                            {needsExtension ? (
                              <>
                                <p className="text-amber-600">
                                  ⚠️ Dengan surplus tersedia, alokasi untuk tujuan ini adalah <strong>{formatCurrency(availableForThisGoal)}/bulan</strong>
                                </p>
                                <p className="text-slate-600">
                                  💡 Rekomendasi: Perpanjang timeframe dari <strong>{goal.jangkaWaktuBulan} bulan</strong> menjadi <strong className="text-accent">{adjustedTimeframe} bulan</strong> agar keuangan lebih nyaman
                                </p>
                              </>
                            ) : (
                              <p className="text-slate-600">
                                💡 Investasikan <strong className="text-accent">{formatCurrency(recommendedMonthly)}/bulan</strong> untuk mencapai target tepat waktu.
                              </p>
                            )}
                            <p className="text-blue-600">
                              📈 Instrumen: <strong>{instrument}</strong> <span className="text-slate-500">({instrumentDetail})</span>
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA for Full Report */}
        <div className="mt-8 text-center">
          <Button variant="accent" size="lg" onClick={() => navigate('/advisor')}>
            📊 Lihat Laporan Lengkap
            <ArrowRight className="ml-2" />
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
