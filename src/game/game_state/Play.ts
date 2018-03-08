import {GAME_WIDTH} from "../../app";

const SPEED = 10;
const GRAVITY = 0.02 * SPEED;
const POWER_LATERAL = 0.1 * SPEED;
const POWER_TOP = 0.04 * SPEED;
const BASIS_WIDTH = 100;
const MAX_TIME = 300;

enum ACTION {
    NOTHING = 0,
    LEFT = 1,
    RIGHT = 2,
}

export default class Play extends Phaser.State {
    private rocket: Phaser.Graphics;
    private rocketPosition: PIXI.Point;
    private rocketAcceleration: PIXI.Point;
    private isLeft: boolean;
    private isRight: boolean;
    private basisPosition: PIXI.Point;
    private basis: Phaser.Graphics;

    private sequences = [];
    private sequenceId = 0;
    private sequenceTime = 0;

    constructor() {
        super();

        for (let x = 0; x < 500; x++) {
            let sequence = [];
            for (let i = 0; i < MAX_TIME; i++) {
                sequence.push(Math.floor(Math.random() * 3));
            }
            this.sequences.push(sequence)
        }
    }

    private restart() {
        this.rocketPosition = new PIXI.Point(100, 300);
        this.rocketAcceleration = new PIXI.Point(0, 0);
        this.isLeft = false;
        this.isRight = false;
    }

    public create() {
        this.restart();

        this.basisPosition = new PIXI.Point(800, 600);

        this.rocket = this.game.add.graphics(0, 0);
        this.game.add.existing(this.rocket);

        this.basis = this.game.add.graphics(0, 0);
        this.game.add.existing(this.basis);
        this.basis.lineStyle(1, 0xffffff);
        this.basis.moveTo(0, this.basisPosition.y);
        this.basis.lineTo(GAME_WIDTH, this.basisPosition.y);
        this.basis.beginFill(0xffffff);
        this.basis.drawRect(this.basisPosition.x - BASIS_WIDTH/2, this.basisPosition.y, BASIS_WIDTH, 30);

        let key1 = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        key1.onDown.add(this.pressLeft, this);
        key1.onUp.add(this.unPressLeft, this);

        let key2 = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        key2.onDown.add(this.pressRight, this);
        key2.onUp.add(this.unPressRight, this);
    }

    update() {
        this.updateSequence();

        let forceFields = [];
        forceFields.push(new PIXI.Point(0, GRAVITY));
        if (this.isLeft) {
            forceFields.push(new PIXI.Point(+POWER_LATERAL, -POWER_TOP));
        }
        if (this.isRight) {
            forceFields.push(new PIXI.Point(-POWER_LATERAL, -POWER_TOP));
        }

        let sumForceFields = forceFields.reduce((prev, curr) => {
            return new PIXI.Point(prev.x + curr.x, prev.y + curr.y);
        }, new PIXI.Point(0, 0));

        this.rocketAcceleration.x += sumForceFields.x;
        this.rocketAcceleration.y += sumForceFields.y;

        this.rocketPosition.x = this.rocketPosition.x + this.rocketAcceleration.x;
        this.rocketPosition.y = this.rocketPosition.y + this.rocketAcceleration.y;

        this.rocket.clear();
        this.rocket.beginFill(0xff00ff);
        this.rocket.lineStyle(2, 0x00ffff);
        this.rocket.drawCircle(this.rocketPosition.x, this.rocketPosition.y, 50);
        this.rocket.beginFill(0xff0000);
        if (this.isLeft) {
            this.rocket.drawCircle(this.rocketPosition.x - 20, this.rocketPosition.y + 20, 20);
        }
        if (this.isRight) {
            this.rocket.drawCircle(this.rocketPosition.x + 20, this.rocketPosition.y + 20, 20);
        }
    }

    private pressLeft() {
        this.isLeft = true;
    }

    private pressRight() {
        this.isRight = true;
    }

    private unPressLeft() {
        this.isLeft = false;
    }

    private unPressRight() {
        this.isRight = false;
    }

    private updateSequence() {
        const action = this.sequences[this.sequenceId][this.sequenceTime];
        if (action === ACTION.NOTHING) {
            this.unPressLeft();
            this.unPressRight();
        } else if (action === ACTION.LEFT) {
            this.pressLeft();
            this.unPressRight()
        } else if (action === ACTION.RIGHT) {
            this.unPressLeft();
            this.pressRight();
        } else {
            this.restart();
            this.sequenceId++;
            this.sequenceTime = 0;
        }
        this.sequenceTime++;
    }
}
