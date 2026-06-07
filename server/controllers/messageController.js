const { createCampaign, findCampaigns, getCampaignLog, getCampaignStats } = require('../models/messages');
const { findAll: findAllMembers } = require('../models/members');
const { getClient } = require('../whatsapp');
const { logMessage } = require('../models/messages');
const { setWhatsappValid } = require('../models/members');

async function listCampaigns(req, res) {
  const campaigns = await findCampaigns();
  res.json(campaigns);
}

async function send(req, res) {
  const { event_id, audience_filter, template } = req.body;
  const campaign = await createCampaign({ event_id, audience_filter, template, sent_by: req.admin.id });

  const members = await findAllMembers(audience_filter || {});
  const client = getClient();
  const isReady = client && client.info;

  const results = [];
  for (const m of members) {
    const cell = m.cell.replace(/\s/g, '').replace(/^0/, '27'); // remove spaces, convert 082... to 2782...
    const chatId = `${cell}@c.us`;
    let status = 'sent';

    if (isReady) {
      try {
        const msg = template
          .replace(/{Name}/g, `${m.first_name} ${m.surname}`)
          .replace(/{City}/g, m.city || '')
          .replace(/{Province}/g, m.province || '')
          .replace(/{Church}/g, m.church || '')
          .replace(/{Event}/g, '')
          .replace(/{EventDate}/g, '')
          .replace(/{EventAddress}/g, '')
          .replace(/{Target}/g, '');
        await client.sendMessage(chatId, msg);
      } catch (e) {
        console.error(`Failed to send to ${chatId}:`, e.message);
        status = 'bounced';
      }
    } else {
      status = 'bounced';
    }

    await logMessage({ campaign_id: campaign.id, member_id: m.id, cell: m.cell, status });
    results.push({ cell: m.cell, status });
  }

  res.json({ campaign_id: campaign.id, sent: results.length, results });
}

async function campaignLog(req, res) {
  const logs = await getCampaignLog(req.params.id);
  const stats = await getCampaignStats(req.params.id);
  res.json({ logs, stats });
}

module.exports = { listCampaigns, send, campaignLog };
