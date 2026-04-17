const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);

// DB
let db = { users: {} };
function saveDB() { try { fs.writeFileSync('db.json', JSON.stringify(db)); } catch(e){} }
function loadDB() { try { if (fs.existsSync('db.json')) db = JSON.parse(fs.readFileSync('db.json')); } catch(e){} }
loadDB();

bot.start((ctx) => {
  const uid = ctx.from.id.toString();
  if (!db.users[uid]) db.users[uid] = { count: 0 };
  
  ctx.reply(`⚖️ <b>Hukuk Asistanı FREE</b>\n\n📝 <b>/sozlesme kira "Ayşe" "Kadıköy" "4500₺"</b>\n\nSözleşmelerin: ${db.users[uid].count}`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: "📋 Sözleşme", callback_data: "contract" }],
        [{ text: "⭐ Pro", callback_data: "pro" }]
      ]
    }
  });
  saveDB();
});

bot.command('sozlesme', (ctx) => {
  const args = ctx.message.text.split(/\s+/).slice(1);
  if (args.length < 3) return ctx.reply('❌ Örnek: /sozlesme kira "Ayşe" "Kadıköy" "4500₺"');
  
  const [type, name, city, price = '5000₺'] = args;
  const uid = ctx.from.id.toString();
  
  const contract = `HUKUK ASİSTANI SÖZLEŞMESİ\n\nTür: ${type.toUpperCase()}\nMüşteri: ${name}\n${city}\n${price}\n\n${new Date().toLocaleString('tr-TR')}`;
  
  db.users[uid].count++;
  saveDB();
  
  ctx.replyWithDocument({
    source: Buffer.from(contract),
    filename: 'sozlesme.pdf'
  });
});

// 🎯 409 FIX - Polling restart
let updateOffset = 0;
async function safeLaunch() {
  try {
    await bot.launch({
      dropPendingUpdates: true,
      allowedUpdates: ['message', 'callback_query'],
      polling: {
        params: {
          allowed_updates: ['message', 'callback_query']
        }
      }
    });
    console.log('✅ LegalBot 100% CANLI!');
  } catch (error) {
    if (error.response?.error_code === 409) {
      console.log('🔄 409 Conflict - 10sn sonra retry...');
      setTimeout(safeLaunch, 10000);
    } else {
      console.error('❌ Hata:', error.message);
      setTimeout(safeLaunch, 5000);
    }
  }
}

safeLaunch();

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('🛑 Kapatılıyor...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('⚖️ Başlatılıyor...');
