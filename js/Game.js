const Game = {
    state: {
        linkValues: [1,2,5,10,15,20,30,40,50],
        rounds: [
            { time: 180, track: 'Round 1 - 9 people' },
            { time: 170, track: 'Round 2 - 8 people' },
            { time: 160, track: 'Round 3 - 7 people' },
            { time: 150, track: 'Round 4 - 6 people' },
            { time: 140, track: 'Round 5 - 5 people' },
            { time: 130, track: 'Round 6 - 4 people' },
            { time: 120, track: 'Round 7 - 3 people' },
            { time: 90,  track: 'Round 8 - 2 people' },
        ],
        roundWinTrackName: 'Round Win',

        round: 1,
        answerStreak: null,
        bank: 0,
        kitty: 0,

        muted: false,
        //gameState: 'names',
        gameState: 'round:ended', // names, round:ended, round:started, round:paused, ended

        //players: {},
        activePlayer: null,
        players: {
            'one':{name:'one',questions:{total:0,correct:0}},
            'two':{name:'two',questions:{total:0,correct:0}},
            'three':{name:'three',questions:{total:0,correct:0}},
            'four':{name:'four',questions:{total:0,correct:0}},
            'five':{name:'five',questions:{total:0,correct:0}},
        },
        remainingPlayers: ['one','two','three','four','five'],

        history: {},
    },

    questionCorrect: function () {
        this.logHistory();
        this.incrementAnswerStreak();
        this.nextPlayer();
    },
    questionIncorrect: function () {
        this.logHistory();
        this.resetAnswerStreak();
        this.nextPlayer();
    },
    nextPlayer: function () {
        if (this.state.activePlayer == this.state.remainingPlayers.length -1) {
            this.state.activePlayer = 0;
        } else {
            this.state.activePlayer++;
        }
    },

    incrementAnswerStreak: function () {
        this.state.answerStreak++;
    },
    decrementAnswerStreak: function () {
        if (this.state.answerStreak > 0) {
            this.state.answerStreak--;
        }
    },
    resetAnswerStreak: function () {
        this.state.answerStreak = 0;
    },
    clearAnswerStreak: function () {
        this.state.answerStreak = null;
    },

    bankAnswerStreak: function () {
        this.logHistory();

        const fullChain = this.state.answerStreak >= this.state.linkValues.length;

        const maxValue = Math.min(this.state.answerStreak, this.state.linkValues.length);
        const acquiredValue = this.state.linkValues[maxValue-1] || 0;

        this.state.bank += acquiredValue;
        this.resetAnswerStreak();

        if (fullChain) {
            this.endRound();

            // interrupt the timer and audio
            EventBus.$emit('timer:stop');
            this.playTrack(this.state.roundWinTrackName);
        }
    },

    playTrack: function (trackName) {
        EventBus.$emit('audio:play', `./audio/${trackName}.mp3`);
    },

    startRound: function () {
        this.state.gameState = 'round:started';
        this.state.activePlayer = 0;
        this.resetAnswerStreak();

        const currentRound = this.state.rounds[this.state.round-1];
        EventBus.$emit('timer:start', currentRound.time);
        this.playTrack(currentRound.track);
    },
    pauseRound: function () {
        this.state.gameState = 'round:paused';
        EventBus.$emit('timer:pause');
        EventBus.$emit('audio:pause');
    },
    resumeRound: function () {
        this.state.gameState = 'round:started';
        EventBus.$emit('timer:resume');
        EventBus.$emit('audio:resume');
    },
    // called by timer:complete event and bankAnswerStreak()
    endRound: function () {
        this.state.gameState = 'round:ended';
        this.state.kitty += this.state.bank;
        this.state.bank = 0;
        this.state.activePlayer = null;

        this.clearAnswerStreak();

        this.state.round++;

        this.clearHistory();

        if (this.state.round > this.state.rounds.length) {
            console.log('end of the game');
        }
    },
    toggleGameState: function () {
        switch (this.state.gameState) {
            case 'round:ended':
                this.startRound();
                break;
            case 'round:started':
                this.pauseRound();
                break;
            case 'round:paused':
                this.resumeRound();
                break;
        }
    },

    logHistory: function () {
        const newHistory = {
            answerStreak: this.state.answerStreak,
            bank: this.state.bank,
        };
        Vue.set(Game.state, 'history', newHistory);
    },
    clearHistory: function () {
        Vue.set(Game.state, 'history', {});
    },
    undoLastAction: function () {
        if (Object.keys(this.state.history).length === 0) {
            return;
        }

        this.state.answerStreak = this.state.history.answerStreak;
        this.state.bank = this.state.history.bank;

        this.clearHistory();
    },

    setPlayers: function (names) {
        this.players = names.map(name => {
            return {
                name: name,
                active: false,
                eliminated: false,
                questions: {
                    total: 0,
                    correct: 0,
                }
            };
        });
    },
    startGame: function () {
        this.state.gameState = 'round:started';
    },
};
