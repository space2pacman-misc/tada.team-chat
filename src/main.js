import Vue from "vue";
import App from "./App";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.min.css";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

new Vue({
	el: "#app",
	render(h) {
		return h(App)
	}
})