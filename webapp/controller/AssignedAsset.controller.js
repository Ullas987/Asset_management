sap.ui.define([
    "stx/zam24/controller/BaseController",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "stx/zam24/util/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",],
    function (BaseController, Fragment, JSONModel, MessageToast, formatter, Filter, FilterOperator, MessageBox) {
        'use strict';
        return BaseController.extend("stx.zam24.controller.AssignedAsset", {
            oModel: null,
            formatter: formatter,
            onInit: function () {
                var localJsonModel = new JSONModel();
                localJsonModel.setData(
                    {
                        "ASSIGNED_ID": "",
                        "EMPLOYEE_ID": "",
                        "EMPLOYEE_NAME": "",
                        "STATUS": "",
                        "ASSIGNED_DATE": "",
                        "END_DATE": "",
                        "ASSEST_ID": ""
                    }
                )

                this.getView().setModel(localJsonModel, "localModel2");
                this.oModel = this.getOwnerComponent().getModel();
                //local employee
                var oLocalEmpModel = new JSONModel();
                this.getOwnerComponent().setModel(oLocalEmpModel, "localEmpModel1");
                // local json for image
                var localImageModel = new JSONModel();
                this.getView().setModel(localImageModel, "localImageModel");


            },
            sPath: null,
            onSelectChange: function (oEvent) {
                var btnUpdate = this.getView().byId("idUpdate");
                var btnTransfer = this.getView().byId("idTransfer");
                var btnRevert = this.getView().byId("idRevert");
                var btnImage = this.getView().byId("idImage");
                // Array of fields to change
                var fields = [btnUpdate, btnTransfer, btnRevert, btnImage];
                // Loop through fields and validate
                fields.forEach(function (field) {
                    if (field) {
                        field.setEnabled(true);
                    }
                });
                this.sPath = oEvent.getParameter("listItem").getBindingContextPath();
                // this.getView().getModel("localModel").setdata(sPath);
            },
            oValueHelpPopUp: null,
            onOpenValueHelp: function (oEvent) {
                var that = this;
                if (this.oValueHelpPopUp == null) {
                    var oLocalTemp = this.getView().getModel("localModel2");
                    var oLocalEmpModel = this.getOwnerComponent().getModel("localEmpModel1")
                    var oEmpModel = this.getView().getModel().read("/EmployeeSet", {
                        success: (oData) => {
                            oLocalEmpModel.setData({ employees: oData.results });
                        },
                        error: (oError) => {
                        }
                    });
                    Fragment.load(
                        {
                            name: "stx.zam24.fragment.valuehelp",
                            id: "idF3",
                            type: "XML",
                            controller: this
                        }
                    ).then(function (oValueHelpFragment) {
                        that.oValueHelpPopUp = oValueHelpFragment;
                        that.getView().addDependent(that.oValueHelpPopUp);
                        var oValueHelpDialog = Fragment.byId("idF3", "idvh");
                        oValueHelpDialog.setSupportMultiselect(false);
                        oValueHelpDialog.setFilterMode(true);
                        oValueHelpDialog.setContentWidth("600px");
                        oValueHelpDialog.setContentHeight("400px");
                        // Creating Filter bar
                        // Add Live change in search bar.
                        var oSearch = new sap.m.SearchField("idSearch1")
                        var oFilterBar = new sap.ui.comp.filterbar.FilterBar("idFilterBar1");
                        oFilterBar.setUseToolbar(false)
                        oSearch.attachLiveChange(that.getView().getModel(), function (oEvent) {
                            var aFilters = [];
                            var sQuery = oEvent.getSource().getValue();
                            var oList = oValueHelpDialog.getTable()
                            var oBinding = oList.getBinding("items");
                            if (sQuery && sQuery.length > 0) {
                                var filter = new Filter("Employee_id", FilterOperator.Contains, sQuery);
                                aFilters.push(filter);
                            }
                            oBinding.filter(aFilters);
                        })
                        // Adding Search Object to filter bar of Valuehelp Dialog
                        oFilterBar.setBasicSearch(oSearch);
                        oFilterBar.setShowGoOnFB(false);
                        oValueHelpDialog.setFilterBar(oFilterBar);
                        // Setting selected employee details to Localmodel
                        oValueHelpDialog.attachSelectionChange((oEvent) => {
                            var list = oEvent.getParameter("tableSelectionParams");
                            var listPath = list.listItem.getBindingContextPath();
                            var empDetail = that.getView().getModel("localEmpModel1").getProperty(listPath);
                            var oLocalModel = that.getView().getModel("localModel2");
                            // Setting selected employee details to Localmodel
                            var empID = String(empDetail.Employee_id).trim();
                            oLocalModel.setProperty("/EMPLOYEE_ID", empID);
                            oLocalModel.setProperty("/EMPLOYEE_NAME", empDetail.Employee_Name);
                            var oTable = oValueHelpDialog.getTable();
                            if (oTable && oTable.removeSelections) {
                                oTable.removeSelections(true); // true = suppress selectionChange event
                            }
                            // Calling function to clear data.
                            that.fClearDataDialog(oValueHelpDialog)
                            oValueHelpDialog.close()
                            // Clearing the Error Msg on Emp ID Input
                            var oempId = Fragment.byId("idTransferFragment", "empID");
                            oempId.setValueState("None");
                        })
                        // Binding the data to table
                        var oTable = new sap.m.Table("idSimpleTable1", {
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
                        oTable.bindItems({
                            path: "localEmpModel1>/employees",
                            template: new sap.m.ColumnListItem({
                                cells: [
                                    new sap.m.Text({ text: "{localEmpModel1>Employee_id}" }),
                                    new sap.m.Text({ text: "{localEmpModel1>Employee_Name}" })
                                ]
                            })
                        });
                        // Setting table to Dialog
                        oValueHelpDialog.setTable(oTable);
                        that.oValueHelpPopUp.open();
                    })
                } else {
                    this.oValueHelpPopUp.open()
                }
            },
            vhCancel: function () {
                var oValueHelpDialog = Fragment.byId("idF3", "idvh")
                this.fClearDataDialog(oValueHelpDialog)
                this.oValueHelpPopUp.close();
            },
            fClearDataDialog: function (oValueHelpDialog) {
                var oFilter = oValueHelpDialog.getFilterBar();
                oFilter.attachClear(function (oEvent) {
                    var oSearch = sap.ui.getCore().byId("idSearch1");
                    oSearch.setValue("");
                });
                oFilter.fireClear();
                var oTable = oValueHelpDialog.getTable();
                if (oTable && oTable.getBinding("items")) {
                    oTable.getBinding("items").filter([]);
                }
            },

            // On Transfer Popup
            oTransferPopUp: null,
            onTransfer: function () {
                var that = this;
                if (this.oTransferPopUp === null) {
                    Fragment.load(
                        {
                            name: "stx.zam24.fragment.transfer",
                            id: "idTransferFragment",
                            type: "XML",
                            controller: this
                        }
                    ).then(function (oDialogCreateFragement) {
                        that.oTransferPopUp = oDialogCreateFragement;
                        that.getView().addDependent(that.oTransferPopUp);
                        if (that.sPath == null) {
                            sap.m.MessageToast.show("Please select the row");
                        }
                        else {
                            that.oTransferPopUp.open();
                        }
                    })
                } else {
                    this.oTransferPopUp.open()
                }
            },
            ClearLocalData: function () {
                var oLoModel = this.getView().getModel("localModel2")
                oLoModel.setProperty("/", {
                    ASSIGNED_ID: "",
                    EMPLOYEE_ID: "",
                    EMPLOYEE_NAME: "",
                    STATUS: "",
                    ASSIGNED_DATE: "",
                    END_DATE: "",
                    ASSEST_ID: ""
                })
            },
            // Transfer Update Call
            onTransferPress: function () {
                var validateTransForm = this.validateTransferPopup();

                if (validateTransForm === true) {
                    var that = this;
                    var oldData = this.oModel.getProperty(this.sPath);
                    var oNewData = this.getView().getModel("localModel2").getData();
                    oNewData.STATUS = "ACTIVE";
                    oNewData.ASSEST_ID = oldData.ASSEST_ID
                    oNewData.ASSIGNED_ID = "00000000-0000-0000-0000-000000000000"
                    oNewData.ASSIGNED_DATE = new Date().toISOString().split("T")[0].replace(/-/g, "");
                    let sPath = "/AssignedAssetSet";
                    this.oModel.create(sPath, oNewData, {
                        success: () => {
                            sap.m.MessageToast.show("Successfully  Transferred");
                            that.ClearLocalData();
                            that.oTransferPopUp.close();
                            that.getView().getModel().refresh();
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
                                var oempId = Fragment.byId("idTransferFragment", "empID");
                                oempId.setValueState("Error");
                                oempId.setValueStateText("Invalid Employee ID");
                                sap.m.MessageToast.show("Enter Valid Employee ID");
                            } else {
                                sap.m.MessageToast.show("Failed to  Transfer");
                            }
                        }
                    });

                }
            },
            validateTransferPopup: function () {
                var isValid = true;

                // Fetch UI elements inside the fragment
                var oempId = Fragment.byId("idTransferFragment", "empID");
                var oempName = Fragment.byId("idTransferFragment", "empName");

                // Array of fields to validate
                var fields = [oempId];


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
            onTransferCancel: function (oEvent) {
                this.ClearLocalData();
                this.oTransferPopUp.close();
            },
            oRevertPopUp: null,
            onRevert: function (oEvent) {
                var that = this;
                if (this.oRevertPopUp === null) {
                    Fragment.load(
                        {
                            name: "stx.zam24.fragment.revertback",
                            id: "idF3",
                            type: "XML",
                            controller: this
                        }
                    ).then(function (oDialogRevertFragement) {
                        that.oRevertPopUp = oDialogRevertFragement;
                        that.getView().addDependent(that.oRevertPopUp);
                        if (that.sPath == null) {
                            sap.m.MessageToast.show("Please select the row");
                        }
                        else {
                            that.oRevertPopUp.open();
                        }
                    })
                } else {
                    this.oRevertPopUp.open()
                }
            },
            onRevertPress: function (oEvent) {
                var that = this;
                var oldData = this.oModel.getProperty(this.sPath)
                oldData.END_DATE = new Date().toISOString().split("T")[0];
                oldData.STATUS = "INACTIVE"
                this.oModel.update(this.sPath, oldData, {
                    success: function () {
                        // Refresh the model
                        that.getView().getModel().refresh();
                        sap.m.MessageToast.show("Asset Taken Back Successfully");
                        that.oRevertPopUp.close();
                    }.bind(this),
                    error: function () {
                    }
                })
            },
            onRevertCancel: function (oEvent) {
                this.oRevertPopUp.close()
            },
            //Image Upload Fragment Loading
            oImagefragment: null,
            onImageView: function () {
                var that = this;
                if (!this.oImagefragment) {
                    Fragment.load({
                        name: "stx.zam24.fragment.image",
                        type: "XML",
                        id: "ImagePopup",
                        controller: that
                    }).then(function (oDialog) {
                        that.oImagefragment = oDialog;
                        that.setupImagePopupElements();
                        that.getView().addDependent(that.oImagefragment);
                        that.oSetDataOpenPop(that);
                    });
                } else {
                    that.setupImagePopupElements();
                    that.oSetDataOpenPop(this);
                }
            },
            setupImagePopupElements: () => {
                // Get references to UI elements
                var oImage = Fragment.byId("ImagePopup", "previewImage");
                var btnUploadPress = Fragment.byId("ImagePopup", "btnUpload");
                var odeleteBtn = Fragment.byId("ImagePopup", "btnDelete");
                odeleteBtn.setVisible(false)

                var oFileUploader = Fragment.byId("ImagePopup", "fileUploader");

                // Clear the image preview
                oImage.setSrc("");
                oImage.setVisible(false);

                // Hide the upload button
                btnUploadPress.setVisible(false);

                // Reset the FileUploader (clear selected file)
                if (oFileUploader) {
                    oFileUploader.clear(); // Clear selected file
                }
            },
            onCancel: function () {
                this.oImagefragment.close();
            },
            // on file select
            onFileUpload: function (oEvent) {
                var oFileUploader = oEvent.getSource();
                var oFile = oFileUploader.oFileUpload.files[0]; // Get selected file

                if (!oFile) {
                    sap.m.MessageToast.show("Please select an image file.");
                    return;
                }

                var oImage = Fragment.byId("ImagePopup", "previewImage"); // Get Image control
                var btnUploadPress = Fragment.byId("ImagePopup", "btnUpload");
                btnUploadPress.setVisible(true);
                var odeleteBtn = Fragment.byId("ImagePopup", "btnDelete");
                odeleteBtn.setVisible(false)

                // Read the file and convert it to a Base64 string
                var reader = new FileReader();
                reader.onload = function (e) {
                    oImage.setSrc(e.target.result); // Set Base64 image source
                    oImage.setVisible(true); // Show image preview
                };
                reader.readAsDataURL(oFile);

            },
            // Upload Button Press
            onUploadPress: function () {
                // getting Currect Date in this format DDMMYYYY
                var oDate = new Date();
                var sFormattedDate = oDate.getDate().toString().padStart(2, '0') +
                    (oDate.getMonth() + 1).toString().padStart(2, '0') +
                    oDate.getFullYear() +
                    oDate.getHours().toString().padStart(2, '0') +
                    oDate.getMinutes().toString().padStart(2, '0');

                var oData = this.getView().getModel().getProperty(this.sPath);
                var oImage = Fragment.byId("ImagePopup", "previewImage").getSrc();
                var IMAGE_NAME = oData.EMPLOYEE_ID + "_" + sFormattedDate;

                if (!oImage) {
                    MessageToast.show("Image is required!");
                    return;
                }
                // Extract MIME Type & Base64 Data
                var base64Data = oImage.split(",")[1];  // Remove Base64 prefix
                var mimeType = oImage.split(",")[0].split(":")[1].split(";")[0]; // Extract MIME Type

                // Prepare Payload with Base64 Image String
                var payload = {
                    ASSET_IMAGE: base64Data,
                    IMAGE_NAME: IMAGE_NAME,
                    ASSIGNED_ID: oData.ASSIGNED_ID.toUpperCase(),
                    ASSET_IMAGE_ID: "00000000-0000-0000-0000-000000000000",
                    ASSEST_ID: oData.ASSEST_ID.toUpperCase(),
                    MIME_TYPE: mimeType
                };
                var sPath = "/AddImageSet"
                var oModel = this.getView().getModel();
                oModel.create(sPath, payload, {
                    success: function () {
                        MessageToast.show("Image upload successful");
                        // Refresh the model
                        that.getView().getModel().refresh();
                        // Get references to UI elements
                        var oImage = Fragment.byId("ImagePopup", "previewImage");
                        var btnUploadPress = Fragment.byId("ImagePopup", "btnUpload");

                        var oFileUploader = Fragment.byId("ImagePopup", "fileUploader");

                        // Clear the image preview
                        oImage.setSrc("");
                        oImage.setVisible(false);

                        // Hide the upload button
                        btnUploadPress.setVisible(false);

                        // Reset the FileUploader (clear selected file)
                        if (oFileUploader) {
                            oFileUploader.clear(); // Clear selected file
                        }


                    },
                    error: function (oError) {
                        console.log(oError);
                        MessageToast.show("Image upload failed!");
                    }

                })
                this.oImagefragment.close();
            },
            // View Image in the popup
            onViewImageBtn: function (Asset_Image_Id) {
                var oImage_preview = Fragment.byId("ImagePopup", "previewImage");
                var odeleteBtn = Fragment.byId("ImagePopup", "btnDelete");
                odeleteBtn.setEnabled(false);
                var sServiceUrl = "/sap/opu/odata/sap/ZAM24_ODATA_SERVICE_SRV/ImageSet(guid'" + Asset_Image_Id + "')/$value";
              
                // Make an AJAX call to fetch the image
                $.ajax({
                    url: sServiceUrl,
                    type: "GET",
                    xhrFields: {
                        responseType: "blob"
                    },
                    success: function (data) {
                        var blob = new Blob([data], { type: "image/png" });
                        var imageUrl = URL.createObjectURL(blob);
                        oImage_preview.setSrc(imageUrl);
                        oImage_preview.setVisible(true);
                        odeleteBtn.setEnabled(true);
                    },
                    error: function () {
                        MessageToast.show("Failed to fetch the image.");
                    }
                });
            },
            gotoAvailAssetPage: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("AvailAssignRoute");
            },
            oSetDataOpenPop: function (that) {
         
                var sGuid = that.sPath.split("guid'")[1].split("'")[0];
                // Create a filter for the GUID
                var oModel = that.getView().getModel();
                var oselData = oModel.getProperty(that.sPath);

                var oFilter1 = new sap.ui.model.Filter({
                    path: "ASSIGNED_ID",  // Field name in the OData entity set
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sGuid, // Ensure the GUID is correctly formatted
                });

                var oFilter2 = new sap.ui.model.Filter({
                    path: "ASSEST_ID",  // Field name in the OData entity set
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: oselData.ASSEST_ID, // Ensure the GUID is correctly formatted
                });

                var oImage_preview = Fragment.byId("ImagePopup", "previewImage");
                oImage_preview.setSrc("https://pixsector.com/cache/517d8be6/av5c8336583e291842624.png");
                // Read ImageSet with the GUID filter
                that.oModel.read('/ImageSet', {
                    filters: [oFilter1, oFilter2],  // Applying the filter
                    success: function (oData) {
                        // list 
                        var oListImage = Fragment.byId("ImagePopup", "idImage_name");
                        var oJsonImage = that.getView().getModel('localImageModel');
                        oJsonImage.setData(oData);

                        oListImage.setModel(oJsonImage);

                        that.oImagefragment.open();
                    },
                    error: function () {
                    }
                });
            },
            selectedImageID :null,
            handlePress: function (oEvent) {
                var oImage_preview = Fragment.byId("ImagePopup", "previewImage");
                var odeleteBtn = Fragment.byId("ImagePopup", "btnDelete");

                var btnUploadPress = Fragment.byId("ImagePopup", "btnUpload");
                btnUploadPress.setVisible(false);

                var oFileUploader = Fragment.byId("ImagePopup", "fileUploader");
                if (oFileUploader) {
                    oFileUploader.clear(); 
                }
                odeleteBtn.setVisible(true)
                oImage_preview.setSrc("");
                oImage_preview.setVisible(false);
                var ImageName = oEvent.getSource().getProperty('title');
                var ImageData = this.getView().getModel('localImageModel').getData().results;
                var ImageData1 = ImageData.find(item => item.IMAGE_NAME === ImageName);
                this.selectedImageID = ImageData1.ASSET_IMAGE_ID
                this.onViewImageBtn(this.selectedImageID);

            },
            onDeletePress:function(){
                var sPath = "/ImageSet(guid'" + this.selectedImageID + "')";
                var oModel = this.getView().getModel();
                oModel.remove(sPath,{
                    success:function(oRes){
                        MessageToast.show("Image Deleted successfully.");

                    },
                    error: function(oError){
                        MessageToast.show("Error while deleting the Image.");
                    }
                })
                this.onCancel();
                // var odeleteBtn = Fragment.byId("ImagePopup", "btnDelete");
                // var oImage_preview = Fragment.byId("ImagePopup", "previewImage");
                // odeleteBtn.setVisible(false);
                // oImage_preview.setSrc("");

            
            }
        })
    })
