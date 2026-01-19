import { useState, useMemo, useEffect } from 'react';
import type { TimePeriod, Facility, TimeseriesData } from '../types';
import { fetchFacilities, fetchTimeseries } from '../api';
import { transformBackendData, calculateTotalsFromBackend } from '../utils/dataTransform';
import { DynamicLineChart } from './DynamicLineChart';
import { EnergyPieChart } from './EnergyPieChart';

export const DashboardV3: React.FC = () => {
  const [period, setPeriod] = useState<TimePeriod>('day');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [timeseriesData, setTimeseriesData] = useState<TimeseriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from backend
  useEffect(() => {
    loadData(period);
  }, [period]);

  const loadData = async (selectedPeriod: TimePeriod) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch facilities
      const facilitiesData = await fetchFacilities();
      setFacilities(facilitiesData);

      // Calculate time range based on period
      const endTime = new Date();
      let startTime: Date;

      switch (selectedPeriod) {
        case 'week':
          startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'day':
        default:
          startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
          break;
      }

      // Fetch timeseries data
      const timeseries = await fetchTimeseries(startTime, endTime);
      setTimeseriesData(timeseries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Transform backend data to chart format
  const data = useMemo(() => 
    transformBackendData(facilities, timeseriesData, period), 
    [facilities, timeseriesData, period]
  );
  
  const totals = useMemo(() => 
    calculateTotalsFromBackend(facilities, timeseriesData), 
    [facilities, timeseriesData]
  );

  const currentGeneration = useMemo(() => {
    if (data.length === 0) return 0;
    const latest = data[data.length - 1];
    const producers = facilities.filter(f => f.type === 'producer');
    return producers.reduce((sum, facility) => {
      return sum + (Number(latest[facility.name]) || 0);
    }, 0);
  }, [data, facilities]);

  const currentConsumption = useMemo(() => {
    if (data.length === 0) return 0;
    const latest = data[data.length - 1];
    const consumers = facilities.filter(f => f.type === 'consumer');
    return consumers.reduce((sum, facility) => {
      return sum + (Number(latest[facility.name]) || 0);
    }, 0);
  }, [data, facilities]);

  const currentBattery = useMemo(() => {
    return totals.averageBattery;
  }, [totals]);

  const netPower = currentGeneration - currentConsumption;
  const netPowerPercentage = currentConsumption > 0 
    ? Math.abs((netPower / currentConsumption) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading energy data...</p>
          <p className="text-gray-400 text-sm mt-2">Processing {period === 'month' ? 'monthly' : period === 'week' ? 'weekly' : 'daily'} data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <p className="text-red-800 font-semibold mb-2">Error loading data</p>
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={() => loadData(period)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10">
        {/* Compact Header */}
        <header className="backdrop-blur-md bg-white/40 border-b border-white/60 shadow-sm">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                    Energy Hub
                  </h1>
                  <p className="text-xs text-gray-600">Real-time monitoring</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Time Period */}
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-2 py-1.5 rounded-xl shadow-sm border border-white/80">
                  {(['day', 'week', 'month'] as TimePeriod[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        period === p
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                          : 'text-gray-600 hover:bg-white/50'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>


              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1800px] mx-auto px-6 py-6">
          {/* Data Info Badge */}
          {data.length > 0 && (
            <div className="mb-4 flex justify-end">
              <div className="text-xs text-gray-500 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/80">
                📊 {data.length} data points • Optimized for {period}
              </div>
            </div>
          )}

          {/* Metrics Cards - Horizontal Scroll on Mobile */}
          <div className="flex gap-4 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {/* Generation */}
            <div className="min-w-[280px] flex-1 bg-white/50 backdrop-blur-lg rounded-3xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Generation</p>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mt-1 inline-block">AC+DC</span>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-800">{currentGeneration.toFixed(1)}</span>
                <span className="text-lg text-gray-500">kW</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-400 to-violet-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Consumption */}
            <div className="min-w-[280px] flex-1 bg-white/50 backdrop-blur-lg rounded-3xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Consumption</p>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1 inline-block">AC</span>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🔌</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-800">{currentConsumption.toFixed(1)}</span>
                <span className="text-lg text-gray-500">kW</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Net Power */}
            <div className={`min-w-[280px] flex-1 backdrop-blur-lg rounded-3xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
              netPower > 0 
                ? 'bg-emerald-50/70 border-emerald-200/60' 
                : 'bg-orange-50/70 border-orange-200/60'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className={`text-sm font-medium uppercase tracking-wide ${
                    netPower > 0 ? 'text-emerald-700' : 'text-orange-700'
                  }`}>
                    {netPower > 0 ? 'Surplus' : 'Deficit'}
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${
                    netPower > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {netPowerPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                  netPower > 0 
                    ? 'bg-gradient-to-br from-emerald-400 to-green-500' 
                    : 'bg-gradient-to-br from-orange-400 to-amber-500'
                }`}>
                  <span className="text-2xl">{netPower > 0 ? '⬆️' : '⬇️'}</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-800">{Math.abs(netPower).toFixed(1)}</span>
                <span className="text-lg text-gray-500">kW</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${
                  netPower > 0 
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500' 
                    : 'bg-gradient-to-r from-orange-400 to-amber-500'
                }`} style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Battery */}
            <div className="min-w-[280px] flex-1 bg-white/50 backdrop-blur-lg rounded-3xl p-6 border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Battery</p>
                  <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full mt-1 inline-block">DC</span>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🔋</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-gray-800">{currentBattery.toFixed(1)}</span>
                <span className="text-lg text-gray-500">%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${currentBattery}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <DynamicLineChart data={data} facilities={facilities} period={period} type="generation" theme="light" />
            <DynamicLineChart data={data} facilities={facilities} period={period} type="consumption" theme="light" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <EnergyPieChart 
              data={totals.generation} 
              title="Generation Distribution"
              theme="light"
            />
            <EnergyPieChart 
              data={totals.consumption} 
              title="Consumption Distribution"
              theme="light"
            />
          </div>

          {/* Facilities Grid */}
          <div className="bg-white/50 backdrop-blur-lg rounded-3xl p-6 border border-white/60 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full"></div>
              Facilities Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {facilities.map((facility) => {
                const getIcon = (type: string, name: string) => {
                  const lowerName = name.toLowerCase();
                  if (type === 'producer') {
                    if (lowerName.includes('solar')) return '☀️';
                    if (lowerName.includes('wind')) return '💨';
                    return '⚡';
                  }
                  if (type === 'accumulator') return '🔋';
                  // Consumer icons
                  if (lowerName.includes('kitchen')) return '🍳';
                  if (lowerName.includes('living')) return '🛋️';
                  if (lowerName.includes('bedroom')) return '🛏️';
                  if (lowerName.includes('bathroom')) return '🚿';
                  if (lowerName.includes('office')) return '💼';
                  if (lowerName.includes('garage') || lowerName.includes('workshop')) return '🔧';
                  if (lowerName.includes('garden') || lowerName.includes('light')) return '💡';
                  if (lowerName.includes('pool')) return '🏊';
                  return '🏠';
                };

                const getColorClass = (type: string) => {
                  if (type === 'producer') return 'from-amber-400 to-orange-500';
                  if (type === 'accumulator') return 'from-pink-400 to-fuchsia-500';
                  return 'from-cyan-400 to-blue-500';
                };

                const getBadgeClass = (type: string) => {
                  if (type === 'producer') return 'bg-amber-100 text-amber-700';
                  if (type === 'accumulator') return 'bg-pink-100 text-pink-700';
                  return 'bg-cyan-100 text-cyan-700';
                };

                return (
                  <div 
                    key={facility.id}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${getColorClass(facility.type)} rounded-xl flex items-center justify-center text-2xl mb-3 shadow-md mx-auto`}>
                      {getIcon(facility.type, facility.name)}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 text-center mb-1 truncate" title={facility.name}>{facility.name}</p>
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[10px] ${getBadgeClass(facility.type)} px-2 py-0.5 rounded-full capitalize`}>{facility.type}</span>
                      <p className="text-[10px] text-gray-600 font-medium">{facility.max_power} kW</p>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] text-emerald-600 font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
