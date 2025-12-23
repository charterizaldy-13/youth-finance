import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import logo from "@/assets/logo.png";

export const Footer = () => {
  return (
    <footer className="bg-teal-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <img src={logo} alt="YouthFinance" className="h-8 brightness-0 invert mb-4" />
            <p className="text-white/80 text-sm max-w-md mb-4">
              Platform perencanaan keuangan pribadi yang membantu Anda mencapai kebebasan finansial dengan analisis profesional dan rekomendasi yang dipersonalisasi.
            </p>
            {/* Social Media */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/youthfinance.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Navigasi</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/onboarding" className="hover:text-white transition-colors">
                  Mulai Perencanaan
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Fitur</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>Analisis Kesehatan Finansial</li>
              <li>Perencanaan Dana Darurat</li>
              <li>Strategi Pelunasan Hutang</li>
              <li>Rekomendasi Investasi</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/60">
          <p>© {new Date().getFullYear()} YouthFinance. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  );
};
