// Шаг 1: один столик, один заказ, монеты, сохранение в localStorage
// Версия 2: разметка под телефон (с учётом панели браузера), подписи, всплывающее «+10»

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

    this.coinText = this.add.text(0, 0, '', {
      fontSize: '36px', color: '#ffd76a', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    this.clientBox = this.add.rectangle(0, 0, 180, 180, 0x4a7fb5)
      .setStrokeStyle(4, 0x2d4f73);
    this.clientLabel = this.add.text(0, 0, 'Клиент', {
      fontSize: '22px', color: '#dfe9f5', fontFamily: 'sans-serif'
    }).setOrigin(0.5);
    this.orderText = this.add.text(0, 0, '', {
      fontSize: '26px', color: '#ffffff', fontFamily: 'sans-serif',
      align: 'center', wordWrap: { width: 320 }
    }).setOrigin(0.5);

    this.table = this.add.rectangle(0, 0, 260, 140, 0x8b5a2b)
      .setStrokeStyle(4, 0x5a3617)
      .setInteractive({ useHandCursor: true });
    this.table.on('pointerdown', () => this.serveOrder());
    this.tableLabel = this.add.text(0, 0, 'Тапни, чтобы подать', {
      fontSize: '20px', color: '#f3e3c8', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    this.hint = this.add.text(0, 0, '', {
      fontSize: '24px', color: '#cccccc', fontFamily: 'sans-serif',
      align: 'center', wordWrap: { width: 340 }
    }).setOrigin(0.5);

    this.scale.on('resize', () => this.layout());
    this.layout();
    this.updateCoinText();
    this.scheduleOrder();
  }

  layout() {
    const { width, height } = this.scale;
    // Верхний и нижний отступы учитывают панели Safari
    const top = 90;
    const bottom = height - 140;
    const cx = width / 2;
    const midY = (top + bottom) / 2;

    this.coinText.setPosition(cx, top - 40);
    this.clientBox.setPosition(cx, top + 120);
    this.clientLabel.setPosition(cx, top + 120 - 100);
    this.orderText.setPosition(cx, top + 120);
    this.table.setPosition(cx, midY + 170);
    this.tableLabel.setPosition(cx, midY + 170);
    this.hint.setPosition(cx, bottom - 20);
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
    this.orderText.setText('Кофе,\nпожалуйста!');
    this.hint.setText('Тапни по столику, чтобы подать заказ');
    this.clientBox.setFillStyle(0x4a7fb5);
  }

  serveOrder() {
    if (!this.hasOrder) return;

    this.hasOrder = false;
    this.coins += ORDER_REWARD;
    saveCoins(this.coins);
    this.updateCoinText();
    this.showReward();

    this.orderText.setText('');
    this.scheduleOrder();
  }

  showReward() {
    const popup = this.add.text(this.table.x, this.table.y - 100, `+${ORDER_REWARD}`, {
      fontSize: '40px', color: '#7dff8a', fontFamily: 'sans-serif', fontStyle: 'bold'
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
  backgroundColor: '#2b241e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: CafeScene
};

new Phaser.Game(config);
