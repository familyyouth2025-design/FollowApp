const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let client = null;
let latestQR = null;
let state = 'disconnected';
let clientInfo = null;

function initClient() {
  if (client) return;

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  // Auto-initialize on module load if auth exists
  const fs = require('fs');
  const hasAuth = fs.existsSync('./.wwebjs_auth');

  client.on('qr', async (qr) => {
    latestQR = await qrcode.toDataURL(qr);
    state = 'qr';
  });

  client.on('ready', () => {
    state = 'ready';
    clientInfo = client.info;
    latestQR = null;
    console.log('WhatsApp ready:', client.info.pushname);
  });

  client.on('authenticated', () => {
    state = 'authenticated';
    console.log('WhatsApp authenticated');
  });

  client.on('disconnected', () => {
    state = 'disconnected';
    latestQR = null;
    clientInfo = null;
    client = null;
  });

  client.on('auth_failure', () => {
    state = 'disconnected';
    latestQR = null;
    clientInfo = null;
  });

  client.initialize().catch((err) => {
    console.error('WhatsApp init error:', err.message);
    state = 'disconnected';
  });
  state = 'connecting';
}

function getClient() {
  return client;
}

function getStatus() {
  return {
    state: state || 'disconnected',
    ready: state === 'ready',
    info: client?.info || null,
  };
}

function getQR() {
  if (!latestQR && state !== 'qr') {
    initClient();
  }
  return latestQR;
}

async function disconnectClient() {
  if (client) {
    try { await client.destroy(); } catch (e) {}
    client = null;
  }
  latestQR = null;
  state = 'disconnected';
}

module.exports = { initClient, getClient, getStatus, getQR, disconnectClient };
