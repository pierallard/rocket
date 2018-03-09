import {GAME_WIDTH} from "../../app";

const SPEED = 10;
const GRAVITY = 0.02 * SPEED;
const POWER_LATERAL = 0.1 * SPEED;
const POWER_TOP = 0.04 * SPEED;
const BASIS_WIDTH = 100;
const MAX_TIME = 2;
const MAX_SEQUENCES = 3;

enum ACTION {
    NOTHING = 0,
    LEFT = 1,
    RIGHT = 2,
}

export default class Play extends Phaser.State {
    private rocket: Phaser.Graphics;
    private rocketPosition: PIXI.Point;
    private rocketAcceleration: PIXI.Point;
    private todoAction: ACTION;
    private basisPosition: PIXI.Point;
    private basis: Phaser.Graphics;

    private sequences = [];
    private sequenceId = 0;
    private sequenceTime = 0;
    private notes = [];

    private registereds = [];
    private yoloRocketPosition: PIXI.Point;
    private yoloRocketAcceleration: PIXI.Point;

    private generateSequences() {
        this.sequences = [];

        for (let x = 0; x < MAX_SEQUENCES; x++) {
            let sequence = [];
            for (let i = 0; i < this.registereds.length; i++) {
                sequence.push(this.registereds[i]);
            }
            for (let i = 0; i < MAX_TIME; i++) {
                sequence.push(Math.floor(Math.random() * 3));
            }
            this.sequences[x] = sequence;
        }
    }

    constructor() {
        super();

        this.generateSequences();
        this.yoloRocketPosition = new PIXI.Point(100, 300);
        this.yoloRocketAcceleration = new PIXI.Point(0, 0);
        this.rocketPosition = new PIXI.Point();
        this.rocketAcceleration = new PIXI.Point();
    }

    private restart() {
        this.rocketPosition.x = this.yoloRocketPosition.x;
        this.rocketPosition.y = this.yoloRocketPosition.y;
        this.rocketAcceleration.x = this.yoloRocketAcceleration.x;
        this.rocketAcceleration.y = this.yoloRocketAcceleration.y;
        this.todoAction = ACTION.NOTHING;
    }

    private noteCurrent() {
        const distance = Math.sqrt(
            (this.rocketPosition.x - this.basisPosition.x) * (this.rocketPosition.x - this.basisPosition.x) +
            (this.rocketPosition.y - this.basisPosition.y) * (this.rocketPosition.y - this.basisPosition.y)
        );
        const time = this.sequenceTime;
        const lostScrash = this.isScrashed() ? 10000 : 0;
        const currentNote = distance + time + lostScrash;

        this.notes[this.sequenceId] = currentNote;
    }

    private isScrashed() {
        return this.rocketPosition.y > this.basisPosition.y;
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
        key1.onUp.add(this.unpress, this);

        let key2 = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        key2.onDown.add(this.pressRight, this);
        key2.onUp.add(this.unpress, this);
    }

    update() {
        if (this.isScrashed()) {
            this.noteCurrent();
            this.restart();
            this.sequenceId++;
            this.sequenceTime = 0;
        }

        this.updateSequence();

        const newAcceleration = this.getNextAcceleration(this.todoAction);
        this.rocketAcceleration.x = newAcceleration.x;
        this.rocketAcceleration.y = newAcceleration.y;

        this.rocketPosition.x = this.rocketPosition.x + this.rocketAcceleration.x;
        this.rocketPosition.y = this.rocketPosition.y + this.rocketAcceleration.y;

        this.rocket.clear();
        this.rocket.beginFill(0xff00ff);
        this.rocket.lineStyle(2, 0x00ffff);
        this.rocket.drawCircle(this.rocketPosition.x, this.rocketPosition.y, 50);
        this.rocket.beginFill(0xff0000);
        if (this.todoAction === ACTION.LEFT) {
            this.rocket.drawCircle(this.rocketPosition.x - 20, this.rocketPosition.y + 20, 20);
        }
        if (this.todoAction === ACTION.RIGHT) {
            this.rocket.drawCircle(this.rocketPosition.x + 20, this.rocketPosition.y + 20, 20);
        }
    }

    private getNextAcceleration(action: ACTION) {
        let forceFields = [];
        forceFields.push(new PIXI.Point(0, GRAVITY));
        if (action === ACTION.LEFT) {
            forceFields.push(new PIXI.Point(+POWER_LATERAL, -POWER_TOP));
        }
        if (action === ACTION.RIGHT) {
            forceFields.push(new PIXI.Point(-POWER_LATERAL, -POWER_TOP));
        }

        let sumForceFields = forceFields.reduce((prev, curr) => {
            return new PIXI.Point(prev.x + curr.x, prev.y + curr.y);
        }, new PIXI.Point(0, 0));

        return new PIXI.Point(
            this.rocketAcceleration.x + sumForceFields.x,
            this.rocketAcceleration.y + sumForceFields.y
        );
    }

    private pressLeft() {
        this.todoAction = ACTION.LEFT;
    }

    private pressRight() {
        this.todoAction = ACTION.RIGHT;
    }

    private unpress() {
        this.todoAction = ACTION.NOTHING;
    }

    private updateSequence() {
        const action = this.sequences[this.sequenceId][this.sequenceTime];
        if (action !== undefined) {
            this.todoAction = action;
        } else {
            this.noteCurrent();
            this.restart();
            this.sequenceId++;
            this.sequenceTime = 0;
        }

        if (this.sequenceId >= MAX_SEQUENCES) {
            this.analyseNotes();
        }
        this.sequenceTime++;
    }

    private updateYolos() {
        const lastAction = this.registereds[this.registereds.length - 1];

        this.rocketAcceleration.x = this.yoloRocketAcceleration.x;
        this.rocketAcceleration.y = this.yoloRocketAcceleration.y;
        const newAcceleration = this.getNextAcceleration(lastAction);
        this.yoloRocketAcceleration.x = newAcceleration.x;
        this.yoloRocketAcceleration.y = newAcceleration.y;

        this.yoloRocketPosition.x = this.yoloRocketPosition.x + this.yoloRocketAcceleration.x;
        this.yoloRocketPosition.y = this.yoloRocketPosition.y + this.yoloRocketAcceleration.y;
    }

    private analyseNotes() {
        let splittedNotes = {};
        splittedNotes[ACTION.NOTHING] = [];
        splittedNotes[ACTION.LEFT] = [];
        splittedNotes[ACTION.RIGHT] = [];

        const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length;

        const nextId = this.registereds.length;

        for (let i = 0; i < this.notes.length; i++) {
            splittedNotes[this.sequences[i][nextId]].push(this.notes[i])
        }

        let averageNothing = average(splittedNotes[ACTION.NOTHING]);
        let averageLeft = average(splittedNotes[ACTION.LEFT]);
        let averageRight = average(splittedNotes[ACTION.RIGHT]);

        averageNothing = averageNothing ? averageNothing : 100000;
        averageLeft = averageLeft ? averageLeft : 100000;
        averageRight = averageRight ? averageRight : 100000;

        if (averageNothing < averageLeft && averageNothing < averageRight) {
            this.registereds.push(ACTION.NOTHING);
        } else if (averageLeft < averageNothing && averageLeft < averageRight) {
            this.registereds.push(ACTION.LEFT);
        } else if (averageRight < averageLeft && averageRight < averageNothing) {
            this.registereds.push(ACTION.RIGHT);
        } else {
            console.log('ERROR');
            debugger;
        }

        this.displayRegistereds();

        this.generateSequences();
        this.updateYolos();
        this.restart();
        this.sequenceId = 0;
        this.sequenceTime = this.registereds.length;
    }

    private displayRegistereds() {
        console.log(this.registereds.map((r) => {
            return r === ACTION.NOTHING ? '.' : (r === ACTION.LEFT ? 'L' : 'R');
        }).join(''));
    }
}
