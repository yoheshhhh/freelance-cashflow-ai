const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

router.get('/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('due_date', { ascending: true });
  if (error) return res.status(400).json({ error });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([req.body])
    .select();
  if (error) return res.status(400).json({ error });
  res.json(data[0]);
});

router.patch('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('invoices')
    .update(req.body)
    .eq('id', req.params.id)
    .select();
  if (error) return res.status(400).json({ error });
  res.json(data[0]);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(400).json({ error });
  res.json({ success: true });
});

module.exports = router;