// Шаг 1: один столик, один заказ, монеты, сохранение в localStorage
// Версия 4: фиксированная сетка 390×844 (вертикальный телефон), чёткая отрисовка на любом DPR

const SAVE_KEY = 'cafe-save';
const ORDER_MIN_DELAY = 5000;
const ORDER_MAX_DELAY = 10000;
const ORDER_REWARD = 10;

// Проектная сетка: все координаты заданы для этого размера, Phaser масштабирует всё целиком
const DESIGN_W = 390;
const DESIGN_H = 844;

const COLORS = {
  wall: 0x2b241e,
  floor: 0x3a2e25,
  coin: '#ffd76a',
  client: 0x4a7fb5,
  clientOff: 0x5f6b78,
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

    const cx = DESIGN_W / 2;

    // Фон: стена сверху, пол снизу
    this.add.rectangle(cx, 300, DESIGN_W, 600, COLORS.wall);
    this.add.rectangle(cx, 600, DESIGN_W, 488, COLORS.floor);

    this.coinText = this.add.text(cx, 70, '', {
      fontSize: '32px', color: COLORS.coin, fontFamily: 'sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Клиент
    this.clientGfx = this.add.graphics();
    this.add.text(cx, 290, 'Клиент', {
      fontSize: '18px', color: COLORS.text, fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // Пузырь заказа
    this.bubbleGfx = this.add.graphics().setVisible(false);
    this.orderText = this.add.text(cx, 200, '', {
      fontSize: '22px', color: '#3a2e25', fontFamily: 'sans-serif',
      align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    // Столик: кликабельная зона и подпись
    this.tableGfx = this.add.graphics();
    this.add.text(cx, 470, '☕ Подать', {
      fontSize: '20px', color: COLORS.text, fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    const tableZone = this.add.zone(cx, 470, 260, 110).setInteractive({ useHandCursor: true });
    tableZone.on('pointerdown', () => this.serveOrder());
    this.tableCenter = { x: cx, y: 470 };

    this.hint = this.add.text(cx, 740, '', {
      fontSize: '18px', color: COLORS.hint, fontFamily: 'sans-serif',
      align: 'center', wordWrap: { width: 330 }
    }).setOrigin(0.5);

    this.drawStatic();
    this.drawClient();
    this.updateCoinText();
    this.scheduleOrder();
  }

  drawStatic() {
    const cx = DESIGN_W / 2;
    this.tableGfx.clear()
      .fillStyle(COLORS.tableDark).fillRoundedRect(cx - 130, 470 - 52 + 6, 260, 104, 18)
      .fillStyle(COLORS.table).fillRoundedRect(cx - 130, 470 - 52, 260, 104, 18);
  }

  drawClient() {
    const cx = DESIGN_W / 2;
    const size = 150;
    const y = 360 - size / 2;
    this.clientGfx.clear()
      .fillStyle(COLORS.clientDark).fillRoundedRect(cx - size / 2, y + 6, size, size, 22)
      .fillStyle(this.hasOrder ? COLORS.client : COLORS.clientOff)
      .fillRoundedRect(cx - size / 2, y, size, size, 22);
  }

  drawBubble() {
    const cx = DESIGN_W / 2;
    this.bubbleGfx.clear();
    if (!this.hasOrder) {
      this.bubbleGfx.setVisible(false);
      this.orderText.setVisible(false);
      return;
    }
    this.bubbleGfx.setVisible(true)
      .fillStyle(COLORS.bubble)
      .fillRoundedRect(cx - 100, 200 - 40, 200, 80, 18);
    this.orderText.setText('Кофе,\nпожалуйста!').setVisible(true);
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
    this.hint.setText('Тапни по столику, чтобы подать');
    this.drawClient();
    this.drawBubble();
  }

  serveOrder() {
    if (!this.hasOrder) return;

    this.hasOrder = false;
    this.coins += ORDER_REWARD;
    saveCoins(this.coins);
    this.updateCoinText();
    this.showReward();

    this.drawClient();
    this.drawBubble();
    this.scheduleOrder();
  }

  showReward() {
    const popup = this.add.text(this.tableCenter.x, this.tableCenter.y - 80, `+${ORDER_REWARD}`, {
      fontSize: '40px', color: COLORS.reward, fontFamily: 'sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: popup.y - 70,
      alpha: 0,
      duration: 900,
      onComplete: () => popup.destroy()
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: document.body,
  width: DESIGN_W,
  height: DESIGN_H,
  backgroundColor: COLORS.wall,
  // Чёткая картинка на экранах с высоким DPR (айфон), масштаб без размытия
  resolution: window.devicePixelRatio || 1,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: CafeScene
};

new Phaser.Game(config);
