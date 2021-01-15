<template>
    <div id="app" class="container mt-5">
        <div v-if="!isAuth">
            <form class="form" @submit.prevent="auth">
                <div class="card w-100">
                    <div class="card-body">
                        <div class="text-center">
                            <input type="text" class="form-control mb-3" placeholder="Username" v-model="user.login">
                            <button type="button" class="btn btn-primary btn-block" @click="auth">Enter</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
        <div v-if="isAuth" class="card">
            <div class="card-body d-flex">
                <div class="rooms border-right pr-3 mr-3">
                    <div class="btn btn-success btn-block mb-2" @click="roomCreate">Room create</div>
                    <div class="border-top mb-2"></div>
                    <div class="rooms__buttons overflow-auto">
                        <div v-for="(room, index) in rooms" :key="index">
                        <div class="btn btn-block text-left mb-2" :class="user.roomName === room.name ? 'btn-success' : 'btn-info'" @click="roomJoin(room.name)">{{ room.name }}</div>
                    </div>
                    </div>
                </div>
                <div class="chat">
                    <form @submit.prevent="sendMessage" class="input-group flex-nowrap">
                        <input type="text" placeholder="Message" class="form-control w-100" v-model="message" :disabled="user.roomName.length === 0">
                        <div class="input-group-append">
                            <button type="button" @click="sendMessage" class="btn btn-primary" :disabled="user.roomName.length === 0">Send</button>
                            <button type="button" @click="roomLeave" class="btn btn-info" :disabled="user.roomName.length === 0">Leave</button>
                            <button type="button" @click="logout" class="btn btn-danger">Logout</button>
                        </div>
                    </form>

                    <div class="overflow-auto chat__messages mt-3" ref="chat-messages">
                        <div v-for="(message, index) in room.messages" :key="index">
                            <div v-if="message.text !== 'Room has been created'">
                                <b>{{ message.sender.username }} @ {{ message.room }}</b>
                                <div>
                                    <i v-if="message.sender.username === 'server'">{{ message.text }}</i>
                                    <span v-else>{{ message.text }}</span>
                                </div>
                                <br>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <b-modal id="room-create" title="Create room" @ok="onModalRoomCreate($event)">
            <form @submit.prevent="onModalRoomCreate($event)">
                <input type="text" class="form-control mb-3" placeholder="Room name" v-model="room.name">
            </form>
        </b-modal>
    </div>
</template>

<script>
export default {
    name: "App",
    data() {
        return {
            isAuth: false,
            user: {
                login: "",
                roomName: ""
            },
            message: "",
            socket: null,
            room: {
                name: "",
                username: "",
                messages: []
            },
            rooms: [],
            api: {
                socket: {
                    protocol: "wss",
                    address: "nane.tada.team",
                    path: "ws"
                },
                http: {
                    protocol: "https",
                    address: "nane.tada.team"
                }
            }
        }
    },
    methods: {
        auth() {
            if(this.checkString(this.user.login)) {
                this.connect();
                this.getRooms();
            }
        },
        checkString(value) {
            let regexp = /^[a-zА-ЯёЁ0-9]+$/i;

            if(value.length > 0 && regexp.test(value)) {
                return true;
            } else {
                return false;
            }
        },
        request(url) {
            return fetch(`${this.api.http.protocol}://${this.api.http.address}/${url}`).then(response => {
                if(response.error) {
                    console.log(response.error);
                } else {
                    return response.json();
                }
            });
        },
        connect() {
            this.socket = new WebSocket(`${this.api.socket.protocol}://${this.api.socket.address}/${this.api.socket.path}?${this.serialize(["username"], [this.user.login])}`);
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
        scroll() {
            this.$nextTick(() => {
                this.$refs["chat-messages"].scroll(0, this.$refs["chat-messages"].scrollHeight);
            })
        },
        encrypt(data) {
            return JSON.stringify(data);
        },
        decrypt(data) {
            return JSON.parse(data);
        },
        logout() {
            this.isAuth = false;
            this.user.login = "";
            this.user.roomName = "";
            this.message = "";
            this.socket = null;
            this.room.name = "";
            this.room.username = "";
            this.room.messages = [];
            this.rooms = [];
        },
        getRooms() {
            this.request("api/rooms").then(this.onGetRooms);
        },
        roomJoin(name) {
            if(this.checkString(name)) {
                let message = {
                    sender: {
                        username: "server"
                    },
                    room: name,
                    text: `Пользователь ${this.user.login} вошел в комнату`
                }

                this.user.roomName = name;
                this.room.name = name;
                this.room.username = this.user.login;
                this.room.messages = [];
                this.request(`api/rooms/${name}/history`).then(this.onMessageHistory).then(() => {
                    this.room.messages.push(message);
                    this.scroll();
                });
            }
        },
        roomLeave() {
            let message = {
                sender: {
                    username: "server"
                },
                room: this.room.name,
                text: `Пользователь ${this.user.login} покинул комнату`
            }

            this.room.name = "";
            this.room.username = "";
            this.user.roomName = "";
            this.room.messages.push(message);
        },
        roomCreate() {
            if(this.room.name.length === 0) {
                this.$bvModal.show("room-create");
            }
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
                this.scroll();
            }
        },
        onMessageHistory(response) {
            this.room.messages.push(...response.result);
        },
        onGetRooms(response) {
            this.rooms = response.result;
        },
        onModalRoomCreate(event) {
            if(this.checkString(this.room.name)) {
                this.$bvModal.hide("room-create");

                if(!this.rooms.find(room => room.name === this.room.name)) {
                    this.message = "Room has been created";
                    this.sendMessage();
                }

                this.roomJoin(this.room.name);
                this.getRooms();
            } else {
                event.preventDefault();
            }
        },
        onError(error) {
            console.log(error);
        }
    }
}
</script>

<style>
.form {
    width: 400px;
    margin: 0 auto;
    margin-top: 100px;
}

.rooms {
    min-width: 200px;
}

.chat {
    flex: 1;
}

.rooms__buttons {
    height: calc(100vh - 200px);
}

.chat__messages {
    height: calc(100vh - 200px);
}

.modal-backdrop {
    background-color: rgba(0,0,0,.5) !important;
}
</style>