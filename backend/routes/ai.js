const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/chase-email', async (req, res) => {
  const { clientName, invoiceAmount, daysOverdue, tone } = req.body;

  const toneGuide = {
    polite: 'Write a friendly, professional reminder.',
    firm: 'Write a firm but respectful follow-up making urgency clear.',
    final: 'Write a firm final notice before escalation.'
  };

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: 'You write short professional invoice follow-up emails. Return only the email body, no subject line, no sign-off placeholder.'
        },
        {
          role: 'user',
          content: `${toneGuide[tone]} Client: ${clientName}. Invoice: $${invoiceAmount}. Days overdue: ${daysOverdue}.`
        }
      ]
    });
    res.json({ email: completion.choices[0].message.content });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI request failed' });
  }
});

router.post('/scenario-advice', async (req, res) => {
  const { currentBalance, gapWeeks, newProjectValue, newProjectDate } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content: 'You are a concise financial advisor for freelancers. Give 2-sentence actionable advice only.'
        },
        {
          role: 'user',
          content: `Balance: $${currentBalance}. Gap weeks ahead: ${gapWeeks}. New project worth $${newProjectValue} pays on ${newProjectDate}. Should they take it?`
        }
      ]
    });
    res.json({ advice: completion.choices[0].message.content });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'AI request failed' });
  }
});

module.exports = router;