const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  console.log('\n📱 Scan this QR code with WhatsApp:');
  qrcode.generate(qr, { small: true });
  console.log('\n⏳ Waiting for connection...\n');
});

client.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');
  console.log('Connected as:', client.info.pushname || client.info.wid.user);
  
  // Keep the process alive
  console.log('\n💡 The session is now persistent.');
  console.log('You can close this window and the main app will use this session.\n');
});

client.on('authenticated', () => {
  console.log('🔐 Authenticated! Session saved.');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
  console.log('⚠️ Disconnected:', reason);
  console.log('Run this script again to reconnect.');
  process.exit(0);
});

console.log('🚀 Starting WhatsApp client...');
client.initialize();
