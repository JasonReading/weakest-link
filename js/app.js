const EventBus = new Vue();

var app = new Vue({
    el: '#app',
    data: {
        sharedState: sourceOfTruth.state,
        bc: new BroadcastChannel('weakest_link'),
    },
    created: function () {
        this.bc.onmessage = this.receiveBroadcast;

        EventBus.$on('round:start', () => sourceOfTruth.startRound());
        EventBus.$on('timer:complete', () => sourceOfTruth.endRound())

        EventBus.$on('chain:forward', () => sourceOfTruth.incrementAnswerStreak());
        EventBus.$on('chain:backward', () => sourceOfTruth.decrementAnswerStreak());
        EventBus.$on('chain:reset', () => sourceOfTruth.resetAnswerStreak());

        EventBus.$on('chain:bank', () => sourceOfTruth.bankAnswerStreak());
    },
    methods: {
        receiveBroadcast: function (event) {
            EventBus.$emit(event.data);
        },

        /* TODO: contextually add/remove keys
         *       eg. don't allow the chain to manipulated if the round hasn't
         *       started
         */
        keyPress: function (event) {
            const keyMap = {
                'ArrowUp': 'chain:forward',
                'ArrowDown': 'chain:backward',
                'KeyS': 'round:start',
                'Space': 'chain:forward',
                'Backspace': 'chain:reset',
                'Enter': 'chain:bank',
            }
            if (event.code in keyMap) {
                EventBus.$emit(keyMap[event.code]);
            }
        }
    },
})

// work around to add global key presses
document.addEventListener('keyup', function (event) {
    app.keyPress(event);
});
