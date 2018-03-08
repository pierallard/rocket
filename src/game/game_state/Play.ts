export default class Play extends Phaser.State {
    public create() {
        let graphics = this.game.add.graphics(0, 0);
        graphics.beginFill(0xff00ff);
        graphics.lineStyle(10, 0x00ffff);
        graphics.drawCircle(100, 100, 100);
        this.game.add.existing(graphics);
    }

    update() {
    }
}
