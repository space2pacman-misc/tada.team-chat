<template>
    <div id="app" class="container mt-5">
        <div v-if="!isAuth">
            <Auth />
        </div>
        <div v-if="isAuth" class="card">
            <div class="card-body d-flex">
                <Rooms :rooms="rooms" />
                <Chat :messages="room.messages" />
            </div>
        </div>
    </div>
</template>

<script>
import Auth from "@/components/Auth";
import Rooms from "@/components/Rooms";
import Chat from "@/components/Chat";

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
            },
            settings: {
                max_message_length: null,
                max_room_title_length: null,
                max_history_length: 10
            }
        }
    },
    methods: {
        auth() {
            if(this.checkString(this.user.login)) {
                this.connect();
                this.getRooms();
                this.getSettings();
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
        encrypt(data) {
            return JSON.stringify(data);
        },
        decrypt(data) {
            return JSON.parse(data);
        },
        logout() {
            this.socket.close();
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
        getSettings() {
            this.request("api/settings").then(this.onGetSettings);
        },
        roomJoin(name) {
            if(this.checkString(name) && this.user.roomName !== name) {
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
                    this.$emit("scroll");
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
            this.message = "";
            this.room.messages.push(message);
        },
        roomCreate() {
            this.room.name = "";
            this.$bvModal.show("room-create");
        },
        sendMessage() {
            if(this.message.length > 0 && this.message.length < this.settings.max_message_length) {
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
                this.$emit("scroll");
            }
        },
        onMessageHistory(response) {
            if(response.result.length > this.settings.max_history_length) {
                let start = response.result.length - 10;
                let end = response.result.length;

                this.room.messages.push(...response.result.slice(start, end));
            } else {
                this.room.messages.push(...response.result);
            }
        },
        onGetRooms(response) {
            this.rooms = response.result;
        },
        onGetSettings(response) {
            this.settings.max_message_length = response.result.max_message_length;
            this.settings.max_room_title_length = response.result.max_room_title_length;
        },
        onModalRoomCreate(event) {
            if(this.checkString(this.room.name) && this.room.name.length < this.settings.max_room_title_length) {
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
    },
    components: {
        Auth,
        Rooms,
        Chat
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
    width: 200px;
}

.chat {
    flex: 1;
}

.rooms__buttons {
    height: calc(100vh - 200px);
}

.rooms__button {
    width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chat__messages {
    height: calc(100vh - 200px);
}

.modal-backdrop {
    background-color: rgba(0,0,0,.5) !important;
}
</style>