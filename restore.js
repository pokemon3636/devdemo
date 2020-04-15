const resetPassword = require("./resetPassword");
const resetDemoDatas = require("./resetDemoDatas");

function restore(){
    resetPassword.resetPassword();
    resetDemoDatas.resetDemoDatas();
}

restore();

