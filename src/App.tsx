import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Thermometer, 
  Wind, 
  Sprout, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  RefreshCw,
  CloudRain,
  Sun,
  Menu,
  X,
  ChevronRight,
  BrainCircuit
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { Card } from './components/Card';
import { getCropAdvice, getMarketInsights, CropAdvice } from './services/geminiService';
import { format } from 'date-fns';

const REGIONS = [
  { city: "Mogadishu", state: "Banaadir" },
  { city: "Hargeisa", state: "Maroodi Jeex" },
  { city: "Kismayo", state: "Jubbada Hoose" },
  { city: "Baidoa", state: "Bay" },
  { city: "Garowe", state: "Nugaal" },
  { city: "Jowhar", state: "Shabeellaha Dhexe" },
  { city: "Afgooye", state: "Shabeellaha Hoose" },
  { city: "Bal'ad", state: "Shabeellaha Dhexe" },
  { city: "Beledweyne", state: "Hiiraan" }
];

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0].city);
  const [latestStats, setLatestStats] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [marketInsights, setMarketInsights] = useState<string>("");
  const [cropAdvice, setCropAdvice] = useState<CropAdvice | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPumpOn, setIsPumpOn] = useState(false);

  useEffect(() => {
    fetchLatestStats();
    fetchMarketData();
  }, []);

  useEffect(() => {
    fetchHistory(selectedRegion);
  }, [selectedRegion]);

  const fetchLatestStats = async () => {
    try {
      const res = await fetch('/api/sensors/latest');
      const data = await res.json();
      setLatestStats(data);
    } catch (err) {
      console.error("Failed to fetch latest stats", err);
    }
  };

  const fetchHistory = async (region: string) => {
    try {
      const res = await fetch(`/api/sensors/history/${region}`);
      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const fetchMarketData = async () => {
    const insights = await getMarketInsights();
    setMarketInsights(insights);
  };

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const latest = latestStats.find(d => d.region === selectedRegion) || latestStats[0];
      const advice = await getCropAdvice("Maize", selectedRegion, latest);
      setCropAdvice(advice);
    } catch (err) {
      console.error("Failed to get advice", err);
    } finally {
      setLoadingAdvice(false);
    }
  };

  const currentStats = latestStats.find(d => d.region === selectedRegion) || {
    soil_moisture: 0,
    temperature: 0,
    humidity: 0
  };

  const chartData = historyData
    .map(d => ({
      time: format(new Date(d.timestamp), 'HH:mm'),
      moisture: d.soil_moisture,
      temp: d.temperature
    }))
    .reverse();

  return (
    <div className="min-h-screen flex bg-[#F8F9FA]">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white border-r border-black/5 z-50 transition-transform lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <Sprout size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">SomaliAgro</h1>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Kormeerka Caqliga ah</p>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-4 px-3">Gobollada</p>
            {REGIONS.map(item => (
              <button
                key={item.city}
                onClick={() => {
                  setSelectedRegion(item.city);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  selectedRegion === item.city 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <div className="flex flex-col items-start gap-0.5">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>{item.city}</span>
                  </div>
                  <span className="text-[10px] opacity-60 ml-5">{item.state}</span>
                </div>
                {selectedRegion === item.city && <ChevronRight size={14} />}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-black/5">
            <div className="bg-zinc-900 rounded-xl p-4 text-white">
              <p className="text-xs font-medium opacity-60 mb-1">System Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm font-semibold">All Sensors Online</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="h-16 border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-zinc-100 rounded-lg lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
              Xogta <span className="text-zinc-300">/</span> <span className="text-emerald-600">{selectedRegion}</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                fetchLatestStats();
                fetchHistory(selectedRegion);
              }}
              className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
              title="Cusboonaysii Xogta"
            >
              <RefreshCw size={18} />
            </button>
            <div className="h-8 w-[1px] bg-black/5 mx-2" />
            <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-50 rounded-full border border-black/5">
              <div className="w-6 h-6 rounded-full bg-zinc-200 overflow-hidden">
                <img src="https://picsum.photos/seed/farmer/100/100" alt="Avatar" referrerPolicy="no-referrer" />
              </div>
              <span className="text-xs font-medium text-zinc-700">Shukri Hussein</span>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              title="Qoyaanka Ciidda" 
              subtitle="Dareemaha tooska ah"
              icon={<Droplets className="text-blue-500" size={20} />}
            >
              <div className="mt-2">
                <span className="text-3xl font-bold tracking-tight">{currentStats.soil_moisture.toFixed(1)}%</span>
                <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-medium">
                  <TrendingUp size={12} />
                  <span>+2.4% saacadii u dambaysay</span>
                </div>
              </div>
            </Card>

            <Card 
              title="Heerkulka" 
              subtitle="Hawada deegaanka"
              icon={<Thermometer className="text-orange-500" size={20} />}
            >
              <div className="mt-2">
                <span className="text-3xl font-bold tracking-tight">{currentStats.temperature.toFixed(1)}°C</span>
                <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                  <Sun size={12} />
                  <span>Shucaaca qorraxda waa sarreeyaa</span>
                </div>
              </div>
            </Card>

            <Card 
              title="Uumiga Hawada" 
              subtitle="Qoyaanka hawada"
              icon={<Wind className="text-cyan-500" size={20} />}
            >
              <div className="mt-2">
                <span className="text-3xl font-bold tracking-tight">{currentStats.humidity.toFixed(1)}%</span>
                <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                  <CloudRain size={12} />
                  <span>Fursad yar oo roob ah</span>
                </div>
              </div>
            </Card>

            <Card 
              title="Caafimaadka Dalagga" 
              subtitle="Qiyaasta AI"
              icon={<Sprout className="text-emerald-500" size={20} />}
            >
              <div className="mt-2">
                <span className="text-3xl font-bold tracking-tight">Wanaagsan</span>
                <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Korasimo Caafimaad leh</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Area */}
            <Card className="lg:col-span-2" title="Taariikhda Dareemayaasha" subtitle="Dhaqdhaqaaqa 24-kii saac ee u dambeeyey">
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      minTickGap={30}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="moisture" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorMoisture)" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="temp" 
                      stroke="#f97316" 
                      strokeWidth={2} 
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* AI Insights */}
            <Card title="Khubaro AI ah" subtitle="Waxaa ku shaqeeya Gemini" icon={<BrainCircuit size={20} className="text-purple-500" />}>
              <div className="space-y-4 mt-4">
                {!cropAdvice ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                      <BrainCircuit size={24} />
                    </div>
                    <p className="text-sm text-zinc-500 mb-4">Hel talooyin gaar ah oo ku saabsan dalagyadaada adoo isticmaalaya xogta hadda jirta.</p>
                    <button 
                      onClick={handleGetAdvice}
                      disabled={loadingAdvice}
                      className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loadingAdvice ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Baadhaya...
                        </>
                      ) : (
                        "Soo saar Talooyin"
                      )}
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Xaaladda Caafimaadka</p>
                      <p className="text-sm text-emerald-700">{cropAdvice.healthStatus}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Talooyinka</p>
                      <ul className="space-y-2">
                        {cropAdvice.recommendations.map((rec, i) => (
                          <li key={i} className="flex gap-2 text-sm text-zinc-600">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {cropAdvice.pestWarning && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                        <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Digniin Cayayaan</p>
                          <p className="text-sm text-amber-700">{cropAdvice.pestWarning}</p>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => setCropAdvice(null)}
                      className="w-full py-2 text-xs text-zinc-400 font-medium hover:text-zinc-600 transition-colors"
                    >
                      Dib u bilow Baadhista
                    </button>
                  </motion.div>
                )}
              </div>
            </Card>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Isbeddelka Suuqa" subtitle="Isweydaarsiga Beeraha Soomaaliya" icon={<TrendingUp size={20} className="text-emerald-500" />}>
              <div className="mt-4 markdown-body">
                {marketInsights ? (
                  <Markdown>{marketInsights}</Markdown>
                ) : (
                  <div className="flex items-center justify-center py-10">
                    <RefreshCw size={24} className="text-zinc-200 animate-spin" />
                  </div>
                )}
              </div>
            </Card>

            <Card title="Xakamaynta Waraabka" subtitle="Nidaamka Tooska ah" icon={<Droplets size={20} className="text-blue-500" />}>
              <div className="mt-4 space-y-6">
                <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-black/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <Droplets size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Bambada Weyn</p>
                      <p className="text-xs text-zinc-500">Kuxiran Qaybta A-4</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-bold uppercase transition-colors", !isPumpOn ? "text-zinc-900" : "text-zinc-400")}>Dami</span>
                    <button 
                      onClick={() => setIsPumpOn(!isPumpOn)}
                      className={cn(
                        "w-12 h-6 rounded-full relative transition-all duration-300",
                        isPumpOn ? "bg-emerald-500" : "bg-zinc-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                        isPumpOn ? "left-7" : "left-1"
                      )} />
                    </button>
                    <span className={cn("text-xs font-bold uppercase transition-colors", isPumpOn ? "text-emerald-600" : "text-zinc-400")}>Shid</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <span>Isticmaalka Biyaha</span>
                    <span>420L / 1000L</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '42%' }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-black/5 text-center">
                    <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Jadwalka Xiga</p>
                    <p className="text-sm font-semibold">05:30 AM</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-black/5 text-center">
                    <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Muddada</p>
                    <p className="text-sm font-semibold">45 Daqiiqo</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
