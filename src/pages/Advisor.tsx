import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useFinancialStore } from "@/store/financialStore";
import { generateAdvisorReport } from "@/lib/financialAdvisor";
import {
    formatCurrency,
    calculateMonthlyIncome,
    calculateMonthlySurplus,
    calculateRecommendedAllocationValues,
    calculateExpenseBreakdown,
    calculateRecommendedAllocation,
    generateInvestmentRecommendations
} from "@/lib/calculations";
import {
    FileText,
    AlertTriangle,
    CheckCircle,
    Target,
    Calendar,
    ArrowRight,
    Shield,
    Download,
    Loader2,
    AlertCircle,
    TrendingUp,
    Clock,
    Info,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import html2pdf from "html2pdf.js";

const Advisor = () => {
    const navigate = useNavigate();
    const {
        isOnboardingComplete,
        getActiveSession,
        currentSessionId,
        clearCurrentSession,
        resetFormForNewUser
    } = useFinancialStore();
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Get active session
    const activeSession = getActiveSession();

    // Guard: Redirect if no active session
    if (!currentSessionId || !activeSession) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-20 text-center">
                    <Shield className="mx-auto mb-6 text-accent" size={64} />
                    <h1 className="text-3xl font-bold mb-4">Profil Belum Lengkap</h1>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        Lengkapi data keuangan Anda terlebih dahulu untuk menerima rekomendasi dari Financial Advisor.
                    </p>
                    <Button variant="accent" size="lg" onClick={() => navigate('/onboarding')}>
                        Lengkapi Profil
                        <ArrowRight className="ml-2" />
                    </Button>
                </div>
            </Layout>
        );
    }

    // Use data and report from active session snapshot (immutable)
    const data = activeSession.userData;
    const advisorReport = activeSession.advisorReport;

    // Guard: If report is somehow null
    if (!advisorReport) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-20 text-center">
                    <FileText className="mx-auto mb-6 text-muted-foreground" size={64} />
                    <h1 className="text-2xl font-bold mb-4">Tidak Dapat Membuat Laporan</h1>
                    <p className="text-muted-foreground">
                        Lengkapi profil keuangan Anda untuk menerima rekomendasi.
                    </p>
                </div>
            </Layout>
        );
    }

    const { diagnosis, priorityIssues, strategies, actionPlan, advisorConclusion } = advisorReport;

    // Group priority issues by classification
    const criticalIssues = priorityIssues.filter(p => p.classification === 'KRITIS');
    const importantIssues = priorityIssues.filter(p => p.classification === 'PENTING');
    const optimizationIssues = priorityIssues.filter(p => p.classification === 'OPTIMISASI');

    // Calculate key metrics for executive summary
    const monthlyIncome = calculateMonthlyIncome(data);
    const surplus = calculateMonthlySurplus(data);

    // Calculate unified allocation values (consistent with Dashboard)
    const unifiedAllocation = calculateRecommendedAllocationValues(data);

    // Check if there's a feasible rental upgrade from strategies
    const rentalUpgradeStrategy = strategies.find(s =>
        s.strategyName === 'Analisis Upgrade Tempat Tinggal'
    );
    // Extract rental amount from strategy if feasible (strategy exists means it was created)
    // Get the targetAmount which is the new rental amount
    const rentalUpgradeAmount = rentalUpgradeStrategy?.targetAmount;

    // Dashboard content for PDF
    const currentExpenses = calculateExpenseBreakdown(data);
    // Pass rental upgrade amount if available to reflect in recommended allocation
    const recommendedAllocation = calculateRecommendedAllocation(data, rentalUpgradeAmount);
    const investments = generateInvestmentRecommendations(data);
    const totalInvestmentAmount = unifiedAllocation.investmentContribution;

    // API Base URL for usage logging
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // Handler for "Selesai & Keluar" - logs usage and resets for new user
    const handleReturnHome = async () => {
        try {
            // Get health score and primary focus from session summary
            const healthScore = activeSession.summary?.score || 0;
            const primaryFocus = activeSession.summary?.keyFocus?.[0] || '';

            // Log usage to backend before clearing data
            await fetch(`${API_BASE}/api/usage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nama: data.personalInfo.namaLengkap || 'Anonymous',
                    total_income_bulanan: monthlyIncome,
                    health_score: Math.round(healthScore),
                    primary_focus: primaryFocus
                })
            });
        } catch (error) {
            // Silently fail - don't block user flow for logging errors
            console.error('Failed to log usage:', error);
        }

        // Clear session and navigate home
        clearCurrentSession();
        resetFormForNewUser();
        navigate('/');
    };

    // Generate Executive Summary
    const getGradeDescription = (grade: string) => {
        const grades: Record<string, string> = {
            'A': 'Sangat Sehat',
            'B': 'Sehat',
            'C': 'Cukup',
            'D': 'Kurang Sehat',
            'F': 'Kritis'
        };
        return grades[grade] || 'N/A';
    };

    // PDF Export Handler with page numbers
    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        const element = document.getElementById('advisor-report');

        if (!element) {
            setIsGeneratingPDF(false);
            return;
        }

        // Use pdfFileName from session snapshot
        const opt = {
            margin: [10, 8, 15, 8] as [number, number, number, number], // top, right, bottom, left - reduced margins
            filename: activeSession.pdfFileName,
            image: { type: 'png' as const, quality: 1 },
            html2canvas: {
                scale: 4, // Higher scale for HD quality
                useCORS: true,
                letterRendering: true,
                logging: false
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait' as const,
                compress: true
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (html2pdf() as any)
                .set(opt)
                .from(element)
                .toPdf()
                .get('pdf')
                .then((pdfDoc: any) => {
                    const totalPages = pdfDoc.internal.getNumberOfPages();
                    for (let i = 1; i <= totalPages; i++) {
                        pdfDoc.setPage(i);
                        pdfDoc.setFontSize(9);
                        pdfDoc.setTextColor(128, 128, 128);
                        pdfDoc.text(
                            `YouthFinance - Halaman ${i} dari ${totalPages}`,
                            pdfDoc.internal.pageSize.getWidth() / 2,
                            pdfDoc.internal.pageSize.getHeight() - 10,
                            { align: 'center' }
                        );
                    }
                })
                .save();
        } catch (error) {
            console.error('PDF generation failed:', error);
        }

        setIsGeneratingPDF(false);
    };

    // Health grade color mapping
    const gradeColors: Record<string, string> = {
        'A': 'text-green-700 bg-green-100 border-green-300',
        'B': 'text-blue-700 bg-blue-100 border-blue-300',
        'C': 'text-yellow-700 bg-yellow-100 border-yellow-300',
        'D': 'text-orange-700 bg-orange-100 border-orange-300',
        'F': 'text-red-700 bg-red-100 border-red-300',
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* ========== REPORT CONTAINER FOR PDF ========== */}
                <div id="advisor-report" className="bg-white text-slate-800 print-container rounded-xl shadow-sm border border-slate-200 overflow-hidden">

                    {/* ========== 1. REPORT HEADER ========== */}
                    <header className="text-center pt-6 pb-6 mb-6 border-b-2 border-slate-200 print-section bg-gradient-to-b from-slate-50 to-white">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                            Laporan Perencanaan Keuangan Pribadi
                        </h1>
                        <p className="text-slate-600 mb-3">
                            Disusun berdasarkan kondisi dan tujuan keuangan Anda
                        </p>
                        <div className="inline-block bg-slate-100 rounded-lg px-4 py-2">
                            <p className="text-sm text-slate-700">
                                <strong>Nama:</strong> <span className="text-slate-900">{data.personalInfo.namaLengkap || 'Pengguna'}</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Dibuat pada: {advisorReport.generatedAt.toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </header>

                    {/* ========== 2. EXECUTIVE SUMMARY ========== */}
                    <section className="mb-10 px-6 print-section">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                <TrendingUp className="text-accent" size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Ringkasan Eksekutif</h2>
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            {/* Large Welcome Greeting */}
                            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-lg p-6 mb-6">
                                <h3 className="text-2xl md:text-3xl font-bold mb-2">
                                    Halo, {data.personalInfo.namaLengkap || 'Pengguna'}!
                                </h3>
                                <p className="text-slate-300">
                                    Berikut ringkasan kesehatan finansial Anda.
                                </p>
                            </div>

                            {/* Large Grade Display */}
                            <div className="flex flex-col md:flex-row gap-6 mb-6">
                                <div className={`flex-shrink-0 w-24 h-24 rounded-2xl flex flex-col items-center justify-center border-4 ${gradeColors[diagnosis.overallHealthGrade]}`}>
                                    <span className="text-4xl font-bold">{diagnosis.overallHealthGrade}</span>
                                    <span className="text-xs font-medium mt-1">
                                        {getGradeDescription(diagnosis.overallHealthGrade)}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-800 mb-2">Kondisi Keuangan Anda</h4>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                        Berdasarkan analisis komprehensif data keuangan Anda, kondisi finansial berada pada level{' '}
                                        <strong className="text-slate-800">{diagnosis.overallHealthGrade} ({getGradeDescription(diagnosis.overallHealthGrade)})</strong>.
                                        {criticalIssues.length > 0 && (
                                            <> Kami mengidentifikasi <strong className="text-red-600">{criticalIssues.length} risiko kritis</strong> yang memerlukan perhatian segera.</>
                                        )}
                                        {strategies.length > 0 && (
                                            <> Fokus utama yang kami rekomendasikan adalah <strong className="text-accent">{strategies[0]?.strategyName}</strong>.</>
                                        )}
                                    </p>
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <div className="bg-slate-100 rounded-lg px-3 py-2">
                                            <span className="text-slate-500">Pendapatan:</span>{' '}
                                            <span className="font-semibold text-slate-800">{formatCurrency(monthlyIncome)}/bulan</span>
                                        </div>
                                        <div className={`rounded-lg px-3 py-2 ${surplus >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                            <span className="text-slate-500">Surplus:</span>{' '}
                                            <span className={`font-semibold ${surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(surplus)}/bulan
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ========== 2.5 FOKUS UTAMA ========== */}
                    {(() => {
                        // Select top 3 issues: Critical first, then Important (exclude Optimization)
                        const fokusIssues = [...priorityIssues]
                            .filter(issue => issue.classification === 'KRITIS' || issue.classification === 'PENTING')
                            .slice(0, 3);

                        if (fokusIssues.length === 0) return null;

                        return (
                            <section className="mb-10 px-6 print-section">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                        <AlertTriangle className="text-orange-600" size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">Fokus Utama Keuangan Anda Saat Ini</h2>
                                </div>

                                <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
                                    <div className="p-1 bg-gradient-to-r from-orange-400 to-red-500"></div>
                                    <div className="p-6">
                                        <p className="text-slate-600 text-sm mb-6">
                                            Berikut adalah {fokusIssues.length} masalah paling penting yang perlu Anda prioritaskan:
                                        </p>

                                        <div className="space-y-4">
                                            {fokusIssues.map((issue, idx) => (
                                                <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-semibold text-slate-800">{issue.issue}</h4>
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${issue.classification === 'KRITIS'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                {issue.classification}
                                                            </span>
                                                        </div>
                                                        {issue.shortExplanation && (
                                                            <p className="text-sm text-slate-600">{issue.shortExplanation}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );
                    })()}

                    {/* ========== 3. FINANCIAL DIAGNOSIS ========== */}
                    <section className="mb-10 px-6 print-section print-page-break">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertCircle className="text-amber-600" size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Diagnosis Keuangan</h2>
                        </div>

                        {diagnosis.weaknesses.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                    <h3 className="font-semibold text-slate-800">Kelemahan Teridentifikasi</h3>
                                    <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                        {diagnosis.weaknesses.length} masalah
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {diagnosis.weaknesses.map((item, idx) => (
                                        <div key={idx} className="bg-white border-l-4 border-red-500 rounded-r-xl shadow-sm overflow-hidden">
                                            <div className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <span className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-red-800">{item.issue}</p>
                                                        <p className="text-sm text-slate-600 mt-2">{item.impact}</p>
                                                        {item.evidence && (
                                                            <div className="mt-3 bg-red-50 rounded-lg p-3">
                                                                <p className="text-xs text-red-600 font-medium mb-1">📊 Bukti:</p>
                                                                <p className="text-sm text-red-700">{item.evidence}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {diagnosis.hiddenRisks.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                                    <h3 className="font-semibold text-slate-800">Risiko Tersembunyi</h3>
                                    <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                        {diagnosis.hiddenRisks.length} risiko
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {diagnosis.hiddenRisks.map((item, idx) => (
                                        <div key={idx} className="bg-white border-l-4 border-orange-500 rounded-r-xl shadow-sm overflow-hidden">
                                            <div className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-orange-800">{item.issue}</p>
                                                        <p className="text-sm text-slate-600 mt-2">{item.impact}</p>
                                                        {item.evidence && (
                                                            <div className="mt-3 bg-orange-50 rounded-lg p-3">
                                                                <p className="text-xs text-orange-600 font-medium mb-1">📊 Bukti:</p>
                                                                <p className="text-sm text-orange-700">{item.evidence}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {diagnosis.falseSecurities.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                    <h3 className="font-semibold text-slate-800">Rasa Aman Palsu</h3>
                                    <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                        {diagnosis.falseSecurities.length} temuan
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {diagnosis.falseSecurities.map((item, idx) => (
                                        <div key={idx} className="bg-white border-l-4 border-yellow-500 rounded-r-xl shadow-sm overflow-hidden">
                                            <div className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <span className="w-7 h-7 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-yellow-800">{item.issue}</p>
                                                        <p className="text-sm text-slate-600 mt-2">{item.impact}</p>
                                                        {item.evidence && (
                                                            <div className="mt-3 bg-yellow-50 rounded-lg p-3">
                                                                <p className="text-xs text-yellow-600 font-medium mb-1">📊 Bukti:</p>
                                                                <p className="text-sm text-yellow-700">{item.evidence}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {diagnosis.weaknesses.length === 0 && diagnosis.hiddenRisks.length === 0 && diagnosis.falseSecurities.length === 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                                <p className="text-green-700 font-medium">Tidak ditemukan masalah signifikan dalam diagnosis.</p>
                            </div>
                        )}
                    </section>

                    {/* ========== 4. PRIORITY ISSUES ========== */}
                    <section className="mb-10 px-6 print-section">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <Target className="text-red-600" size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Prioritas Masalah</h2>
                        </div>

                        {criticalIssues.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded">KRITIS</span>
                                    <span className="text-sm text-slate-600">Harus segera ditangani</span>
                                </div>
                                <div className="space-y-3">
                                    {criticalIssues.map((issue, idx) => (
                                        <div key={idx} className="bg-white border-l-4 border-red-500 rounded-r-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="p-4">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-800">{idx + 1}. {issue.issue}</p>
                                                        {issue.shortExplanation && (
                                                            <p className="text-sm text-slate-600 mt-1">{issue.shortExplanation}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-red-600 font-bold text-lg">{formatCurrency(issue.financialImpact)}</p>
                                                        <p className="text-xs text-slate-500">Dampak Finansial</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-xs text-slate-500 italic">
                                                    💡 Estimasi potensi kerugian finansial jika risiko ini terjadi tanpa mitigasi.
                                                </div>

                                                {/* Kenapa ini KRITIS justification */}
                                                {issue.justification && (
                                                    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                                                        <p className="text-xs font-semibold text-red-700 mb-1">
                                                            ⚠️ Kenapa ini KRITIS:
                                                        </p>
                                                        <p className="text-sm text-red-800 leading-relaxed">
                                                            {issue.justification}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {importantIssues.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded">PENTING</span>
                                    <span className="text-sm text-slate-600">Perlu perhatian dalam waktu dekat</span>
                                </div>
                                <div className="space-y-3">
                                    {importantIssues.map((issue, idx) => (
                                        <div key={idx} className="bg-white border-l-4 border-orange-500 rounded-r-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="p-4">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-800">{idx + 1}. {issue.issue}</p>
                                                        {issue.shortExplanation && (
                                                            <p className="text-sm text-slate-600 mt-1">{issue.shortExplanation}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-orange-600 font-bold text-lg">{formatCurrency(issue.financialImpact)}</p>
                                                        <p className="text-xs text-slate-500">Dampak Finansial</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-xs text-slate-500 italic">
                                                    💡 Estimasi potensi kerugian atau biaya jika masalah ini tidak ditangani dalam waktu dekat.
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {optimizationIssues.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded">OPTIMISASI</span>
                                    <span className="text-sm text-slate-600">Setelah fondasi stabil</span>
                                </div>
                                <div className="space-y-3">
                                    {optimizationIssues.map((issue, idx) => (
                                        <div key={idx} className="bg-white border-l-4 border-blue-500 rounded-r-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="p-4">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-800">{idx + 1}. {issue.issue}</p>
                                                        {issue.shortExplanation && (
                                                            <p className="text-sm text-slate-600 mt-1">{issue.shortExplanation}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-blue-600 font-bold text-lg">{formatCurrency(issue.financialImpact)}</p>
                                                        <p className="text-xs text-slate-500">Estimasi Kebutuhan</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-xs text-slate-500 italic">
                                                    💡 Angka ini adalah estimasi kebutuhan dana untuk merencanakan atau mengoptimalkan aspek keuangan ini.
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {priorityIssues.length === 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                                <p className="text-green-700 font-medium">Tidak ada masalah prioritas yang teridentifikasi.</p>
                            </div>
                        )}
                    </section>

                    {/* ========== 5. RECOMMENDED STRATEGIES ========== */}
                    <section className="mb-10 px-6 print-section print-page-break">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="text-green-600" size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Strategi yang Direkomendasikan</h2>
                        </div>

                        <div className="space-y-6">
                            {strategies.map((strategy, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{strategy.strategyName}</h3>
                                                <p className="text-sm text-slate-600">{strategy.objective}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <p className="text-xs text-slate-500 mb-1">Target</p>
                                                <p className="font-bold text-green-700">{formatCurrency(strategy.targetAmount)}</p>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <p className="text-xs text-slate-500 mb-1">Timeframe</p>
                                                <p className="font-bold text-blue-700">{strategy.timeframe}</p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-sm font-semibold text-slate-700 mb-2">Langkah Spesifik:</p>
                                            <ul className="space-y-2">
                                                {strategy.specificActions.map((action, aIdx) => (
                                                    <li key={aIdx} className="flex items-start gap-2 text-sm text-slate-600">
                                                        <span className="text-accent mt-0.5">•</span>
                                                        <span>{action}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {strategy.tradeoffs && strategy.tradeoffs.length > 0 && (
                                            <div className="bg-amber-50 rounded-lg p-3">
                                                <p className="text-sm font-semibold text-amber-800 mb-2">Pertimbangan:</p>
                                                <ul className="space-y-1">
                                                    {strategy.tradeoffs.map((tradeoff, tIdx) => (
                                                        <li key={tIdx} className="text-sm text-amber-700 flex items-start gap-2">
                                                            <Info size={14} className="mt-0.5 flex-shrink-0" />
                                                            <span>{tradeoff}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {strategies.length === 0 && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                                <p className="text-slate-600">Tidak ada strategi khusus yang direkomendasikan saat ini.</p>
                            </div>
                        )}
                    </section>

                    {/* ========== 6. ACTION PLAN TIMELINE ========== */}
                    <section className="mb-10 px-6 print-section">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Calendar className="text-purple-600" size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Rencana Aksi</h2>
                        </div>

                        {/* Short Term: 0-3 Months */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                                    <Clock size={16} />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">Jangka Pendek (0-3 Bulan)</h3>
                                <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                                    Prioritas Tinggi
                                </span>
                            </div>

                            {actionPlan.shortTerm.length > 0 ? (
                                <div className="grid gap-4 ml-11">
                                    {actionPlan.shortTerm.map((action, idx) => (
                                        <div key={idx} className="bg-white border border-green-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-xs text-green-600 font-medium">Aksi #{idx + 1}</span>
                                                    </div>
                                                    <p className="text-slate-800 font-medium leading-relaxed">{action.action}</p>
                                                </div>
                                                {action.amount > 0 && (
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-xs text-slate-500">Target</p>
                                                        <p className="text-green-600 font-bold">{formatCurrency(action.amount)}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-100">
                                                <Clock size={12} className="text-green-500" />
                                                <span className="text-xs text-slate-500">Selesaikan dalam 0-3 bulan</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic ml-11">Tidak ada aksi jangka pendek yang direkomendasikan.</p>
                            )}
                        </div>

                        {/* Mid Term: 3-12 Months */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                    <Clock size={16} />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">Jangka Menengah (3-12 Bulan)</h3>
                                <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                                    Pengembangan
                                </span>
                            </div>

                            {actionPlan.midTerm.length > 0 ? (
                                <div className="grid gap-4 ml-11">
                                    {actionPlan.midTerm.map((action, idx) => (
                                        <div key={idx} className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-xs text-blue-600 font-medium">Aksi #{idx + 1}</span>
                                                    </div>
                                                    <p className="text-slate-800 font-medium leading-relaxed">{action.action}</p>
                                                </div>
                                                {action.amount > 0 && (
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-xs text-slate-500">Target</p>
                                                        <p className="text-blue-600 font-bold">{formatCurrency(action.amount)}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-100">
                                                <Clock size={12} className="text-blue-500" />
                                                <span className="text-xs text-slate-500">Selesaikan dalam 3-12 bulan</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic ml-11">Tidak ada aksi jangka menengah yang direkomendasikan.</p>
                            )}
                        </div>

                        {/* Long Term: >12 Months */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                                    <Clock size={16} />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">Jangka Panjang (&gt;12 Bulan)</h3>
                                <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                                    Visi Masa Depan
                                </span>
                            </div>

                            {actionPlan.longTerm.length > 0 ? (
                                <div className="grid gap-4 ml-11">
                                    {actionPlan.longTerm.map((action, idx) => (
                                        <div key={idx} className="bg-white border border-purple-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-xs text-purple-600 font-medium">Aksi #{idx + 1}</span>
                                                    </div>
                                                    <p className="text-slate-800 font-medium leading-relaxed">{action.action}</p>
                                                </div>
                                                {action.amount > 0 && (
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-xs text-slate-500">Target</p>
                                                        <p className="text-purple-600 font-bold">{formatCurrency(action.amount)}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-purple-100">
                                                <Clock size={12} className="text-purple-500" />
                                                <span className="text-xs text-slate-500">Target pencapaian &gt;12 bulan</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic ml-11">Tidak ada aksi jangka panjang yang direkomendasikan.</p>
                            )}
                        </div>
                    </section>

                    {/* ========== 7. PERBANDINGAN ALOKASI KEUANGAN ========== */}
                    <section className="mb-8 px-6 print-section print-page-break">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <TrendingUp className="text-blue-600" size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Perbandingan Alokasi Keuangan</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Current Expenses */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <h3 className="font-semibold text-slate-800 mb-3 text-sm">📊 Pengeluaran Saat Ini</h3>
                                <div className="space-y-2">
                                    {currentExpenses.slice(0, 10).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-slate-700">{item.category}</span>
                                            </div>
                                            <span className="font-medium text-slate-800">{formatCurrency(item.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-slate-600">Total:</span>
                                        <span className="text-slate-800">{formatCurrency(currentExpenses.reduce((sum, item) => sum + item.amount, 0))}/bulan</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recommended Allocation */}
                            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                <h3 className="font-semibold text-green-800 mb-3 text-sm">✨ Alokasi Rekomendasi</h3>
                                <div className="space-y-2">
                                    {recommendedAllocation.slice(0, 15).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-green-700">{item.category}</span>
                                            </div>
                                            <span className="font-medium text-green-800">{formatCurrency(item.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-green-200">
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-green-600">Total Pendapatan:</span>
                                        <span className="text-green-800">{formatCurrency(monthlyIncome)}/bulan</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 mt-3 text-center">
                            Berdasarkan perhitungan yang disesuaikan dengan kebutuhan dan keinginan Anda
                        </p>

                        {/* Educational Note */}
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-800 leading-relaxed">
                                <strong>💡 Catatan:</strong> "Tujuan Keuangan" adalah dana yang disiapkan untuk target spesifik Anda (seperti menikah, rumah, atau pendidikan).
                                Dana ini akan diinvestasikan melalui instrumen yang sesuai dengan jangka waktu tujuan tersebut.
                                Sementara "Investasi" adalah alokasi untuk pertumbuhan kekayaan jangka panjang di luar target spesifik Anda.
                            </p>
                        </div>
                    </section>

                    {/* ========== 8. REKOMENDASI INVESTASI ========== */}
                    <section className="mb-8 px-6 print-section">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                <Target className="text-accent" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Rekomendasi Investasi</h2>
                                <p className="text-xs text-slate-500">Alokasi portofolio berdasarkan profil risiko Anda</p>
                            </div>
                        </div>

                        {/* Total Investment Amount */}
                        {totalInvestmentAmount > 0 && (
                            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm text-green-700">
                                    <span className="font-medium">Total Rekomendasi Investasi:</span>{' '}
                                    <span className="font-bold text-green-800">{formatCurrency(totalInvestmentAmount)}/bulan</span>
                                </p>
                            </div>
                        )}

                        {/* Investment Instruments */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {investments.map((inv, idx) => {
                                const nominalAmount = (inv.allocation / 100) * totalInvestmentAmount;
                                return (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {inv.allocation}%
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 text-sm truncate">{inv.instrument}</p>
                                            <p className="text-xs text-slate-500 truncate">{inv.description}</p>
                                            <div className="flex gap-2 mt-1 flex-wrap">
                                                <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                                                    Return: {inv.expectedReturn}
                                                </span>
                                                {totalInvestmentAmount > 0 && (
                                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                                        {formatCurrency(nominalAmount)}/bln
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* ========== 8.5. TUJUAN KEUANGAN ANDA ========== */}
                    {data.financialGoals.length > 0 && (
                        <section className="mb-10 px-6 print-section">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                    <Target className="text-accent" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Tujuan Keuangan Anda</h2>
                                    <p className="text-sm text-slate-500">Pantau perkembangan setiap tujuan finansial Anda</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {data.financialGoals.map((goal, index) => {
                                    const progress = goal.targetUang > 0 ? (goal.danaTerkumpul / goal.targetUang) * 100 : 0;
                                    const remaining = goal.targetUang - goal.danaTerkumpul;
                                    const userMonthlyNeeded = goal.targetUang > 0 && goal.jangkaWaktuBulan > 0
                                        ? remaining / goal.jangkaWaktuBulan
                                        : 0;

                                    // Get actual goals contribution from recommended allocation
                                    const actualGoalsContribution = recommendedAllocation.find(item => item.category === 'Tujuan Keuangan')?.amount || 0;
                                    const goalsCount = data.financialGoals.length || 1;
                                    const availableForThisGoal = actualGoalsContribution / goalsCount;

                                    const adjustedTimeframe = availableForThisGoal > 0
                                        ? Math.ceil(remaining / availableForThisGoal)
                                        : goal.jangkaWaktuBulan;
                                    const needsExtension = availableForThisGoal > 0 && availableForThisGoal < userMonthlyNeeded;
                                    const recommendedMonthly = Math.min(availableForThisGoal, userMonthlyNeeded);

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
                                                <div className="flex flex-col items-center">
                                                    <span className="text-lg font-bold text-accent">{Math.round(progress)}%</span>
                                                    <span className="text-xs text-slate-500">tercapai</span>
                                                </div>
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

                                            {remaining > 0 && (
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
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ========== 9. ADVISOR CONCLUSION ========== */}
                    <section className="mb-10 px-6 print-section print-page-break">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                <FileText className="text-accent" size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Kesimpulan Advisor</h2>
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            {/* Top accent bar */}
                            <div className="h-1.5 bg-gradient-to-r from-accent to-green-500"></div>

                            <div className="p-6">
                                {/* Parse and render conclusion with styled cards */}
                                {(() => {
                                    const sections = advisorConclusion.split('\n\n')
                                        // Filter out duplicate sections since they're already in the signature section
                                        .filter(section => !section.includes('Perjalanan menuju kebebasan finansial'))
                                        .filter(section => !section.includes('Salam hangat'))
                                        .filter(section => !section.includes('AI Financial Advisor YouthFinance'));

                                    return (
                                        <div className="space-y-6">
                                            {sections.map((section, idx) => {
                                                // Greeting (First paragraph with "Kepada")
                                                if (section.startsWith('Kepada')) {
                                                    return (
                                                        <div key={idx} className="text-slate-700 text-lg">
                                                            <span className="font-semibold text-accent">{section.split(',')[0]}</span>
                                                            <span>,</span>
                                                        </div>
                                                    );
                                                }

                                                // Section: MENGENAI PERTANYAAN ANDA
                                                if (section.includes('MENGENAI PERTANYAAN ANDA')) {
                                                    return (
                                                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                            <h4 className="flex items-center gap-2 font-bold text-blue-800 mb-3">
                                                                <Target size={18} />
                                                                Mengenai Pertanyaan Anda
                                                            </h4>
                                                        </div>
                                                    );
                                                }

                                                // Content about mengenai (follow-up to questions)
                                                if (section.startsWith('Mengenai') || section.startsWith('Terkait')) {
                                                    return (
                                                        <div key={idx} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                                            <p className="text-blue-900 leading-relaxed text-sm">{section}</p>
                                                        </div>
                                                    );
                                                }

                                                // Section: PERHATIAN UTAMA
                                                if (section.includes('PERHATIAN UTAMA')) {
                                                    return (
                                                        <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                            <h4 className="flex items-center gap-2 font-bold text-red-800 mb-3">
                                                                <AlertTriangle size={18} />
                                                                Perhatian Utama
                                                            </h4>
                                                        </div>
                                                    );
                                                }

                                                // Critical content
                                                if (section.includes('KRITIS') || section.includes('mengidentifikasi') && section.includes('masalah')) {
                                                    return (
                                                        <div key={idx} className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                                                            <p className="text-red-900 leading-relaxed text-sm">{section}</p>
                                                        </div>
                                                    );
                                                }

                                                // Section: ASPEK POSITIF
                                                if (section.includes('ASPEK POSITIF')) {
                                                    const lines = section.split('\n').filter(l => l.trim());
                                                    const contentLines = lines.slice(1); // Skip header line
                                                    return (
                                                        <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                            <h4 className="flex items-center gap-2 font-bold text-green-800 mb-3">
                                                                <CheckCircle size={18} />
                                                                Aspek Positif
                                                            </h4>
                                                            {contentLines.length > 0 && (
                                                                <div className="space-y-2 text-sm text-green-800">
                                                                    {contentLines.map((line, i) => (
                                                                        <p key={i} className="leading-relaxed">{line.replace(/^\*\*|\*\*$/g, '')}</p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                // Positive content
                                                if (section.toLowerCase().includes('positif') || section.toLowerCase().includes('bagus') || section.toLowerCase().includes('baik untuk')) {
                                                    return (
                                                        <div key={idx} className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                                                            <p className="text-green-900 leading-relaxed text-sm">{section}</p>
                                                        </div>
                                                    );
                                                }

                                                // Section: LANGKAH SELANJUTNYA
                                                if (section.includes('LANGKAH SELANJUTNYA') || (section.includes('LANGKAH') && !section.includes('REKOMENDASI'))) {
                                                    const lines = section.split('\n').filter(l => l.trim());
                                                    const contentLines = lines.slice(1); // Skip header line
                                                    return (
                                                        <div key={idx} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                                            <h4 className="flex items-center gap-2 font-bold text-purple-800 mb-3">
                                                                <ArrowRight size={18} />
                                                                Langkah Selanjutnya
                                                            </h4>
                                                            {contentLines.length > 0 && (
                                                                <div className="space-y-2 text-sm text-purple-800">
                                                                    {contentLines.map((line, i) => (
                                                                        <p key={i} className="leading-relaxed flex items-start gap-2">
                                                                            {/^\d+\./.test(line.trim()) && (
                                                                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold">
                                                                                    {line.trim().charAt(0)}
                                                                                </span>
                                                                            )}
                                                                            <span>{line.replace(/^\d+\.\s*/, '').replace(/^\*\*|\*\*$/g, '')}</span>
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                // Section: REKOMENDASI PRIORITAS
                                                if (section.includes('REKOMENDASI') || section.includes('PRIORITAS')) {
                                                    const lines = section.split('\n').filter(l => l.trim());
                                                    const contentLines = lines.slice(1); // Skip header line
                                                    return (
                                                        <div key={idx} className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                                                            <h4 className="flex items-center gap-2 font-bold text-accent mb-3">
                                                                <Target size={18} />
                                                                Rekomendasi Prioritas
                                                            </h4>
                                                            {contentLines.length > 0 && (
                                                                <div className="space-y-2 text-sm text-accent/90">
                                                                    {contentLines.map((line, i) => (
                                                                        <p key={i} className="leading-relaxed flex items-start gap-2">
                                                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                                                                                {i + 1}
                                                                            </span>
                                                                            <span>{line.replace(/^\*\*|\*\*$/g, '')}</span>
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                // Numbered items
                                                if (/^\d+\./.test(section.trim())) {
                                                    return (
                                                        <div key={idx} className="flex items-start gap-3 py-2">
                                                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/20 shadow-sm flex items-center justify-center text-sm font-bold text-accent">
                                                                {section.trim().charAt(0)}
                                                            </span>
                                                            <p className="text-slate-700 leading-relaxed">{section.trim().replace(/^\d+\.\s*/, '')}</p>
                                                        </div>
                                                    );
                                                }

                                                // Regular paragraphs
                                                return (
                                                    <p key={idx} className="text-slate-700 leading-relaxed">{section}</p>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}

                                {/* Signature */}
                                <div className="mt-8 pt-6 border-t border-slate-200">
                                    <p className="text-slate-700 mb-4">
                                        <strong>🎯 Ingat:</strong> Tujuan Keuangan menentukan arah, sementara Investasi menjadi kendaraan untuk mencapainya. Keduanya saling melengkapi dalam perjalanan finansial Anda.
                                    </p>
                                    <p className="text-slate-600 italic mb-4">
                                        "Perjalanan menuju kebebasan finansial adalah maraton, bukan sprint. Yang penting adalah konsistensi dan disiplin dalam menjalankan rencana ini."
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-green-500 flex items-center justify-center">
                                            <FileText className="text-white" size={20} />
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-sm">Salam hangat,</p>
                                            <p className="font-bold text-accent text-lg">AI Financial Advisor</p>
                                            <p className="text-xs text-slate-400">YouthFinance</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ========== 10. DISCLAIMER ========== */}
                    <section className="mb-6 px-6 pb-6 print-section">
                        <div className="bg-slate-100 border border-slate-300 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-slate-500 flex-shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-1">Disclaimer</p>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Laporan ini bersifat edukatif dan bukan pengganti konsultasi keuangan profesional.
                                        Semua rekomendasi disusun berdasarkan data yang Anda berikan dan analisis algoritma.
                                        Untuk keputusan keuangan besar, silakan konsultasikan dengan perencana keuangan bersertifikat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
                {/* ========== END REPORT CONTAINER ========== */}

                {/* Footer Actions - No Print */}
                <div className="flex flex-col gap-4 pt-6 border-t no-print">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            variant="outline"
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPDF}
                        >
                            {isGeneratingPDF ? (
                                <>
                                    <Loader2 className="mr-2 animate-spin" size={16} />
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2" size={16} />
                                    Download PDF
                                </>
                            )}
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/dashboard')}>
                            Lihat Dashboard
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/onboarding')}>
                            <RefreshCw className="mr-2" size={16} />
                            Perbaharui Data
                        </Button>
                    </div>

                    {/* Session End Button */}
                    <div className="flex justify-center pt-4 border-t border-dashed">
                        <Button
                            variant="accent"
                            size="lg"
                            onClick={handleReturnHome}
                            className="px-8"
                        >
                            <CheckCircle className="mr-2" size={18} />
                            Selesai & Keluar
                        </Button>
                    </div>
                    <p className="text-xs text-center text-slate-500">
                        Klik tombol di atas untuk mengakhiri sesi dan mengosongkan form untuk pengguna berikutnya.
                    </p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-section { page-break-inside: avoid; }
                    .print-page-break { page-break-before: always; }
                    .print-container { 
                        background: white !important;
                        color: black !important;
                    }
                }
            `}</style>
        </Layout>
    );
};

export default Advisor;
