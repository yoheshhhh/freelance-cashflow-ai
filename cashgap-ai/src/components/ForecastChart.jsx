import {
  CartesianGrid,
  Dot,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function ChartDot(props) {
  const { cx, cy, payload } = props

  if (cx == null || cy == null) {
    return null
  }

  let fill = '#166b5b'
  if (payload.belowZero) {
    fill = '#d64545'
  } else if (payload.belowBuffer) {
    fill = '#d8a100'
  }

  return <Dot cx={cx} cy={cy} fill={fill} r={4} strokeWidth={0} />
}

export default function ForecastChart({ data, minimumBuffer }) {
  return (
    <div className="chart-card">
      <div className="panel-header">
        <h2>12-Week Cash Flow Forecast</h2>
        <p>The line shows projected ending balance each week against your safe buffer.</p>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data} margin={{ bottom: 8, left: 8, right: 16, top: 8 }}>
            <CartesianGrid stroke="rgba(45, 41, 35, 0.08)" strokeDasharray="4 4" />
            <XAxis dataKey="weekStart" tick={{ fill: '#6f665d', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6f665d', fontSize: 12 }} width={90} />
            <Tooltip />
            <ReferenceLine
              label="Buffer"
              stroke="#d8a100"
              strokeDasharray="5 5"
              y={minimumBuffer}
            />
            <ReferenceLine label="Zero" stroke="#d64545" strokeDasharray="5 5" y={0} />
            <Line
              activeDot={{ r: 6 }}
              dataKey="endingBalance"
              dot={<ChartDot />}
              stroke="#166b5b"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
