import { app } from "../../scripts/app.js";

const ext = {
  name: "comfyrun",
  init(app) {
    const urlParams = new URLSearchParams(window.location.search);
    const edit_workflow = urlParams.get("edit_workflow");

    if (edit_workflow == "true") {
      document.querySelector(".comfy-menu").style.display = "none";

      app.queuePrompt = ((originalFunction) => async () => {
        sendEventToParentWindow("show_edit_page_prompt", null);
      })(app.queuePrompt);
    }
  },

  async setup() {},
};

app.registerExtension(ext);

function sendEventToParentWindow(type, data, origin = "*") {
  const message = {
    type,
    data,
  };
  window.parent.postMessage(JSON.stringify(message), origin);
}
