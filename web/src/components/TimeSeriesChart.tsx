import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { statsApi } from '@/lib/api';

interface TimeSeriesChartProps {
  dateRange: { from: string; to: string };
  className?: string;
}

const TIME_SERIES_SOURCES = [
  { value: 'logins', label: 'Logins', color: '#3B82F6' },
  { value: 'tasks', label: 'Tasks', color: '#10B981' },
  { value: 'documents', label: 'Documents', color: '#F59E0B' },
  { value: 'vendor_scans', label: 'Vendor Scans', color: '#8B5CF6' },
  { value: 'security_tests', label: 'Security Tests', color: '#EF4444' },
  { value: 'audits', label: 'Audits', color: '#6B7280' }
];

const GRANULARITY_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'hour', label: 'Hourly' }
];

export default function TimeSeriesChart({ dateRange, className = '' }: TimeSeriesChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState('logins');
  const [granularity, setGranularity] = useState<'hour' | 'day'>('day');
  const [error, setError] = useState<string | null>(null);

  const fetchTimeSeries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const timeSeriesData = await statsApi.getTimeSeries({
        from: dateRange.from,
        to: dateRange.to,
        source: selectedSource,
        granularity: granularity
      });
      
      setData(timeSeriesData);
    } catch (err) {
      console.error('Error fetching time series:', err);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSeries();
  }, [dateRange, selectedSource, granularity]);

  const formatXAxisLabel = (value: string) => {
    if (granularity === 'hour') {
      return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric'
      });
    } else {
      return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getSourceConfig = () => {
    const source = TIME_SERIES_SOURCES.find(s => s.value === selectedSource);
    return source || TIME_SERIES_SOURCES[0];
  };

  const getDataKeys = () => {
    switch (selectedSource) {
      case 'logins':
        return [
          { key: 'total', name: 'Total Logins', color: '#3B82F6' },
          { key: 'success', name: 'Successful', color: '#10B981' },
          { key: 'failed', name: 'Failed', color: '#EF4444' }
        ];
      case 'tasks':
        return [
          { key: 'created', name: 'Created', color: '#3B82F6' },
          { key: 'completed', name: 'Completed', color: '#10B981' }
        ];
      case 'documents':
        return [
          { key: 'created', name: 'Created', color: '#3B82F6' },
          { key: 'approved', name: 'Approved', color: '#10B981' }
        ];
      case 'vendor_scans':
        return [
          { key: 'scans', name: 'Scans', color: '#8B5CF6' },
          { key: 'avg_score', name: 'Avg Score', color: '#F59E0B' }
        ];
      case 'security_tests':
        return [
          { key: 'executions', name: 'Executions', color: '#3B82F6' },
          { key: 'passed', name: 'Passed', color: '#10B981' }
        ];
      case 'audits':
        return [
          { key: 'audits', name: 'Audits', color: '#6B7280' },
          { key: 'avg_score', name: 'Avg Score', color: '#F59E0B' }
        ];
      default:
        return [];
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {formatXAxisLabel(label)}
          </p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
          <p className="text-sm text-gray-600">Time-series data with selectable sources</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-3 sm:mt-0">
          {/* Source Selector */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {TIME_SERIES_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
          
          {/* Granularity Selector */}
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as 'hour' | 'day')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {GRANULARITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Content */}
      {loading ? (
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-80">
          <p className="text-red-600">{error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No data available for the selected period</p>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time_bucket" 
                tickFormatter={formatXAxisLabel}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {getDataKeys().map((dataKey) => (
                <Line
                  key={dataKey.key}
                  type="monotone"
                  dataKey={dataKey.key}
                  stroke={dataKey.color}
                  strokeWidth={2}
                  name={dataKey.name}
                  connectNulls={false}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart Footer with Summary */}
      {!loading && !error && data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>
              <strong>Data Points:</strong> {data.length}
            </span>
            <span>
              <strong>Source:</strong> {getSourceConfig().label}
            </span>
            <span>
              <strong>Granularity:</strong> {granularity === 'hour' ? 'Hourly' : 'Daily'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
