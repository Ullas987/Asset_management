sap.ui.define([
    "stx/zam24/controller/BaseController", "sap/ui/model/json/JSONModel"
],
function (BaseController,JSONModel) {
    "use strict";

    return BaseController.extend("stx.zam24.controller.App", {
        onInit: function () {
            var oAuth = new JSONModel()
            this.getOwnerComponent().setModel(oAuth, "Authenticate")
            var oModel = this.getOwnerComponent().getModel();
            var that = this;
            oModel.read("/AuthorizationSet", {
                success: function (oRes) {
                    var oAuthObj = that.getOwnerComponent().getModel("Authenticate")

                    var isAdmin = null;
                    var userType = oRes.results[0].role;
                    if (userType !== "ADMIN") {
                        isAdmin = false;
                    } else {
                        isAdmin = true;
                    }

                    oAuthObj.setData({
                        admin: isAdmin
                    })
                    that.admin = oAuthObj.getProperty("/admin")

                    if (that.admin === false) {
                        var oRouter = that.getOwnerComponent().getRouter()
                        oRouter.navTo("UnAvailAssignRoute")
                    }
                },
                error: function (oError) {

                }
            })
        }
    });
});
