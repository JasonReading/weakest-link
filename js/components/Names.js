Vue.component('Names', {
    props: ['min', 'max'],
    template: `
        <div class="card shadow-sm bg-dark">
            <div class="card-header">
                Players
            </div>
            <div class="card-body">
                <div class="form-group" v-for="(player,index) in players">
                    <input v-model="player.name" :key="index" type="text" class="form-control" @input="addField"/>
                </div>
                <button class="btn btn-block btn-primary"
                    @click="submit"
                    :disabled="sanitisedNames.length < 2"
                >Start Game</button>
            </div>
        </div>
    `,
    data: function () {
        return {
            players: [{name:null}],
        };
    },
    computed: {
        nonEmptyNames: function () {
            return this.players.filter(player => player.name);
        },
        sanitisedNames: function () {
            return this.nonEmptyNames.map(player => player.name.trim());
        },
    },
    methods: {
        addField: function () {
            if (this.players.length == this.max) {
                return;
            }

            const lastPlayer = this.players.slice(-1)[0];
            if (lastPlayer.name != null) {
                this.players.push({name:null});
            }
        },
        submit: function () {
            this.$emit('submit', this.sanitisedNames);
        },
    },
});
