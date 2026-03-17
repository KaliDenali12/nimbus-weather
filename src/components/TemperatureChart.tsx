import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useWeather } from '@/context/WeatherContext.tsx'
import { convertTemp, formatDayName } from '@/lib/units.ts'

export function TemperatureChart() {
  const { weather, preferences } = useWeather()

  if (!weather) return null

  const unit = preferences.unitPreference

  const data = weather.daily.slice(0, 6).map((day, i) => ({
    name: formatDayName(day.date, i),
    high: convertTemp(day.tempHigh, unit),
    low: convertTemp(day.tempLow, unit),
  }))

  const unitSymbol = unit === 'celsius' ? '°C' : '°F'

  return (
    <section className="glass-card" aria-label="Temperature trend chart">
      <h3 className="font-display text-heading-3 mb-4 text-secondary">
        Temperature Trend
      </h3>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'Figtree' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'Figtree' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}°`}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(20, 30, 50, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                backdropFilter: 'blur(12px)',
                color: '#fff',
                fontFamily: 'Figtree',
                fontSize: '13px',
              }}
              formatter={(value: number, name: string) => [
                `${value}${unitSymbol}`,
                name === 'high' ? 'High' : 'Low',
              ]}
            />
            <Area
              type="monotone"
              dataKey="high"
              stroke="#60a5fa"
              strokeWidth={2}
              fill="url(#highGrad)"
            />
            <Area
              type="monotone"
              dataKey="low"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#lowGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
