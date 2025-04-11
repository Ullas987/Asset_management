sap.ui.define([
    "stx/zam24/controller/BaseController",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "stx/zam24/util/formatter"
],
    function (BaseController, Fragment, MessageToast, JSONModel, MessageBox, formatter) {
        "use strict";

        return BaseController.extend("stx.zam24.controller.Asset", {
            formatter: formatter,
            onInit: function () {
                this.oRouter = this.getOwnerComponent().getRouter();
                var oModel = new JSONModel();
                oModel.setData({
                    "AssetData": {
                        "ASSEST_ID": "",
                        "ASSET_NAME": "Mahesh",
                        "ASSET_TYPE": "",
                        "ASSET_STATUS": "",
                        "ASSET_LOCATION": "",
                        "ASSET_SUBLOCATION": "",
                        "SERIAL_NUMBER": "",
                        "SHORT_DESCRIPTION": "",
                        "MODEL": "",
                        "MANUFACTURER": "",
                        "YEAR_OF_MANUFACTURE": "",
                        "PRODUCT_COLOR": "",
                        "MEMORY": "",
                        "STORAGE": "",
                        "PROCESSOR": "",
                        "RESOLUTION": ""
                    }
                });
                this.getView().setModel(oModel, "local");
                //history local model
                var localHistoryModel = new JSONModel();
                this.getView().setModel(localHistoryModel, "localHistory");
            },
            oAssetPopUp: null,
            oSelectedData: null,
            operation: null,//Either update or create

            // onCreate Button Press
            onCreate: function () {
                this.operation = "CREATE";
                this.openPopUP();

                var oModel = this.getView().getModel("local");
                oModel.setData({
                    "AssetData": {
                        "ASSEST_ID": "",
                        "ASSET_NAME": "",
                        "ASSET_TYPE": "",
                        "ASSET_STATUS": "",
                        "ASSET_LOCATION": "",
                        "ASSET_SUBLOCATION": "",
                        "SERIAL_NUMBER": "",
                        "SHORT_DESCRIPTION": "",
                        "MODEL": "",
                        "MANUFACTURER": "",
                        "YEAR_OF_MANUFACTURE": "",
                        "PRODUCT_COLOR": "",
                        "MEMORY": "",
                        "STORAGE": "",
                        "PROCESSOR": "",
                        "RESOLUTION": ""
                    }
                });
                // this.getView().setModel(oModel, "local");

            },
            // onUpdate Button Press
            onUpdate: function () {
                this.operation = "UPDATE";

                if (this.oSelectedData && this.oSelectedData.ASSEST_ID) {
                    var sServiceUrl = "/AssetSet(guid'" + this.oSelectedData.ASSEST_ID + "')";
                    var oModel = this.getView().getModel();
                    oModel.read(sServiceUrl, {
                        success: function (oData) {
                            var oLocalModel = this.getView().getModel("local");
                            if (oLocalModel) {
                                oLocalModel.setProperty("/AssetData", oData);
                            }
                            this.openPopUP();
                        }.bind(this),
                        error: function () {
                            MessageToast.show("Failed to fetch full asset data");
                        }
                    })
                }
                //if oSelectedData is empty
                else {
                    MessageToast.show("Please select an asset first.");
                }
            },
            onPopupConfirm: function (oEvent) {
                var that = this;
                var passedValidation = this.validateForm();
                if (passedValidation === true) {

                    // Getting default model
                    var oModel = this.getView().getModel();
                    var payload = this.getView().getModel("local").getProperty("/AssetData");
                    if (this.operation === "CREATE") {
                        // Create Call

                        payload.ASSEST_ID = "00000000-0000-0000-0000-000000000000";
                        oModel.create("/AssetSet", payload, {
                            success: () => {
                                // Refresh the model
                                that.getView().getModel().refresh();
                                MessageToast.show("Successfully created the asset " + payload.SERIAL_NUMBER);
                                this.oAssetPopUp.close();
                            },
                            error: (error) => {
                                MessageBox.show(error + "Error while creating the asset");
                            }
                        })
                    }
                    else {
                        var sPath = "/AssetSet(guid'" + payload.ASSEST_ID + "')"; // OData update path
                        // Update Call
                        oModel.update(sPath, payload, {
                            success: () => {
                                // Refresh the model
                                that.getView().getModel().refresh();
                                MessageToast.show("Successfully updated the asset " + payload.SERIAL_NUMBER);
                                this.oAssetPopUp.close();
                            },
                            error: (error) => {
                                MessageBox.show(error + " Error while updating the asset");
                            }
                        });
                    }

                }
                this.getView().byId("idAssetSmartTable").rebindTable(true);
            },
            onPopupCancel: function () {
                this.oAssetPopUp.close();
            },
            validateForm: function () {
                var isValid = true;

                // Fetch UI elements inside the fragment
                var assetName = Fragment.byId("createPopUp", "AssetName");
                var assetType = Fragment.byId("createPopUp", "AssetType");
                var serialNumber = Fragment.byId("createPopUp", "SerialNumber");
                var AssetStatus = Fragment.byId("createPopUp", "AssetStatus");
                var AssetLocation = Fragment.byId("createPopUp", "AssetLocation");


                // Array of fields to validate (except Serial Number)
                var fieldsInputs = [assetName, assetType, serialNumber];

                // Loop through fields and validate
                fieldsInputs.forEach(function (field) {
                    if (!field.getValue().trim()) {
                        field.setValueState("Error");
                        field.setValueStateText("This field is required");
                        isValid = false;
                    } else {
                        field.setValueState("None"); // Reset error state if valid
                    }
                });

                var fieldsSelects = [AssetStatus, AssetLocation]

                // Loop through fields and validate
                fieldsSelects.forEach(function (selField) {
                    if (selField.getSelectedItem() || !selField.getSelectedItem() === null) {
                        if (!selField.getSelectedItem().getKey().trim()) {
                            selField.setValueState("Error");
                            selField.setValueStateText("This field is required");
                            isValid = false;
                        } else {
                            selField.setValueState("None"); // Reset error state if valid
                        }
                    } else {
                        selField.setValueState("Error");
                        selField.setValueStateText("This field is required");
                        isValid = false;
                    }
                });

                return isValid;
            },

            //A common function that create popup object for both update and create
            openPopUP: function () {
                // this.getView
                var that = this;
                if (!this.oAssetPopUp) {
                    Fragment.load({
                        name: "stx.zam24.fragment.create",
                        id: "createPopUp",
                        type: "XML",
                        controller: this
                    })
                        .then(function (oDialog) {
                            that.oAssetPopUp = oDialog;
                            that.getView().addDependent(that.oAssetPopUp);
                          // setting max year
                            var oDatePicker =  Fragment.byId("createPopUp","idManufactureYear"); 
                            var currentYear = new Date()
                            oDatePicker.setMaxDate(currentYear);

                            // Disable the Status Field while Updating
                            if (that.operation === "UPDATE") {
                                Fragment.byId("createPopUp", "AssetStatus").setEnabled(false);
                            } else {
                                Fragment.byId("createPopUp", "AssetStatus").setEnabled(true);
                            }
                            that.oAssetPopUp.open();
                        });
                }
                else {
                    // Disable the Status Field while Updating
                    if (that.operation === "UPDATE") {
                        Fragment.byId("createPopUp", "AssetStatus").setEnabled(false);
                    } else {
                        Fragment.byId("createPopUp", "AssetStatus").setEnabled(true);
                    }
                    this.oAssetPopUp.open();
                }

            },
            onSelectionChange: function (oEvent) {
                //Enable Buttons
                this.getView().byId("idUpdateBtn").setProperty("enabled", true);
                this.getView().byId("idDeleteBtn").setProperty("enabled", true);
                this.getView().byId("idHistory").setProperty("enabled", true);
                this.getView().byId("idStatusTooglebtn").setProperty("enabled", true);
                // var oTable = oEvent.getSource(); // Get the table control
                var sPath = oEvent.getParameter("listItem").getBindingContextPath(); //Row path
                //Get default model
                var oModel = this.getView().getModel();
                if (oModel) {
                    this.oSelectedData = oModel.getProperty(sPath); // Get data from the model using the path
                }

                // check if asset is active
                if (this.oSelectedData.ASSET_STATUS.toLowerCase() === "active") {
                    this.getView().byId("idStatusTooglebtn").setProperty("text", "Inactivate");
                    this.getView().byId("idStatusTooglebtn").setProperty("type", "Reject");
                } else {
                    this.getView().byId("idStatusTooglebtn").setProperty("type", "Accept");
                    this.getView().byId("idStatusTooglebtn").setProperty("text", "Activate");
                }
            },
            gotoAvailableAssetPage: function () {
                this.oRouter.navTo("AvailAssignRoute");
            },
            onInactive: function () {
                var that = this;
                // Read the complete data based on selection
                if (this.oSelectedData && this.oSelectedData.ASSEST_ID) {
                    var sServiceUrl = "/AssetSet(guid'" + this.oSelectedData.ASSEST_ID + "')";
                    var oModel = this.getView().getModel();
                    oModel.read(sServiceUrl, {
                        success: function (oData) {
                            var sPath = "/AssetSet(guid'" + oData.ASSEST_ID + "')"; // OData update path
                            var payload = oData;
                            var btnStatusText = payload.ASSET_STATUS;
                            if (payload.ASSET_STATUS.toLowerCase() === "active") {
                                payload.ASSET_STATUS = "Inactive";
                            } else {
                                payload.ASSET_STATUS = "Active";
                            }
                            // Update Call
                            oModel.update(sPath, payload, {
                                success: () => {
                                    MessageToast.show("Sucessfully Updated the Asset " + payload.SERIAL_NUMBER);
                                    // Refresh the model
                                    that.getView().getModel().refresh();
                                    that.getView().byId("idStatusTooglebtn").setText(btnStatusText);
                                    that.getView().byId("idStatusTooglebtn").setType(btnStatusText === "Active" ? "Accept" : "Reject");
                                },
                                error: (oError) => {
                                    let vEmpID, sError;
                                    if (oError.responseText) {
                                        try {
                                            let oErrorResponse = JSON.parse(oError.responseText);
                                            vEmpID = oErrorResponse.error.message.value;
                                        } catch (e) {
                                            sError = oError.message;
                                        }
                                    } else {
                                        sError = oError.message;
                                    }
                                    var eheader = {
                                        "Confirm": true
                                    };
                                    MessageBox.confirm(
                                        `This asset is assigned to User ${vEmpID}. Are you sure?`,
                                        {
                                            title: "Confirmation",
                                            icon: MessageBox.Icon.WARNING,
                                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                                            emphasizedAction: MessageBox.Action.YES,
                                            onClose: function (oAction) {
                                                if (oAction === MessageBox.Action.YES) {
                                                    // Update Call
                                                    oModel.update(sPath, payload, {
                                                        headers: eheader,
                                                        success: () => {
                                                            MessageToast.show("Sucessfully updated the Asset " + payload.SERIAL_NUMBER);
                                                            // Refresh the model
                                                            that.getView().getModel().refresh();
                                                            that.getView().byId("idStatusTooglebtn").setText(btnStatusText);
                                                            that.getView().byId("idStatusTooglebtn").setType(btnStatusText === "Active" ? "Accept" : "Reject");

                                                        },
                                                        error: () => {
                                                            MessageBox.error("Can't able to update the Asset " + payload.SERIAL_NUMBER)
                                                        }
                                                    });
                                                }
                                            }
                                        });

                                }

                            });

                        }.bind(this),
                        error: function () {
                            MessageToast.show("Failed to fetch full asset data.");
                        }
                    });
                }
                //if oSelectedData is empty
                else {
                    MessageToast.show("Please select an asset first.");
                }
                // this.oAssetPopUp.close();
            },

            onDelete: function () {
                var that = this;
                if (this.oSelectedData && this.oSelectedData.ASSEST_ID) {
                    var oModel = this.getView().getModel();
                    var sPath = "/AssetSet(guid'" + this.oSelectedData.ASSEST_ID + "')"; // OData update path
                    oModel.remove(sPath, {
                        success: (data, response) => {
                            MessageToast.show("Successfully Deleted the asset " + that.oSelectedData.SERIAL_NUMBER);
                            that.getView().byId("idUpdateBtn").setEnabled(false);
                        },
                        error: (oError) => {
                            let vEmpID, sError;
                            if (oError.responseText) {
                                try {
                                    let oErrorResponse = JSON.parse(oError.responseText);
                                    vEmpID = oErrorResponse.error.message.value;
                                } catch (e) {
                                    sError = oError.message;
                                }
                            } else {
                                sError = oError.message;
                            }
                            var eheader = {
                                "Confirm": true
                            };
                            MessageBox.confirm(
                                `This asset is assigned to User ${vEmpID}. Are you sure?`,
                                {
                                    title: "Confirmation",
                                    icon: MessageBox.Icon.WARNING,
                                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                                    emphasizedAction: MessageBox.Action.YES,
                                    onClose: function (oAction) {
                                        if (oAction === MessageBox.Action.YES) {
                                            // Delete Call
                                            oModel.remove(sPath, {
                                                headers: eheader,
                                                success: () => {
                                                    MessageToast.show(" Successfully deleted the asset" + that.oSelectedData.SERIAL_NUMBER);
                                                    that.getView().byId("idUpdateBtn").setEnabled(false);
                                                    // Refresh the model
                                                    that.getView().getModel().refresh();
                                                },
                                                error: () => {
                                                    MessageBox.error("Can't able to delete the Asset " + that.oSelectedData.SERIAL_NUMBER)
                                                }
                                            });
                                        }
                                    }
                                });
                        }
                    });
                }
                else {
                    MessageToast.show("Please select an asset first");
                }

            },
            onHistory: function () {

                var sServiceUrl = "/AssetSet(guid'" + this.oSelectedData.ASSEST_ID + "')";
                var oModel = this.getView().getModel();

                oModel.read(sServiceUrl, {
                    urlParameters: {
                        "$expand": "toAssignedAsset"
                    },
                    success: function (oData) {
                        var oJsonHistory = this.getView().getModel('localHistory');
                        // var history_data =  oData.toAssignedAsset
                        oJsonHistory.setData(oData.toAssignedAsset);
                        oJsonHistory.setProperty("/AssetDetails", {
                            AssetsName: this.oSelectedData.ASSET_NAME,
                            AssetsType: this.oSelectedData.ASSET_TYPE
                        });
                        this.openHinstory();

                    }.bind(this),
                    error: (oError) => {
                        MessageBox.show('Error while fetching the history: ' + oError.message);
                    }
                });
            },
            openHinstory: function () {
                var that = this;
                if (!this.oHistory) {
                    Fragment.load({
                        name: "stx.zam24.fragment.assetHistory",
                        id: "idAssetHistory",
                        type: "XML",
                        controller: this
                    }).then(function (oDialog) {
                        that.oHistory = oDialog;
                        that.oHistory.setContentWidth("600px");
                        that.oHistory.setContentHeight("250px");
                        that.getView().addDependent(that.oHistory);
                        var oHistoryTable = Fragment.byId("idAssetHistory", "idHistoryTable");
                        var oJsonHistory = that.getView().getModel('localHistory');
                        oHistoryTable.setModel(oJsonHistory);
                        that.oHistory.open();

                    })

                }
                else {
                    that.oHistory.open();
                }
            },
            onCloseHistory: function () {
                this.oHistory.close();
            }

        });
    });
