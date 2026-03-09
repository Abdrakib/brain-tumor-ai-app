import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface ConfidenceChartProps {
  probs: Record<string, number>
  predLabel?: string
}

const CHART_DATA = [
  { label: 'No Tumor Detected', key: 'no', fill: 'url(#barNo)' },
  { label: 'Tumor Detected', key: 'yes', fill: 'url(#barYes)' },
]

function getProb(probs: Record<string, number>, key: string): number {
  const lower = key.toLowerCase()
  const entry = Object.entries(probs).find(([k]) => k.toLowerCase() === lower)
  return entry ? entry[1] : 0
}

export function ConfidenceChart({ probs }: ConfidenceChartProps) {
  const data = CHART_DATA.map((d) => ({
    ...d,
    value: getProb(probs, d.key) * 100,
  }))

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 p-8 sm:p-10 transition-all duration-500 animate-[fadeIn_0.6s_ease-out_0.2s_forwards] opacity-0">
      <h2 className="text-xl font-semibold text-slate-300 mb-6">Prediction Probability</h2>

      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 8, right: 24, left: 100, bottom: 8 }}
          >
            <defs>
              <linearGradient id="barYes" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#d946ef" stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="barNo" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#475569" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#64748b" stopOpacity={0.8} />
              </linearGradient>
            </defs>

            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
              stroke="#334155"
            />
            <YAxis
              type="category"
              dataKey="label"
              width={130}
              tick={{ fill: '#cbd5e1', fontSize: 13 }}
              stroke="#334155"
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              }}
              labelStyle={{ color: '#cbd5e1' }}
              formatter={(value: number) => [`${value.toFixed(2)}%`, 'Probability']}
              labelFormatter={(label) => label}
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
            />

            <Bar
              dataKey="value"
              radius={[0, 8, 8, 0]}
              maxBarSize={40}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={entry.key === 'yes' ? 'url(#barYes)' : 'url(#barNo)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
