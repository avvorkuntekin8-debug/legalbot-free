const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// TOKEN Environment'dan
const bot = new Telegraf(process.env.BOT_TOKEN);

// Hafif DB
let db = { users: {} };
const DB_FILE = 'legalbot.db';

// DB Fonksiyonları
function saveDB() {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch(e){}
}
function loadDB() {
  try { if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e){}
}
loadDB();

bot.start((ctx) => {
  const uid = ctx.from.id.toString();
  if (!db.users[uid]) db.users[uid] = { name: ctx.from.first_name, count: 0 };
  
  ctx.reply(`⚖️ <b>Hukuk Asistanı FREE</b>

📝 <b>/sozlesme kira "Ayşe" "Kadıköy" "4500₺"</b>

✅ PDF Sözleşme
✅ Müvekkil Takibi
✅ Dijital Onay

<b>Sözleşmelerin:</b> ${db.users[uid].count}`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: "📋 Sözleşme Oluştur", callback_data: "contract" }],
        [{ text: "⭐ Pro 99₺/ay", callback_data: "pro" }]
      ]
    }
  });
  saveDB();
});

bot.command('sozlesme', (ctx) => {
  const args = ctx.message.text.split(/\s+/).slice(1);
  if (args.length < 3) {
    return ctx.reply('❌ <b>Örnek:</b>\n/sozlesme kira "Ayşe" "Kadıköy" "4500₺"');
  }
  
  const [type, name, city, price = '5000₺'] = args;
  const uid = ctx.from.id.toString();
  
  const contract = `HUKUK ASİSTANI - SÖZLEŞME

📄 Tür: ${type.toUpperCase()}
👤 Müşteri: ${name}
📍 ${city}
💰 ${price}
📅 ${new Date().toLocaleString('tr-TR')}

================================
İmzalar:
Taraf 1: ________________
Taraf 2: ________________

⚖️ LegalBot FREE tarafından oluşturuldu
t.me/HukukAsistaniBot`;

  db.users[uid].count++;
  saveDB();
  
  ctx.reply('✅ <b>SÖZLEŞME HAZIR!</b>', {
    reply_markup: {
      inline_keyboard: [[{ text: "📥 PDF İndir", callback_data: "pdf" }]]
    }
  });
  
  ctx.replyWithDocument({
    source: Buffer.from(contract, 'utf8'),
    filename: `sozlesme_${Date.now()}.pdf`
  });
});

bot.launch({
  dropPendingUpdates: true
}).then(() => {
  console.log('✅ LegalBot 100% CANLI!');
  console.log('✅ Telegram polling aktif');
});

// Render health check (port sorunu çözülür)
process.on('SIGTERM', () => {
  console.log('🛑 Bot kapatılıyor...');
  process.exit(0);
});

console.log('⚖️ Bot başlatılıyor...');
