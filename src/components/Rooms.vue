<template>
    <div class="rooms border-right pr-3 mr-3">
        <button type="button" class="btn btn-success btn-block mb-2" @click="$parent.roomCreate" :disabled="$parent.user.roomName.length !== 0">Room create</button>
        <div class="border-top mb-2"></div>
        <div class="rooms__buttons overflow-auto">
            <div v-for="(room, index) in rooms" :key="index">
            <div class="btn btn-block text-left mb-2 rooms__button" :class="$parent.user.roomName === room.name ? 'btn-success' : 'btn-info'" @click="$parent.roomJoin(room.name)">{{ room.name }}</div>
        </div>
        </div>

        <b-modal id="room-create" title="Create room" @ok="$parent.onModalRoomCreate($event)" :ok-disabled="!$parent.checkString($parent.room.name) || $parent.room.name.length >= $parent.settings.max_room_title_length">
            <form @submit.prevent="$parent.onModalRoomCreate($event)">
                <input type="text" class="form-control mb-3" placeholder="Room name" v-model="$parent.room.name">
            </form>
        </b-modal>
    </div>
</template>

<script>
export default {
    props: {
        rooms: Array
    }
}
</script>