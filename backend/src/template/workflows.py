from modal import App
from run_workflow import app as run_workflow_app
from editing_workflow import app as editing_workflow_app

from config import config
machine_name = config["machine_name"]

app = App(machine_name)

app.include(run_workflow_app)
app.include(editing_workflow_app)
