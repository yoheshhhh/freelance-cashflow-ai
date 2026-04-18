const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

router.get('/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('clients').select('*').eq('user_id', req.params.userId);
  if (error) return res.status(400).json({ error });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('clients').insert([req.body]).select();
  if (error) return res.status(400).json({ error });
  res.json(data[0]);
});

router.post('/update-reliability/:clientId', async (req, res) => {
  const { clientId } = req.params;

  const { data: invoices } = await supabase
    .from('invoices')
    .select('due_date, paid_date')
    .eq('client_id', clientId)
    .eq('status', 'paid');

  if (!invoices || invoices.length === 0)
    return res.json({ grade: 'A', avgDaysLate: 0 });

  const delays = invoices.map(inv => {
    const due = new Date(inv.due_date);
    const paid = new Date(inv.paid_date);
    return Math.max(0, Math.floor((paid - due) / 86400000));
  });

  const avg = delays.reduce((a, b) => a + b, 0) / delays.length;
  const grade = avg <= 5 ? 'A' : avg <= 15 ? 'B' : avg <= 30 ? 'C' : avg <= 45 ? 'D' : 'F';

  await supabase.from('clients')
    .update({ avg_days_late: Math.round(avg), reliability_grade: grade })
    .eq('id', clientId);

  res.json({ grade, avgDaysLate: Math.round(avg) });
});

module.exports = router;