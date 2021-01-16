<template>
    <form class="form" @submit.prevent="$parent.auth">
        <div class="card w-100">
            <div class="card-body">
                <div class="text-center">
                    <input type="text" class="form-control mb-3" placeholder="Username" v-model="$parent.user.login">
                    <button type="button" class="btn btn-primary btn-block" @click="$parent.auth" :disabled="!$parent.checkString($parent.user.login)">Enter</button>
                </div>
            </div>
        </div>
    </form>
</template>