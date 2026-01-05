import { useState, useEffect } from "react";
import {
    Users,
    TrendingUp,
    DollarSign,
    BarChart3,
    Lock,
    RefreshCw,
    Calendar,
    Trash2,
    AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// API Base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface UsageStats {
    totalUsers: number;
    averageIncome: number;
    usersPerDay: { date: string; count: number }[];
    incomeDistribution: { range: string; count: number }[];
    recentEntries: { id: number; nama: string; total_income_bulanan: number; health_score: number; primary_focus: string; created_at: string }[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [storedPassword, setStoredPassword] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nama: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Check if already authenticated
    useEffect(() => {
        const savedPassword = sessionStorage.getItem("adminPassword");
        if (savedPassword) {
            setStoredPassword(savedPassword);
            verifyAndLoadStats(savedPassword);
        }
    }, []);

    const verifyAndLoadStats = async (pwd: string) => {
        setIsLoading(true);
        setError("");

        try {
            // Verify password
            const verifyRes = await fetch(`${API_BASE}/api/admin/verify`, {
                headers: {
                    'Authorization': `Bearer ${pwd}`
                }
            });

            if (!verifyRes.ok) {
                setError("Password salah");
                sessionStorage.removeItem("adminPassword");
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            // Load stats
            const statsRes = await fetch(`${API_BASE}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${pwd}`
                }
            });

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
                setIsAuthenticated(true);
                setStoredPassword(pwd);
                sessionStorage.setItem("adminPassword", pwd);
            }
        } catch (err) {
            setError("Gagal menghubungi server. Pastikan server berjalan.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        verifyAndLoadStats(password);
    };

    const handleRefresh = () => {
        if (storedPassword) {
            verifyAndLoadStats(storedPassword);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("adminPassword");
        setIsAuthenticated(false);
        setStats(null);
        setPassword("");
        setStoredPassword("");
    };

    const handleDelete = async () => {
        if (!deleteConfirm || !storedPassword) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/user/${deleteConfirm.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${storedPassword}`
                }
            });

            if (res.ok) {
                // Refresh stats after delete
                await verifyAndLoadStats(storedPassword);
            }
        } catch (err) {
            console.error('Failed to delete:', err);
        } finally {
            setIsDeleting(false);
            setDeleteConfirm(null);
        }
    };

    // Login Screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                            <Lock className="text-accent" size={24} />
                        </div>
                        <CardTitle className="text-xl">Admin Dashboard</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Masukkan password untuk mengakses
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                            {error && (
                                <p className="text-sm text-red-500 text-center">{error}</p>
                            )}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading || !password}
                            >
                                {isLoading ? "Memverifikasi..." : "Masuk"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Admin Dashboard
    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">YouthFinance Admin</h1>
                        <p className="text-sm text-muted-foreground">Monitoring Penggunaan Aplikasi</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                            <span className="ml-2">Refresh</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Users className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Pengguna</p>
                                    <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="text-green-600" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Rata-rata Penghasilan</p>
                                    <p className="text-xl font-bold">{formatCurrency(stats?.averageIncome || 0)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="text-purple-600" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Hari Ini</p>
                                    <p className="text-2xl font-bold">
                                        {stats?.usersPerDay.find(d => d.date === new Date().toISOString().split('T')[0])?.count || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="text-orange-600" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">7 Hari Terakhir</p>
                                    <p className="text-2xl font-bold">
                                        {stats?.usersPerDay.slice(-7).reduce((sum, d) => sum + d.count, 0) || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Users Per Day Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp size={20} />
                                Pengguna per Hari (30 Hari Terakhir)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats?.usersPerDay && stats.usersPerDay.length > 0 ? (
                                <div className="h-48 flex items-end gap-1">
                                    {stats.usersPerDay.slice(-14).map((day, i) => {
                                        const max = Math.max(...stats.usersPerDay.map(d => d.count));
                                        const height = max > 0 ? (day.count / max) * 100 : 0;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center">
                                                <div
                                                    className="w-full bg-accent rounded-t transition-all"
                                                    style={{ height: `${Math.max(height, 5)}%` }}
                                                    title={`${day.date}: ${day.count} pengguna`}
                                                />
                                                <span className="text-[10px] text-muted-foreground mt-1 rotate-45 origin-left">
                                                    {day.date.slice(5)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">Belum ada data</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Income Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 size={20} />
                                Distribusi Penghasilan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats?.incomeDistribution && stats.incomeDistribution.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.incomeDistribution.map((item, i) => {
                                        const max = Math.max(...stats.incomeDistribution.map(d => d.count));
                                        const width = max > 0 ? (item.count / max) * 100 : 0;
                                        return (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="w-24 text-sm text-muted-foreground">{item.range}</span>
                                                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                                                    <div
                                                        className="h-full bg-accent rounded-full flex items-center justify-end px-2"
                                                        style={{ width: `${Math.max(width, 10)}%` }}
                                                    >
                                                        <span className="text-xs text-white font-medium">{item.count}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">Belum ada data</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Entries Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>10 Pengguna Terbaru</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats?.recentEntries && stats.recentEntries.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-2">ID</th>
                                            <th className="text-left py-3 px-2">Nama</th>
                                            <th className="text-right py-3 px-2">Penghasilan</th>
                                            <th className="text-center py-3 px-2">Skor</th>
                                            <th className="text-left py-3 px-2">Fokus Utama</th>
                                            <th className="text-right py-3 px-2">Waktu</th>
                                            <th className="text-center py-3 px-2">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recentEntries.map((entry) => (
                                            <tr key={entry.id} className="border-b hover:bg-slate-50">
                                                <td className="py-3 px-2 text-muted-foreground">#{entry.id}</td>
                                                <td className="py-3 px-2 font-medium">{entry.nama}</td>
                                                <td className="py-3 px-2 text-right">{formatCurrency(entry.total_income_bulanan)}</td>
                                                <td className="py-3 px-2 text-center">
                                                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold ${entry.health_score >= 70 ? 'bg-green-100 text-green-700' :
                                                        entry.health_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {entry.health_score}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 max-w-48 truncate" title={entry.primary_focus}>
                                                    {entry.primary_focus || '-'}
                                                </td>
                                                <td className="py-3 px-2 text-right text-muted-foreground text-xs">{formatDate(entry.created_at)}</td>
                                                <td className="py-3 px-2 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => setDeleteConfirm({ id: entry.id, nama: entry.nama })}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">Belum ada data pengguna</p>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="text-red-600" size={20} />
                            </div>
                            <h3 className="text-lg font-semibold">Konfirmasi Hapus</h3>
                        </div>
                        <p className="text-muted-foreground mb-6">
                            Apakah Anda yakin ingin menghapus data <strong>{deleteConfirm.nama}</strong> (ID: #{deleteConfirm.id})?
                            Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteConfirm(null)}
                                disabled={isDeleting}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Menghapus...' : 'Hapus'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
