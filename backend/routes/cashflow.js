const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

router.get('/forecast/:userId', async (req, res) => {
  const { userId } = req.params;
  const days = parseInt(req.query.days) || 90;

  const { data: user } = await supabase
    .from('users').select('*').eq('id', userId).single();

  const { data: invoices } = await supabase
    .from('invoices').select('*')
    .eq('user_id', userId)
    .eq('status', 'pending');

  const { data: clients } = await supabase
    .from('clients').select('*').eq('user_id', userId);

  const clientMap = {};
  (clients || []).forEach(c => { clientMap[c.id] = c; });

  const weeklyExpenses = (user?.monthly_expenses || 0) / 4;
  const buffer = user?.safety_buffer || 500;
  let balance = user?.current_balance || 0;

  const weeks = [];
  const today = new Date();

  for (let w = 0; w < Math.ceil(days / 7); w++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    let inflow = 0;
    const inflowInvoices = [];

    (invoices || []).forEach(inv => {
      const client = clientMap[inv.client_id];
      const avgLate = client?.avg_days_late || 0;
      const realisticDate = new Date(inv.due_date);
      realisticDate.setDate(realisticDate.getDate() + avgLate);

      if (realisticDate >= weekStart && realisticDate <= weekEnd) {
        inflow += inv.amount;
        inflowInvoices.push({
          id: inv.id,
          client: inv.client_name,
          amount: inv.amount
        });
      }
    });

    balance = balance + inflow - weeklyExpenses;

    weeks.push({
      week: w + 1,
      weekLabel: weekStart.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' }),
      balance: Math.round(balance),
      inflow: Math.round(inflow),
      outflow: Math.round(weeklyExpenses),
      isGap: balance < buffer,
      isCritical: balance < 0,
      invoices: inflowInvoices
    });
  }

  res.json({ weeks, currency: user?.currency || 'SGD' });
});

router.get('/chase/:userId', async (req, res) => {
  const { userId } = req.params;

  const { data: invoices } = await supabase
    .from('invoices').select('*')
    .eq('user_id', userId)
    .eq('status', 'pending');

  const today = new Date();
  const ranked = (invoices || []).map(inv => {
    const due = new Date(inv.due_date);
    const daysOverdue = Math.max(0, Math.floor((today - due) / 86400000));
    const urgencyScore = (inv.amount * 0.4) + (daysOverdue * 15);
    return { ...inv, daysOverdue, urgencyScore: Math.round(urgencyScore) };
  }).sort((a, b) => b.urgencyScore - a.urgencyScore);

  res.json(ranked);
});

module.exports = router;