const db = require('../db');

async function createCampaign({ event_id, audience_filter, template, sent_by }) {
  const { rows } = await db.query(
    `INSERT INTO message_campaigns (event_id, audience_filter, template, sent_by)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [event_id, JSON.stringify(audience_filter), template, sent_by]
  );
  return rows[0];
}

async function findCampaigns() {
  const { rows } = await db.query(
    `SELECT mc.*, a.first_name || ' ' || a.surname AS sent_by_name, e.title AS event_title,
            COALESCE(s.sent_count, 0) AS sent_count,
            COALESCE(s.delivered, 0) AS delivered,
            COALESCE(s.bounced, 0) AS bounced
     FROM message_campaigns mc
     LEFT JOIN admins a ON mc.sent_by = a.id
     LEFT JOIN events e ON mc.event_id = e.id
     LEFT JOIN (
       SELECT campaign_id,
              COUNT(*) AS sent_count,
              COUNT(*) FILTER (WHERE status = 'sent') AS delivered,
              COUNT(*) FILTER (WHERE status IN ('bounced','flagged')) AS bounced
       FROM message_log GROUP BY campaign_id
     ) s ON s.campaign_id = mc.id
     ORDER BY mc.sent_at DESC`
  );
  return rows;
}

async function findCampaignById(id) {
  const { rows } = await db.query('SELECT * FROM message_campaigns WHERE id = $1', [id]);
  return rows[0];
}

async function logMessage({ campaign_id, member_id, cell, status }) {
  const { rows } = await db.query(
    `INSERT INTO message_log (campaign_id, member_id, cell, status)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [campaign_id, member_id, cell, status]
  );
  return rows[0];
}

async function getCampaignLog(campaignId) {
  const { rows } = await db.query(
    `SELECT ml.*, m.first_name, m.surname, m.cell, m.province, m.city, m.church,
            m.birthday, m.id AS member_id
     FROM message_log ml
     LEFT JOIN members m ON ml.member_id = m.id
     WHERE ml.campaign_id = $1
     ORDER BY ml.sent_at DESC`,
    [campaignId]
  );
  return rows;
}

async function getCampaignStats(campaignId) {
  const { rows } = await db.query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'sent') AS sent,
      COUNT(*) FILTER (WHERE status = 'bounced') AS bounced,
      COUNT(*) FILTER (WHERE status = 'flagged') AS flagged
     FROM message_log WHERE campaign_id = $1`,
    [campaignId]
  );
  return rows[0];
}

module.exports = { createCampaign, findCampaigns, findCampaignById, logMessage, getCampaignLog, getCampaignStats };
