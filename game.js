// Шаг 1: один столик, один заказ, монеты, сохранение в localStorage

const SAVE_KEY = 'cafe-save';
const ORDER_MIN_DELAY = 5000;
const ORDER_MAX_DELAY = 10000;
const ORDER_REWARD = 10;

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

    const { width, height } = this.scale;
    this.cx = width / 2;

    this.coinText = this.add.text(this.cx, 40, '', {
      fontSize: '32px', color: '#ffd76a', fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    this.updateCoinText();

    this.table = this.add.rectangle(this.cx, height * 0.6, 220, 120, 0x8b5a2b)
      .setStrokeStyle(4, 0x5a3617)
      .setInteractive({ useHandCursor: true });

    this.table.on('pointerdown', () => this.serveOrder());

    this.clientBox = this.add.rectangle(this.cx, height * 0.35, 160, 160, 0x4a7fb5);
    this.orderText = this.add.text(this.cx, height * 0.35, '', {
      fontSize: '26px', color: '#ffffff', fontFamily: 'sans-serif', align: 'center'
    }).setOrigin(0.5);

    this.hint = this.add.text(this.cx, height * 0.85, '', {
      fontSize: '20px', color: '#cccccc', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    this.scheduleOrder();
  }

  updateCoinText() {
    this.coinText.setText(`Монеты: ${this.coins}`);
  }

  scheduleOrder() {
    const delay = Phaser.Math.Between(ORDER_MIN_DELAY, ORDER_MAX_DELAY);
    this.hint.setText('Ждём клиента...');
    this.time.delayedCall(delay, () => this.showOrder());
  }

  showOrder() {
    this.hasOrder = true;
    this.orderText.setText('Кофе, пожалуйста!');
    this.hint.setText('Тапни по столику, чтобы подать');
    this.clientBox.setFillStyle(0x4a7fb5);
  }

  serveOrder() {
    if (!this.hasOrder) return;

    this.hasOrder = false;
    this.coins += ORDER_REWARD;
    saveCoins(this.coins);
    this.updateCoinText();

    this.orderText.setText('');
    this.scheduleOrder();
  }
}

const config = {
  type: Phaser.AUTO,
  parent: document.body,
  backgroundColor: '#2b241e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: CafeScene
};

new Phaser.Game(config);
