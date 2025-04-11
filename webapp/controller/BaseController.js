sap.ui.define([
    "sap/ui/core/mvc/Controller",
],
function (Controller) {
    "use strict";
   
    return Controller.extend("stx.zam24.controller.BaseController", {
        onInit: function () {
            console.log("Base Controller")
        }
    });
});
