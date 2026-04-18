function SummaryCard({ label, value, tone = 'default' }) {
  return (
    <article className={`summary-card summary-card-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export default function ForecastSummaryCards({
  currentBalance,
  currencyFormatter,
  forecast,
  minimumBuffer,
}) {
  const firstRiskWeek = forecast.firstRiskyWeek
    ? `${forecast.firstRiskyWeek.label} · ${forecast.firstRiskyWeek.weekStart}`
    : 'No risk in next 12 weeks'

  const lowestBalanceTone =
    forecast.lowestBalance < 0
      ? 'danger'
      : forecast.lowestBalance < minimumBuffer
        ? 'warning'
        : 'safe'

  return (
    <section className="summary-grid">
      <SummaryCard
        label="Current Balance"
        value={currencyFormatter(currentBalance)}
      />
      <SummaryCard
        label="Minimum Buffer"
        value={currencyFormatter(minimumBuffer)}
      />
      <SummaryCard
        label="Lowest Forecast Balance"
        tone={lowestBalanceTone}
        value={currencyFormatter(forecast.lowestBalance)}
      />
      <SummaryCard
        label="First Risk Week"
        tone={forecast.firstRiskyWeek ? lowestBalanceTone : 'safe'}
        value={firstRiskWeek}
      />
    </section>
  )
}
