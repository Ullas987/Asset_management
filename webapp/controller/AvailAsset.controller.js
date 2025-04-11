sap.ui.define([
    "stx/zam24/controller/BaseController", "sap/ui/core/Fragment", "sap/ui/model/json/JSONModel", "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"],
    function (BaseController, Fragment, JSONModel, Filter, FilterOperator) {
        'use strict';
        return BaseController.extend("stx.zam24.controller.AvailAsset", {
            onInit: function () {
                // Getting Router object for navigation purpose.
                this.oRouter = this.getOwnerComponent().getRouter();
                // Creating Local EMP model for live searching.
                var oLocalEmpModel = new JSONModel()
                // Creating Local Json model for creating new record.
                var localJsonModel = new JSONModel();
                localJsonModel.setData(
                    {
                        AssignAsset: {
                            "ASSIGNED_ID": "",
                            "EMPLOYEE_ID": "",
                            "EMPLOYEE_NAME": "",
                            "STATUS": "",
                            "ASSIGNED_DATE": "",
                            "END_DATE": "",
                            "ASSEST_ID": ""
                        }
                    }
                )
                this.getView().setModel(oLocalEmpModel, "localEmpModel");
                this.getView().setModel(localJsonModel, "localModel");
                // var oLocalTemp = this.getView().getModel("localEmpModel");
            },
            oDialogAssignAsset: null,
            sPath: null,
            onCreate: function (oEvent) {
                var that = this;
                if (this.oDialogAssignAsset === null) {
                    var oLocalTemp = this.getView().getModel("localEmpModel");
                    var oEmpModel = this.getView().getModel().read("/EmployeeSet", {
                        success: (oData) => {
                            oLocalTemp.setData({ employees: oData.results });
                        },
                        error: () => {
                            sap.m.MessageToast.show("Fetech failed");
                        }
                    });
                    Fragment.load(
                        {
                            name: "stx.zam24.fragment.assignAsset",
                            id: "idAssignAssetForm",
                            type: "XML",
                            controller: this
                        }
                    ).then(function (oDialogAssignAssetFragement) {
                        that.oDialogAssignAsset = oDialogAssignAssetFragement;
                        // Setting basic details for Valuehelp Dialog
                        that.oDialogAssignAsset.setTitle("Assign Item");
                        that.oDialogAssignAsset.setDraggable(true)
                        that.oDialogAssignAsset.setResizable(true)
                        // Setting serial number to popUp
                        var oSNum = Fragment.byId("idAssignAssetForm", "sNum");
                        var oModel = that.getView().getModel();
                        var oselData = oModel.getProperty(that.sPath);
                        oSNum.setValue(oselData.SERIAL_NUMBER);
                        var oDatePicker = Fragment.byId("idAssignAssetForm", "idDatePick")
                        oDatePicker.setMinDate(new Date())
                        that.getView().addDependent(that.oDialogAssignAsset);
                        if (that.sPath == null) {
                            sap.m.MessageToast.show("Please select a row");
                        }
                        else {
                            that.oDialogAssignAsset.open();
                        }
                    })
                } else {
                    if (this.sPath == null) {
                        sap.m.MessageToast.show("Please select a row");
                    }
                    else {
                        var oSNum = Fragment.byId("idAssignAssetForm", "sNum");
                        var oModel = this.getView().getModel();
                        var oselData = oModel.getProperty(this.sPath);
                        oSNum.setValue(oselData.SERIAL_NUMBER);
                        this.oDialogAssignAsset.open()
                    }
                }

            },
            setDataToDialog: function (oEvent) {
                // Enabling the Assign Button
                var btnAssign = this.getView().byId("idAccept");
                btnAssign.setEnabled(true);
                btnAssign.setTooltip("Assign the Asset");
                // Setting the context path of selected record
                var oLocalModel = this.getView().getModel("localModel");
                this.sPath = oEvent.getParameter("listItem").getBindingContextPath();
                var oModel = this.getView().getModel();
                var oselData = oModel.getProperty(this.sPath);
                oLocalModel.setProperty("/AssignAsset/ASSEST_ID", oselData.ASSEST_ID);
            },
            onAssign: function () {
                var valiadationPassed = this.validateForm();
                if (valiadationPassed) {
                    var oModel = this.getOwnerComponent().getModel();
                    var oLocalModel = this.getView().getModel("localModel");
                    var odata = oLocalModel.getProperty("/AssignAsset");
                    odata.ASSIGNED_ID = "6ac75ebd-ac13-1fe0-8196-b7adf555e063";
                    odata.STATUS = "ACTIVE"
                    var assignedDateStr = String(odata.ASSIGNED_DATE);
                    if (assignedDateStr.length > 8) {
                        odata.ASSIGNED_DATE = new Date(odata.ASSIGNED_DATE).toISOString().split("T")[0].replace(/-/g, "");
                    }
                    odata.END_DATE = " ";
                    let sPath = "/AssignedAssetSet";
                    oModel.create(sPath, odata, {
                        success: () => {
                            // Refresh the model
                            this.getView().getModel().refresh();
                            sap.m.MessageToast.show("Successfully  Assigned");
                            oLocalModel.setProperty("/AssignAsset", {
                                ASSIGNED_ID: "",
                                EMPLOYEE_ID: "",
                                EMPLOYEE_NAME: "",
                                STATUS: "",
                                ASSIGNED_DATE: "",
                                END_DATE: "",
                                ASSEST_ID: ""
                            });
                            this.oDialogAssignAsset.close()
                            oModel.refresh();
                        },
                        error: (oError) => {
                            let invalidMsg, sError;
                            if (oError.responseText) {
                                try {
                                    let oErrorResponse = JSON.parse(oError.responseText);
                                    invalidMsg = oErrorResponse.error.message.value;
                                } catch (e) {
                                    sError = oError.message;
                                }
                            } else {
                                sError = oError.message;
                            }
                            if (invalidMsg) {
                                var oempId = Fragment.byId("idAssignAssetForm", "EmpID");
                                oempId.setValueState("Error");
                                oempId.setValueStateText("Invalid Employee ID");
                                sap.m.MessageToast.show("Enter Valid Employee ID");
                            } else {
                                sap.m.MessageToast.show("Failed to  Transfer");
                            }
                        }
                    })
                }
            },
            validateForm: function () {
                var isValid = true;

                // Fetch UI elements inside the fragment
                var serialNum = Fragment.byId("idAssignAssetForm", "sNum");
                var assignedDate = Fragment.byId("idAssignAssetForm", "idDatePick");
                var empName = Fragment.byId("idAssignAssetForm", "EmpName");
                var empID = Fragment.byId("idAssignAssetForm", "EmpID");

                // Array of fields to validate (except Serial Number)
                var fields = [serialNum, assignedDate, empName, empID];

                // Loop through fields and validate
                fields.forEach(function (field) {
                    if (!field.getValue().trim()) {
                        field.setValueState("Error");
                        field.setValueStateText("This field is required");
                        isValid = false;
                    } else {
                        field.setValueState("None"); // Reset error state if valid
                    }
                });
                return isValid;
            },
            onCancel: function () {
                var oLocalModel = this.getView().getModel("localModel");
                oLocalModel.setProperty("/AssignAsset", {
                    ASSIGNED_ID: "",
                    EMPLOYEE_ID: "",
                    EMPLOYEE_NAME: "",
                    STATUS: "",
                    ASSIGNED_DATE: "",
                    END_DATE: "",
                    ASSEST_ID: ""
                })
                this.oDialogAssignAsset.close();
            },
            oValueHelpPopUp: null,
            vhEmpSelect: function (oEvent) {
                var that = this;
                if (this.oValueHelpPopUp == null) {
                    Fragment.load(
                        {
                            name: "stx.zam24.fragment.valuehelp",
                            id: "idF2",
                            type: "XML",
                            controller: this
                        }
                    ).then(function (oValueHelpFragment) {
                        that.oValueHelpPopUp = oValueHelpFragment;
                        that.getView().addDependent(that.oValueHelpPopUp);
                        var oValueHelpDialog = Fragment.byId("idF2", "idvh");
                        oValueHelpDialog.setSupportMultiselect(false);
                        oValueHelpDialog.setTitle("Select an Empolyee");
                        oValueHelpDialog.setFilterMode(true);
                        var oLocalTemp = that.getView().getModel("localEmpModel");
                        // Creating Filter bar
                        var oSearch = new sap.m.SearchField("idSearch")
                        // Live change in search bar.
                        oSearch.attachLiveChange(that.getView().getModel(), function (oEvent) {
                            var aFilters = [];
                            var sQuery = oEvent.getSource().getValue();
                            if (sQuery && sQuery.length > 0) {
                                var filter = new Filter("Employee_id", FilterOperator.Contains, sQuery);
                                aFilters.push(filter);
                            }
                            var oList = oValueHelpDialog.getTable()
                            var oBinding = oList.getBinding("items");
                            oBinding.filter(aFilters);
                        })
                        var oFilterBar = new sap.ui.comp.filterbar.FilterBar("idFilterBar");
                        oFilterBar.setUseToolbar(false);
                        oFilterBar.setBasicSearch(oSearch);
                        oFilterBar.setShowGoOnFB(false);
                        oValueHelpDialog.setFilterBar(oFilterBar);
                        oValueHelpDialog.setContentWidth("600px");
                        oValueHelpDialog.setContentHeight("400px");
                        // --------------------Adding cells to table dynamically------------------------
                        var oTable = new sap.m.Table("idSimpleTable", {
                            columns: [
                                new sap.m.Column({
                                    header: new sap.m.Label({ text: "Employee ID" })
                                }),
                                new sap.m.Column({
                                    header: new sap.m.Label({ text: "Employee Name" })
                                })
                            ],
                            mode: "SingleSelectMaster"
                        });
                        // Attaching the action to ValueHelpDiaolog
                        oValueHelpDialog.attachSelectionChange((oEvent) => {
                            var list = oEvent.getParameter("tableSelectionParams");
                            var listPath = list.listItem.getBindingContextPath();
                            var empDetail = that.getView().getModel("localEmpModel").getProperty(listPath);
                            var oLocalModel = that.getView().getModel("localModel");
                            // Setting selected employee details to Localmodel
                            var empID = String(empDetail.Employee_id).trim();
                            oLocalModel.setProperty("/AssignAsset/EMPLOYEE_ID", empID);
                            oLocalModel.setProperty("/AssignAsset/EMPLOYEE_NAME", empDetail.Employee_Name);
                            // remove selection
                            if (oTable && oTable.removeSelections) {
                                oTable.removeSelections(true); // true = suppress selectionChange event
                            }
                            that.fClearDataDialog(oValueHelpDialog);
                            oValueHelpDialog.close()
                            // Clearing the Error Msg on Emp ID Input
                            var oempId = Fragment.byId("idAssignAssetForm", "EmpID");
                            oempId.setValueState("None");
                        })
                        // Binding the data to table
                        oTable.bindItems({
                            path: "localEmpModel>/employees",
                            template: new sap.m.ColumnListItem({
                                cells: [
                                    new sap.m.Text({ text: "{localEmpModel>Employee_id}" }),
                                    new sap.m.Text({ text: "{localEmpModel>Employee_Name}" })
                                ]
                            })
                        });
                        oValueHelpDialog.setTable(oTable);
                        that.oValueHelpPopUp.open();
                    })
                } else {
                    this.oValueHelpPopUp.open()
                }
            },
            vhCancel: function () {
                var oValueHelpDialog = Fragment.byId("idF2", "idvh");
                this.fClearDataDialog(oValueHelpDialog);
                this.oValueHelpPopUp.close();
            },
            fClearDataDialog: function (oValueHelpDialog) {
                var oFilter = oValueHelpDialog.getFilterBar();
                oFilter.attachClear(function (oEvent) {
                    var oSearch = sap.ui.getCore().byId("idSearch");
                    oSearch.setValue("");
                });
                oFilter.fireClear();
                var oTable = oValueHelpDialog.getTable();
                if (oTable && oTable.getBinding("items")) {
                    oTable.getBinding("items").filter([]);
                }
            },
            gotoAssignedAssetPage: function () {
                this.oRouter.navTo("UnAvailAssignRoute");
            },
            gotoAssetPage: function () {
                this.oRouter.navTo("AssetRoute");
            },
            onSubmit: function (oEvent) {
                var value = oEvent.getParameters("value").value;
                var aData = this.getView().getModel("localEmpModel").getProperty("/employees");
                var aFiltered = aData.filter(emp =>
                    emp.Employee_id.toString() === value.toUpperCase()
                );

                if (aFiltered) {
                    var empDetail = aFiltered[0];
                    var oLocalModel = this.getView().getModel("localModel");
                    var empID = String(empDetail.Employee_id).trim();
                    oLocalModel.setProperty("/AssignAsset/EMPLOYEE_ID", empID);
                    oLocalModel.setProperty("/AssignAsset/EMPLOYEE_NAME", empDetail.Employee_Name);
                }
            }
        });
    });






