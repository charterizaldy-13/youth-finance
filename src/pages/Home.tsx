import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import {
  Shield,
  TrendingUp,
  Target,
  FileText,
  Calculator,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Wallet,
  Sparkles,
  PieChart,
  LineChart,
  CreditCard,
  Building2,
  Gift,
  Lock,
  Award,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Calculator,
    title: "Analisis Kesehatan Finansial",
    description: "Evaluasi rasio keuangan Anda secara menyeluruh dengan indikator warna yang jelas.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Shield,
    title: "Dana Darurat & Proteksi",
    description: "Hitung kebutuhan dana darurat dan asuransi yang sesuai dengan kondisi Anda.",
    color: "bg-teal/10 text-teal",
  },
  {
    icon: TrendingUp,
    title: "Strategi Pelunasan Hutang",
    description: "Rekomendasi pelunasan hutang dengan metode Avalanche atau Snowball.",
    color: "bg-orange/10 text-orange",
  },
  {
    icon: Target,
    title: "Perencanaan Tujuan",
    description: "Rancang strategi untuk mencapai tujuan finansial Anda dengan timeline yang jelas.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: BarChart3,
    title: "Rekomendasi Investasi",
    description: "Alokasi portofolio sesuai profil risiko dan horizon investasi Anda.",
    color: "bg-gold/10 text-gold",
  },
  {
    icon: FileText,
    title: "Laporan PDF",
    description: "Unduh blueprint keuangan lengkap dalam format profesional.",
    color: "bg-success/10 text-success",
  },
];

const steps = [
  {
    number: "01",
    title: "Isi Data Keuangan",
    description: "Lengkapi informasi pribadi, pendapatan, aset, dan hutang Anda.",
    icon: CreditCard
  },
  {
    number: "02",
    title: "Analisis Otomatis",
    description: "Sistem menganalisis kondisi finansial dan mengidentifikasi area perbaikan.",
    icon: PieChart
  },
  {
    number: "03",
    title: "Terima Rekomendasi",
    description: "Dapatkan strategi dan action plan yang dipersonalisasi.",
    icon: LineChart
  },
  {
    number: "04",
    title: "Unduh Blueprint",
    description: "Simpan laporan keuangan lengkap dalam format PDF.",
    icon: FileText
  },
];

const stats = [
  { value: "10K+", label: "Pengguna Aktif" },
  { value: "95%", label: "Tingkat Kepuasan" },
  { value: "100%", label: "Gratis" },
];

const Home = () => {
  return (
    <Layout>
      {/* Hero Section - Split Layout */}
      <section className="relative overflow-hidden bg-background min-h-[90vh] flex items-center">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl float-animation" />
          <div className="absolute top-1/2 -left-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl float-animation-delayed" />
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl float-animation" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in">
                <Sparkles size={16} />
                <span className="text-sm font-medium">Platform Perencanaan Keuangan #1</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-slide-up leading-tight">
                Kenali Kondisi{" "}
                <span className="text-primary">Finansialmu</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
                Tujuanmu meraih <span className="text-foreground font-medium">financial freedom</span>, dimulai dari sini!
                Dapatkan analisis keuangan profesional setara CFP dalam hitungan menit.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Button size="xl" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25" asChild>
                  <Link to="/onboarding">
                    Mulai Tes Gratis
                    <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" className="border-2" asChild>
                  <Link to="/dashboard">Lihat Demo</Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual - Floating Cards */}
            <div className="order-1 lg:order-2 relative h-[400px] lg:h-[500px]">
              {/* Main Card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 lg:w-80 glass-card p-6 float-animation z-20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Wallet className="text-accent-foreground" size={20} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Aset</div>
                    <div className="font-bold text-lg">Rp 250.000.000</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Kesehatan</span>
                    <span className="text-success font-medium">Sehat</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-accent rounded-full" />
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute top-8 right-8 lg:right-16 glass-card p-4 float-animation-delayed z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="text-primary" size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Investasi</div>
                    <div className="text-sm font-semibold text-success">+12.5%</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 left-4 lg:left-8 glass-card p-4 float-animation z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Shield className="text-accent" size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Dana Darurat</div>
                    <div className="text-sm font-semibold">6 Bulan ✓</div>
                  </div>
                </div>
              </div>

              <div className="absolute top-16 left-8 lg:left-16 glass-card p-4 float-animation z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Target className="text-primary" size={16} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Goals</div>
                    <div className="text-sm font-semibold">3 Aktif</div>
                  </div>
                </div>
              </div>

              {/* Sparkle decorations */}
              <div className="absolute top-4 left-1/4 text-primary sparkle">✦</div>
              <div className="absolute bottom-1/4 right-8 text-accent sparkle" style={{ animationDelay: '0.5s' }}>✦</div>
              <div className="absolute top-1/3 right-4 text-primary sparkle" style={{ animationDelay: '1s' }}>✦</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Clean minimal design */}
      <section className="py-6 bg-white border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="text-primary" size={18} />
              <span className="text-sm font-medium">100% Gratis</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="text-primary" size={18} />
              <span className="text-sm font-medium">Data Aman & Privat</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="text-primary" size={18} />
              <span className="text-sm font-medium">Analisis CFP-Level</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="text-primary" size={18} />
              <span className="text-sm font-medium">Tanpa Registrasi</span>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-accent/10 text-accent px-4 py-1 rounded-full text-sm font-medium mb-4">
              Apa yang kamu dapatkan?
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Fitur Perencanaan <span className="gradient-text">Lengkap</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk merencanakan dan mengelola keuangan pribadi dengan baik.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                variant="elevated"
                className="group hover:border-accent/50 bg-card"
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon size={28} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-medium mb-4">
              Mudah & Cepat
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cara <span className="text-primary">Kerja</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Proses sederhana untuk mendapatkan blueprint keuangan Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center group">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-border" />
                )}

                <div className="relative z-10 mb-4 mx-auto w-24 h-24 rounded-3xl bg-card border-2 border-border flex items-center justify-center group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/10 transition-all duration-300">
                  <step.icon size={32} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="text-sm font-bold text-primary mb-2">Langkah {step.number}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur mb-6">
              <Building2 className="text-white" size={40} />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Siap Merencanakan Keuangan Anda?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Mulai sekarang dan dapatkan blueprint keuangan pribadi Anda dalam hitungan menit.
              <span className="font-semibold text-white"> 100% Gratis!</span>
            </p>
            <Button size="xl" className="bg-white text-primary hover:bg-white/90 shadow-xl" asChild>
              <Link to="/onboarding">
                Mulai Perencanaan Gratis
                <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;