require('dotenv').config();

const express = require('express');
const cors = require('cors');
const supabase = require('./supabase');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/cashflow', require('./routes/cashflow'));
app.use('/api/clients', require('./routes/clients'));

// Test DB route
app.get('/test-db', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*');

  if (error) return res.json({ error });
  res.json(data);
});

// Start server
app.listen(process.env.PORT || 4000, () => {
  console.log('Server running on port 4000');
});