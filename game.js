// Шаг 1: один столик, один заказ, монеты, сохранение в localStorage
// Версия 3: раскладка по долям экрана (без наложений), скруглённые элементы, пузырь заказа

const SAVE_KEY = 'cafe-save';
const ORDER_MIN_DELAY = 5000;
const ORDER_MAX_DELAY = 10000;
const ORDER_REWARD = 10;

const COLORS = {
  wall: 0x2b241e,
  floor: 0x3a2e25,
  coin: '#ffd76a',
  client: 0x4a7fb5,
  clientDark: 0x2d4f73,
  table: 0x8b5a2b,
  tableDark: 0x5a3617,
  bubble: 0xfff6e5,
  text: '#f3e3c8',
  hint: '#bfb3a3',
  reward: '#7dff8a'
};

function loadCoins() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw).coins || 0 : 0;
  } catch (e) {
    return 0;
  }
}

function saveCoins(coins) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ coins }));
  } catch (e) {
    // localStorage недоступен, игра продолжает работать без сохранения
  }
}

class CafeScene extends Phaser.Scene {
  constructor() {
    super('cafe');
  }

  create() {
    this.coins = loadCoins();
    this.hasOrder = false;

    this.bg = this.add.graphics();
    this.coinText = this.add.text(0, 0, '', {
      fontSize: '34px', color: COLORS.coin, fontFamily: 'sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.client = this.add.graphics();
    this.clientLabel = this.add.text(0, 0, 'Клиент', {
      fontSize: '20px', color: COLORS.text, fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    this.bubble = this.add.graphics().setVisible(false);
    this.orderText = this.add.text(0, 0, '', {
      fontSize: '26px', color: '#3a2e25', fontFamily: 'sans-serif',
      align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    this.tableGfx = this.add.graphics();
    this.tableZone = this.add.zone(0, 0, 1, 1).setOrigin(0.5);
    this.tableZone.setInteractive({ useHandCursor: true });
    this.tableZone.on('pointerdown', () => this.serveOrder());
    this.tableLabel = this.add.text(0, 0, '☕ Подать', {
      fontSize: '22px', color: COLORS.text, fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    this.hint = this.add.text(0, 0, '', {
      fontSize: '22px', color: COLORS.hint, fontFamily: 'sans-serif',
      align: 'center', wordWrap: { width: 320 }
    }).setOrigin(0.5);

    this.scale.on('resize', () => this.layout());
    this.layout();
    this.updateCoinText();
    this.scheduleOrder();
  }

  // Все позиции считаются от размеров экрана, элементы не должны перекрываться
  layout() {
    const { width: w, height: h } = this.scale;
    const cx = w / 2;
    const unit = Math.min(w, h * 0.6) / 10; // базовый размер для элементов

    this.bg.clear().fillStyle(COLORS.wall).fillRect(0, 0, w, h * 0.5);
    this.bg.fillStyle(COLORS.floor).fillRect(0, h * 0.5, w, h * 0.5);

    this.coinText.setPosition(cx, h * 0.09);

    const clientY = h * 0.27;
    const clientSize = unit * 2.4;
    this.drawClient(cx, clientY, clientSize);
    this.clientLabel.setPosition(cx, clientY + clientSize / 2 + 18);
    this.bubbleX = cx;
    this.bubbleY = clientY - clientSize / 2 - unit * 0.9;
    this.orderText.setPosition(this.bubbleX, this.bubbleY);

    const tableY = h * 0.6;
    const tableW = unit * 4.2;
    const tableH = unit * 1.6;
    this.tableGfx.clear()
      .fillStyle(COLORS.tableDark).fillRoundedRect(cx - tableW / 2, tableY - tableH / 2 + 6, tableW, tableH, 18)
      .fillStyle(COLORS.table).fillRoundedRect(cx - tableW / 2, tableY - tableH / 2, tableW, tableH, 18);
    this.tableZone.setPosition(cx, tableY).setSize(tableW, tableH);
    this.tableLabel.setPosition(cx, tableY);

    this.hint.setPosition(cx, h * 0.86);
  }

  drawClient(cx, cy, size) {
    this.client.clear()
      .fillStyle(COLORS.clientDark).fillRoundedRect(cx - size / 2, cy - size / 2 + 6, size, size, 24)
      .fillStyle(this.hasOrder ? COLORS.client : 0x5f6b78).fillRoundedRect(cx - size / 2, cy - size / 2, size, size, 24);
  }

  drawBubble() {
    this.bubble.clear();
    if (!this.hasOrder) return;
    const bw = 200;
    const bh = 90;
    this.bubble.setVisible(true)
      .fillStyle(COLORS.bubble)
      .fillRoundedRect(this.bubbleX - bw / 2, this.bubbleY - bh / 2, bw, bh, 20);
    this.orderText.setVisible(true);
  }

  updateCoinText() {
    this.coinText.setText(`Монеты: ${this.coins}`);
  }

  scheduleOrder() {
    const delay = Phaser.Math.Between(ORDER_MIN_DELAY, ORDER_MAX_DELAY);
    this.hint.setText('Ждём клиента…');
    this.time.delayedCall(delay, () => this.showOrder());
  }

  showOrder() {
    this.hasOrder = true;
    this.orderText.setText('Кофе,\nпожалуйста!');
    this.hint.setText('Тапни по столику, чтобы подать');
    this.layout();
    this.drawBubble();
  }

  serveOrder() {
    if (!this.hasOrder) return;

    this.hasOrder = false;
    this.coins += ORDER_REWARD;
    saveCoins(this.coins);
    this.updateCoinText();
    this.showReward();

    this.bubble.setVisible(false);
    this.orderText.setVisible(false);
    this.layout();
    this.scheduleOrder();
  }

  showReward() {
    const popup = this.add.text(this.tableZone.x, this.tableZone.y - 90, `+${ORDER_REWARD}`, {
      fontSize: '42px', color: COLORS.reward, fontFamily: 'sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: popup.y - 80,
      alpha: 0,
      duration: 900,
      onComplete: () => popup.destroy()
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: document.body,
  backgroundColor: COLORS.wall,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: CafeScene
};

new Phaser.Game(config);
