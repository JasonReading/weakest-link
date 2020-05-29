Vue.component('round-cycle', {
    template: `
        <div class="row"">
            <div class="col d-flex flex-column align-items-center">
                <Chain class="mb-4" :links="linkValues" :progress="answerStreak"></Chain>
                <p class="pill mb-5" data-text="Bank">&pound{{bank}}</p>
            </div>
            <div class="col">
                <Players :active="activePlayer"></Players>
            </div>
            <div class="col d-flex flex-column align-items-center">
                <p class="pill mb-5" data-text="Round">{{sharedState.round}}</p>
                <Timer class="mb-5" @complete="endRound"></Timer>
                <p class="pill mb-5" data-text="Kitty">&pound;{{sharedState.kitty}}</p>
            </div>

            <Modal title="Eliminate Player" :display="showModal">
                <elimination-list @selected="eliminatePlayer" :players="sharedState.remainingPlayers"></elimination-list>
            </Modal>
        </div>
    `,
    data: function () {
        return {
            sharedState: Game.state,
            linkValues: [1,2,5,10,15,20,30,40,50],
            answerStreak: null,
            activePlayer: null,
            bank: 0,

            showModal: false,

            history: {},

            stateKeyMap: {
                'round:ended': {
                    'KeyS': this.toggleGameState,
                },
                'round:started': {
                    'KeyS': this.toggleGameState,
                    'Space': this.questionCorrect,
                    'Backspace': this.questionIncorrect,
                    'Enter': this.bankAnswerStreak,
                    'KeyZ': this.undoLastAction,
                },
                'round:paused': {
                    'KeyS': this.toggleGameState,
                    'KeyZ': this.undoLastAction,
                },
            },
        };
    },

    methods: {
        incrementAnswerStreak: function () {
            this.answerStreak++;
        },
        decrementAnswerStreak: function () {
            if (this.answerStreak > 0) {
                this.answerStreak--;
            }
        },
        resetAnswerStreak: function () {
            this.answerStreak = 0;
        },
        clearAnswerStreak: function () {
            this.answerStreak = null;
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
            if (this.activePlayer == this.sharedState.remainingPlayers.length -1) {
                this.activePlayer = 0;
            } else {
                this.activePlayer++;
            }
        },

        bankAnswerStreak: function () {
            this.logHistory();

            const fullChain = this.answerStreak >= this.linkValues.length;

            const maxValue = Math.min(this.answerStreak, this.linkValues.length);
            const acquiredValue = this.linkValues[maxValue-1] || 0;

            this.bank += acquiredValue;
            this.resetAnswerStreak();

            if (fullChain) {
                this.endRound();

                // interrupt the timer and audio
                EventBus.$emit('timer:stop');
                this.playTrack(this.sharedState.roundWinTrackName);
            }
        },

        toggleGameState: function () {
            switch (this.sharedState.gameState) {
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
        startRound: function () {
            this.sharedState.gameState = 'round:started';
            this.activePlayer = 0;
            this.resetAnswerStreak();

            const currentRound = this.sharedState.rounds[this.sharedState.round-1];
            EventBus.$emit('timer:start', currentRound.time);
            this.playTrack(currentRound.track);
        },
        pauseRound: function () {
            this.sharedState.gameState = 'round:paused';
            EventBus.$emit('timer:pause');
            EventBus.$emit('audio:pause');
        },
        resumeRound: function () {
            this.sharedState.gameState = 'round:started';
            EventBus.$emit('timer:resume');
            EventBus.$emit('audio:resume');
        },
        // called by timer "complete" event and bankAnswerStreak()
        endRound: function () {
            this.sharedState.gameState = 'round:ended';
            this.sharedState.kitty += this.bank;
            this.bank = 0;
            this.activePlayer = null;

            this.clearAnswerStreak();

            this.sharedState.round++;

            this.clearHistory();

            this.showModal = true;

            if (this.sharedState.round > this.sharedState.rounds.length) {
                this.sharedState.gameState = 'ended';
            }
        },

        playTrack: function (trackName) {
            EventBus.$emit('audio:play', `./audio/${trackName}.mp3`);
        },

        logHistory: function () {
            const newHistory = {
                answerStreak: this.answerStreak,
                bank: this.bank,
                activePlayer: this.activePlayer,
            };
            Vue.set(this, 'history', newHistory);
        },
        clearHistory: function () {
            Vue.set(this, 'history', {});
        },
        undoLastAction: function () {
            if (Object.keys(this.history).length === 0) {
                return;
            }

            this.answerStreak = this.history.answerStreak;
            this.bank = this.history.bank;
            this.activePlayer = this.history.activePlayer;

            this.clearHistory();
        },

        eliminatePlayer: function (player) {
            const i = this.sharedState.remainingPlayers.indexOf(player);
            this.sharedState.remainingPlayers.splice(i, 1);
            this.showModal = false;
        },

        keyPress: function (event) {
            if (!this.stateKeyMap.hasOwnProperty(this.sharedState.gameState)) {
                return;
            }

            const currentKeyMap = this.stateKeyMap[this.sharedState.gameState];
            if (event.code in currentKeyMap) {
                currentKeyMap[event.code]();
            }
        }
    },

    created: function () {
        document.addEventListener('keyup', this.keyPress);
    },
    beforeDestroy: function () {
        document.removeEventListener('keyup', this.keyPress);
        console.log('destroyed RoundCycle component');
    },
});