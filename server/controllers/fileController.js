const path = require('path');
const fs = require('fs');
const { create, remove, findById } = require('../models/files');
const { update: updateEvent } = require('../models/events');

async function upload(req, res) {
  const { event_id } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const row = await create({
    event_id,
    filename: file.filename,
    original_name: file.originalname,
    file_type: file.mimetype,
  });

  // If it's an image or PDF, update the event's flier_url
  const isFlier = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
  if (isFlier && event_id) {
    const fileUrl = `/uploads/${file.filename}`;
    await updateEvent(event_id, { flier_url: fileUrl });
  }

  res.status(201).json({ ...row, flier_url: isFlier ? `/uploads/${file.filename}` : null });
}

async function del(req, res) {
  const row = await findById(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  const filePath = path.join(__dirname, '..', 'uploads', row.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await remove(req.params.id);
  res.json({ ok: true });
}

module.exports = { upload, del };
