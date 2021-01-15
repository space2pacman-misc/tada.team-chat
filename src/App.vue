<template>
    <div id="app">
        <div v-if="!isAuth">
            <form @submit.prevent="auth">
                <p>Only numbers and letter</p>
                <input type="text" placeholder="Username" v-model="username.value">
                <button type="button" @click="auth">Enter</button>
            </form>
        </div>
        <div v-if="isAuth">
            <form @submit.prevent="roomJoin(room.name)">
                <input type="text" placeholder="Room name" v-model="room.name" :disabled="room.username.length !== 0">
                <button type="button" v-if="room.username.length === 0" @click="roomJoin(room.name)">Enter</button>
                <button type="button" v-if="room.username.length !== 0" @click="roomLeave">Leave</button>
            </form>

            <form @submit.prevent="sendMessage">
                <input type="text" placeholder="Message" v-model="message" :disabled="username.roomName.length === 0">
                <button type="button" @click="sendMessage" :disabled="username.roomName.length === 0">Send</button>
            </form>

            <div v-for="(message, index) in room.messages" :key="index">
                <b>{{ message.sender.username }} @ {{ message.room }}</b>
                <div>
                    <i v-if="message.sender.username === 'server'">{{ message.text }}</i>
                    <span v-else>{{ message.text }}</span>
                </div>
                <br>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "App",
    data() {
        return {
            isAuth: false,
            username: {
                value: "",
                roomName: ""
            },
            message: "",
            socket: null,
            room: {
                name: "",
                username: "",
                messages: []
            },
            api: {
                socket: {
                    protocol: "wss",
                    address: "nane.tada.team",
                    path: "ws"
                },
                http: {
                    protocol: "http",
                    address: "nane.tada.team"
                }
            }
        }
    },
    methods: {
        auth() {
            if(this.checkString(this.username.value)) {
                this.connect();
            }
        },
        checkString(value) {
            let regexp = /^[a-zА-Я0-9]+$/i;

            if(value.length > 0 && regexp.test(value)) {
                return true;
            } else {
                return false;
            }
        },
        // request(url) {
        //     return fetch(`${this.api.http.protocol}://${this.api.http.address}/${url}`, {
        //         mode: "no-cors"
        //     }).then(response => {
        //         console.log(response)
        //     });
        // },
        connect() {
            this.socket = new WebSocket(`${this.api.socket.protocol}://${this.api.socket.address}/${this.api.socket.path}?${this.serialize(["username"], [this.username.value])}`);
            this.socket.addEventListener("open", this.onOpen);
            this.socket.addEventListener("message", this.onMessage);
            this.socket.addEventListener("error", this.onError);
        },
        serialize(keys, values) {
            let parameters = "";
            
            if(keys.length === values.length) {
                for(let i = 0; i < keys.length; i++) {
                    parameters += `${keys[i]}=${values[i]}`;
                }
            }

            return parameters;
        },
        encrypt(data) {
            return JSON.stringify(data);
        },
        decrypt(data) {
            return JSON.parse(data);
        },
        roomJoin(name) {
            if(this.checkString(name)) {
                let message = {
                    sender: {
                        username: "server"
                    },
                    room: name,
                    text: `Пользователь ${this.username.value} вошел в комнату`
                }

                this.username.roomName = name;
                this.room.username = this.username.value;
                this.room.messages.push(message);
                //this.request(`api/rooms/${name}/history`).then(this.onMessageHistory);
            }
        },
        roomLeave() {
            let message = {
                sender: {
                    username: "server"
                },
                room: name,
                text: `Пользователь ${this.username.value} покинул комнату`
            }

            this.room.username = "";
            this.room.messages.push(message);
        },
        sendMessage() {
            if(this.message.length > 0) {
                let payload = {
                    room: this.room.name,
                    text: this.message
                }

                this.socket.send(this.encrypt(payload));
                this.message = "";
            }
        },
        onOpen() {
            this.isAuth = true;
        },
        onMessage(response) {
            let data = this.decrypt(response.data);

            if(data.room === this.room.name && this.room.username.length > 0) {
                this.room.messages.push(data);
            }
        },
        // onMessageHistory(response) {
        //     console.log(response);
        // },
        onError(error) {
            console.log(error);
        }
    }
}
</script>