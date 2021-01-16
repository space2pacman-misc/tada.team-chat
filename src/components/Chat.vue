<template>
    <div class="chat">
        <form @submit.prevent="$parent.sendMessage" class="input-group flex-nowrap">
            <input type="text" placeholder="Message" class="form-control w-100" v-model="$parent.message" :disabled="$parent.user.roomName.length === 0">
            <div class="input-group-append">
                <button type="button" @click="$parent.sendMessage" class="btn btn-primary" :disabled="$parent.user.roomName.length === 0 || $parent.message.length >= $parent.settings.max_message_length">Send</button>
                <button type="button" @click="$parent.roomLeave" class="btn btn-info" :disabled="$parent.user.roomName.length === 0">Leave</button>
                <button type="button" @click="$parent.logout" class="btn btn-danger">Logout</button>
            </div>
        </form>

        <div class="overflow-auto chat__messages mt-3" ref="chat-messages">
            <div v-for="(message, index) in messages" :key="index">
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
</template>

<script>
export default {
    methods: {
        scroll() {
            this.$nextTick(() => {
                if(this.$refs["chat-messages"]) {
                    this.$refs["chat-messages"].scroll(0, this.$refs["chat-messages"].scrollHeight);
                }
            })
        }
    },
    props: {
        messages: Array
    },
    mounted() {
        this.$parent.$on("scroll", this.scroll);
    }
}
</script>