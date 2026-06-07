const { toCSV, parseCSV } = require('../utils/csv');
const { findAll: findAllMembers, create: createMember, update: updateMember } = require('../models/members');
const { findAll: findAllEvents, create: createEvent } = require('../models/events');
const db = require('../db');

async function exportMembers(req, res) {
  const members = await findAllMembers(req.query);
  const csv = toCSV(members, [
    { key: 'first_name', header: 'first_name' },
    { key: 'surname', header: 'surname' },
    { key: 'cell', header: 'cell' },
    { key: 'gender', header: 'gender' },
    { key: 'age', header: 'age' },
    { key: 'birthday', header: 'birthday' },
    { key: 'province', header: 'province' },
    { key: 'city', header: 'city' },
    { key: 'church', header: 'church' },
    { key: 'taskforce', header: 'taskforce' },
    { key: 'age_range', header: 'age_range' },
  ]);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="members.csv"');
  res.send(csv);
}

async function importMembers(req, res) {
  const text = req.file?.buffer?.toString('utf-8');
  if (!text) return res.status(400).json({ error: 'No file' });
  const rows = parseCSV(text);
  const results = [];
  const incomplete = [];

  for (const row of rows) {
    try {
      // Check which fields are missing
      const requiredFields = ['first_name', 'surname', 'cell'];
      const optionalFields = ['gender', 'age', 'birthday', 'province', 'city', 'church', 'taskforce', 'age_range'];
      const missing = optionalFields.filter(f => !row[f] || row[f].trim() === '');

      // Clean empty strings to null for DB
      const cleanRow = {};
      for (const [k, v] of Object.entries(row)) {
        cleanRow[k] = (v && v.trim() !== '') ? v.trim() : null;
      }

      // Check if member already exists by cell number
      const { rows: existing } = await db.query('SELECT * FROM members WHERE cell = $1', [cleanRow.cell]);

      let member;
      if (existing.length > 0) {
        // Update only empty fields on existing member
        const existingMember = existing[0];
        const updateData = { ...existingMember };
        let hasChanges = false;
        for (const key of Object.keys(cleanRow)) {
          if (cleanRow[key] && (!existingMember[key] || existingMember[key] === '')) {
            updateData[key] = cleanRow[key];
            hasChanges = true;
          }
        }
        if (hasChanges) {
          member = await updateMember(existingMember.id, updateData);
          member._updated = true;
        } else {
          member = { ...existingMember, _skipped: true };
        }
      } else {
        // Create new member
        member = await createMember(cleanRow);
      }

      if (missing.length > 0) {
        member._incomplete = true;
        member._missingFields = missing;
        incomplete.push(member);
      }
      results.push(member);
    } catch (e) {
      results.push({ error: e.message, row });
    }
  }

  res.json({
    imported: results.filter(r => !r.error && !r._skipped).length,
    updated: results.filter(r => r._updated).length,
    skipped: results.filter(r => r._skipped).length,
    incomplete: incomplete.length,
    errors: results.filter(r => r.error),
    incompleteMembers: incomplete.map(m => ({ id: m.id, name: `${m.first_name} ${m.surname}`, cell: m.cell, missing: m._missingFields }))
  });
}

async function exportEvents(req, res) {
  const events = await findAllEvents();
  const csv = toCSV(events, [
    { key: 'title', header: 'title' },
    { key: 'start_dt', header: 'start_dt' },
    { key: 'end_dt', header: 'end_dt' },
    { key: 'address', header: 'address' },
    { key: 'target_amount', header: 'target_amount' },
  ]);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="events.csv"');
  res.send(csv);
}

async function importEvents(req, res) {
  const text = req.file?.buffer?.toString('utf-8');
  if (!text) return res.status(400).json({ error: 'No file' });
  const rows = parseCSV(text);
  const results = [];
  for (const row of rows) {
    try { results.push(await createEvent({ ...row, created_by: req.admin.id })); } catch (e) { results.push({ error: e.message, row }); }
  }
  res.json({ imported: results.filter(r => !r.error).length, errors: results.filter(r => r.error) });
}

module.exports = { exportMembers, importMembers, exportEvents, importEvents };
