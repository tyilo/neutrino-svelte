import { mount } from "svelte";
import App from "./App.svelte";
import { assertNonNull } from "./util";

const app = mount(App, {
	target: assertNonNull(document.getElementById("app")),
});

export default app;
