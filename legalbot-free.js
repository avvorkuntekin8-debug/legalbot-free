// legalbot-free.js - PORT DÜZELTİLMİŞ VERSİYON
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

// 🔧 BOT TOKEN (Environment'dan)
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// 🗄️ JSON DB
let database = { users: {}, contracts: [], clients: {} };
function saveDB() { fs.writeFileSync('legalbot.db.json', JSON.stringify(database, null, 2)); }
function loadDB() { if (fs.existsSync('legalbot.db.json')) database = JSON.parse(fs.readFileSync('legalbot.db.json')); }
loadDB();

bot.start((ctx) => {
  const userId = ctx.from.id.toString();
  if (!database.users[userId]) {
    database.users[userId] = { name: ctx.from.first_name, contracts: 0, clients: 0, pro: false };
    saveDB();
  }
  
  ctx.reply(`⚖️ <b>Hukuk Asistanı FREE</b>\n\n✅ Ücretsiz Sözleşme\n✅ Müvekkil Takibi\n✅ Fatura PDF\n\n/basla - Hemen dene!`, {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('📋 Sözleşme Oluştur', 'templates')],
      [Markup.button.callback('👥 Müvekkiller', 'clients')],
      [Markup.button.callback('⭐ Pro Ol', 'pro')]
    ])
  });
});

bot.command('basla', (ctx) => ctx.reply('🔥 <b>ÖRNEK:</b>\n/sozlesme kira "Ayşe" "Kadıköy" "4500tl" "12ay"'));

bot.command('sozlesme', (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 4) return ctx.reply('❌ <b>Örnek:</b>\n/sozlesme kira "Ayşe" "Kadıköy" "4500tl" "12"');
  
  const [type, clientName, address, amount] = args;
  const userId = ctx.from.id.toString();
  
  const templates = {
    kira: `KİRA SÖZLEŞMESİ\n\nKİRACI: ${clientName}\nADRES: ${address}\nKİRA: ${amount} TL\n\nİmzalar:\nKiraya veren: _______\nKiracı: _______\n\n${new Date().toLocaleString('tr-TR')}`
  };
  
  const contract = templates[type] || templates.kira;
  
  // PDF Buffer
  const pdfBuffer = Buffer.from(contract, 'utf8');
  
  database.users[userId].contracts++;
  saveDB();
  
  ctx.replyWithDocument({ source: pdfBuffer, filename: `sozlesme_${Date.now()}.pdf` });
  ctx.reply(`✅ <b>${type.toUpperCase()} SÖZLEŞMESİ HAZIR!</b>\n\n👤 ${clientName}\n💰 ${amount}\n\n/imzala için hazır!`);
});

bot.launch({
  dropPendingUpdates: true,
  webhook: {
    domain: process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost',
    port: process.env.PORT || 3000
  }
}).then(() => {
  console.log('⚖️ LegalBot CANLI!');
  console.log(`Port: ${process.env.PORT || 3000}`);
});

// 🆓 HTTP Server (Render port için)
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('LegalBot Aktif!'));
app.listen(process.env.PORT || 3000, () => {
  console.log('✅ HTTP Port aktif!');
});
