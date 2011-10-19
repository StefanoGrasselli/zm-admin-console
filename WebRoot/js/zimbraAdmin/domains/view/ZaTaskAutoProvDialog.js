/**
 * Created by IntelliJ IDEA.
 * User: qinan
 * Date: 8/24/11
 * Time: 4:29 PM
 * To change this template use File | Settings | File Templates.
 */


ZaTaskAutoProvDialog = function(parent, title, width, height) {
    if (arguments.length == 0) return;
    var applyButton = new DwtDialog_ButtonDescriptor(ZaTaskAutoProvDialog.APPLY_BUTTON, ZaMsg.LBL_ApplyButton,
            DwtDialog.ALIGN_RIGHT, new AjxCallback(this, this._applyButtonListener));
    var helpButton = new DwtDialog_ButtonDescriptor(ZaXWizardDialog.HELP_BUTTON, ZaMsg.TBB_Help,
        DwtDialog.ALIGN_LEFT, new AjxCallback(this, this._helpButtonListener));
    this._standardButtons = [DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON];
    this._extraButtons = [helpButton, applyButton];
    this._width = width ||680;
    this._height = height || 380;
    ZaXDialog.call(this, parent, null, title, this._width, this._height, null, ZaId.DLG_AUTPROV_MANUAL+"_ENHANCE");
    this._containedObject = {};
    this.initForm(ZaDomain.myXModel,this.getMyXForm());
    this._helpURL = ZaTaskAutoProvDialog.helpURL;

	this._forceApplyMessageDialog = new ZaMsgDialog(ZaApp.getInstance().getAppCtxt().getShell(), null, [DwtDialog.YES_BUTTON, DwtDialog.NO_BUTTON],null,ZaId.CTR_PREFIX + ZaId.VIEW_DMLIST + "_forceApplyConfirm");
    this._forceApplyMessageDialog.registerCallback(DwtDialog.YES_BUTTON, ZaTaskAutoProvDialog.prototype._forceApplyCallback, this);
    //this._forceApplyMessageDialog.registerCallback(DwtDialog.NO_BUTTON, ZaDomainListController.prototype._donotForceDeleteDomainsCallback, this);
    //this._forceApplyMessageDialog._button[DwtDialog.YES_BUTTON].setText("Apply");

	this._localXForm.addListener(DwtEvent.XFORMS_FORM_DIRTY_CHANGE, new AjxListener(this, ZaTaskAutoProvDialog.prototype.handleXFormChange));
	this._localXForm.addListener(DwtEvent.XFORMS_VALUE_ERROR, new AjxListener(this, ZaTaskAutoProvDialog.prototype.handleXFormChange));
}

ZaTaskAutoProvDialog.prototype = new ZaXDialog;
ZaTaskAutoProvDialog.prototype.constructor = ZaTaskAutoProvDialog;
ZaTaskAutoProvDialog.helpURL = location.pathname + ZaUtil.HELP_URL + "managing_domain/autoprov_manual_config.htm?locid="+AjxEnv.DEFAULT_LOCALE;

ZaTaskAutoProvDialog.APPLY_BUTTON = ++DwtDialog.LAST_BUTTON;

ZaTaskAutoProvDialog.prototype.setObject = function(entry) {
    entry[ZaDomain.A2_zimbraAutoProvSearchActivated] = "TRUE";
    if(entry.attrs[ZaDomain.A_zimbraAutoProvAttrMap] && (typeof entry.attrs[ZaDomain.A_zimbraAutoProvAttrMap] == "string"))
         entry.attrs[ZaDomain.A_zimbraAutoProvAttrMap] = [entry.attrs[ZaDomain.A_zimbraAutoProvAttrMap]];

    this._separateConfigureValues(entry);
    ZaXDialog.prototype.setObject.call(this,entry);

    // auto provisioning object backup
    this._backupLdapObj(entry);
    this._button[DwtDialog.OK_BUTTON].setEnabled(false);
    this._button[ZaTaskAutoProvDialog.APPLY_BUTTON].setEnabled(false);
}

ZaTaskAutoProvDialog.prototype.handleXFormChange =
function() {
    if(this._localXForm.hasErrors()) {
        this._button[DwtDialog.OK_BUTTON].setEnabled(false);
        this._button[ZaTaskAutoProvDialog.APPLY_BUTTON].setEnabled(false);
    } else {
        this._button[DwtDialog.OK_BUTTON].setEnabled(true);
        this._button[ZaTaskAutoProvDialog.APPLY_BUTTON].setEnabled(true);
    }

    // check modification
    this.tabClickHandler();
}

ZaTaskAutoProvDialog.prototype.getMyXForm =
function() {
    this.tabChoices = new Array();
    this.TAB_INDEX = 0;
	var _tab1, _tab2, _tab3, _tab4;

	_tab1 = ++this.TAB_INDEX;
	this.tabChoices.push({value:_tab1, label:ZaMsg.TBB_AUTOPROV_GENERAL});

    _tab2 = ++this.TAB_INDEX;
    this.tabChoices.push({value:_tab2, label:ZaMsg.TBB_AUTOPROV_EAGER});

    _tab3 = ++this.TAB_INDEX;
    this.tabChoices.push({value:_tab3, label:ZaMsg.TBB_AUTOPROV_LAZY});

    this.TAB_STEP_MANUAL = _tab4 = ++this.TAB_INDEX;
    this.tabChoices.push({value:_tab4, label:ZaMsg.TBB_AUTOPROV_MANUAL});

	var cases = [];
    var case1={type:_ZATABCASE_, numCols:2,colSizes:["150px","490px"], caseKey:_tab1, id:"auto_provision_config_general",
        getCustomWidth:ZaTaskAutoProvDialog.getCustomWidth,
        getCustomHeight:ZaTaskAutoProvDialog.getCustomHeight,
        items: [
            {type: _SPACER_, height: 10 },
            {type:_GROUPER_, colSpan:"*", width: "100%",label:"LDAP Configuration", containerCssStyle: "padding-top:5px",
                enableDisableChecks:[],
                enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvModeEAGEREnabled, ZaDomain.A2_zimbraAutoProvModeLAZYEnabled,
                ZaDomain.A2_zimbraAutoProvModeMANUALEnabled],
            items: [
            {type:_GROUP_, numCols:6, label:"   ", labelLocation:_LEFT_,
                visibilityChecks: [],
                visibilityChangeEventSources:[],
                items: [
                    {type:_OUTPUT_, label:null, labelLocation:_NONE_, value:" ", width:"35px"},
                    {type:_OUTPUT_, label:null, labelLocation:_NONE_, value:ZaMsg.Domain_AuthLDAPServerName, width:"200px"},
                    {type:_OUTPUT_, label:null, labelLocation:_NONE_, value:" ", width:"5px"},
                    {type:_OUTPUT_, label:null, labelLocation:_NONE_, value:ZaMsg.Domain_AuthLDAPServerPort,  width:"40px"},
                    {type:_OUTPUT_, label:null, labelLocation:_NONE_, value:ZaMsg.Domain_AuthLDAPUseSSL, width:"80px"}
                ]
            },


            {ref:ZaDomain.A_zimbraAutoProvLdapURL, type:_LDAPURL_, label:ZaMsg.LBL_zimbraAutoProvLdapURL,
                ldapSSLPort:"636",ldapPort:"389",
                labelLocation:_LEFT_,
                label: ZaMsg.LBL_zimbraAutoProvLdapURL
            },
            {ref:ZaDomain.A_zimbraAutoProvLdapStartTlsEnabled, type:_CHECKBOX_,
                label:ZaMsg.LBL_zimbraAutoProvLdapStartTlsEnabled,
                trueValue:"TRUE", falseValue:"FALSE",labelLocation:_RIGHT_
            },
            {ref:ZaDomain.A_zimbraAutoProvLdapAdminBindDn, type:_INPUT_,
                label:ZaMsg.LBL_zimbraAutoProvLdapAdminBindDn, labelLocation:_LEFT_,
                enableDisableChecks:[],
                enableDisableChangeEventSources:[]
            },
            {ref:ZaDomain.A_zimbraAutoProvLdapAdminBindPassword, type:_SECRET_,
                label:ZaMsg.LBL_zimbraAutoProvLdapAdminBindPassword, labelLocation:_LEFT_
            },
            {ref:ZaDomain.A_zimbraAutoProvLdapSearchFilter, type:_TEXTAREA_, width:350, height:40,
                label:ZaMsg.LBL_zimbraAutoProvLdapSearchFilter, labelLocation:_LEFT_,
                textWrapping:"soft"
            },
            {ref:ZaDomain.A_zimbraAutoProvLdapSearchBase, type:_TEXTAREA_, width:350, height:40,
                label:ZaMsg.LBL_zimbraAutoProvLdapSearchBase, labelLocation:_LEFT_,
                textWrapping:"soft"
            },
            {ref:ZaDomain.A_zimbraAutoProvLdapBindDn, type:_INPUT_,
                label:ZaMsg.LBL_zimbraAutoProvLdapBindDn, labelLocation:_LEFT_
            }
            ]},
            {type: _SPACER_, height: 10 },
            {ref:ZaDomain.A_zimbraAutoProvNotificationFromAddress, type:_TEXTFIELD_,
                label:ZaMsg.LBL_zimbraAutoProvNotificationFromAddress, labelLocation:_LEFT_,
                width:250, onChange:ZaDomainXFormView.onFormFieldChanged
            },
            {ref:ZaDomain.A_zimbraAutoProvAccountNameMap, type:_TEXTFIELD_,
                label:ZaMsg.LBL_zimbraAutoProvAccountNameMap, labelLocation:_LEFT_,
                width:250, onChange:ZaDomainXFormView.onFormFieldChanged
            },
            {ref:ZaDomain.A_zimbraAutoProvAttrMap, type:_REPEAT_,
                label:ZaMsg.LBL_zimbraAutoProvAttrMap, repeatInstance:"", showAddButton:true,
                showRemoveButton:true,
                    addButtonLabel:ZaMsg.NAD_Add,
                    showAddOnNextRow:true,
                    removeButtonLabel:ZaMsg.NAD_Remove,
                    items: [
                        {ref:".", type:_TEXTFIELD_, label:null,
                        enableDisableChecks:[], visibilityChecks:[],
                        onChange:ZaDomainXFormView.onFormFieldChanged}
                    ]
            }

        ]
    };
    cases.push(case1);

    var case2={type:_ZATABCASE_, numCols:2,colSizes:["45px","*"], caseKey:_tab2,  //cssStyle:"width:550px;",//width: "650px",
        id:"auto_provision_config_eager", getCustomWidth:ZaTaskAutoProvDialog.getCustomWidth,
        getCustomHeight:ZaTaskAutoProvDialog.getCustomHeight,
        items: [
            {type: _SPACER_, height: 20 },
            {ref:ZaDomain.A2_zimbraAutoProvModeEAGEREnabled, type:_CHECKBOX_,
                label:ZaMsg.LBL_zimbraAutoProvModeEAGER,
                trueValue:"TRUE", falseValue:"FALSE",labelLocation:_RIGHT_
            },
            {type: _SPACER_, height: 20 },
            {type:_GROUPER_, colSpan:"*", width: "100%",label:"Configuration", containerCssStyle: "padding-top:5px", colSizes:["175px","*"], numCols:2,
                enableDisableChecks:[[XForm.checkInstanceValue,ZaDomain.A2_zimbraAutoProvModeEAGEREnabled,"TRUE"]],
                enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvModeEAGEREnabled],
                items: [
                {ref:ZaDomain.A_zimbraAutoProvBatchSize, type:_TEXTFIELD_, label:ZaMsg.LBL_zimbraAutoProvBatchSize,
                    autoSaveValue:true, labelLocation:_LEFT_,
                    enableDisableChecks: [[XForm.checkInstanceValue,ZaDomain.A2_zimbraAutoProvModeEAGEREnabled,"TRUE"]],
                    enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvModeEAGEREnabled],
                    cssClass:"admin_xform_number_input"
                },
                {ref:ZaDomain.A2_zimbraAutoProvPollingInterval, type:_LIFETIME_,
                    colSizes:["80px","100px","*"],
                    label:ZaMsg.LBL_zimbraAutoProvPollingInterval, labelLocation:_LEFT_,
                    enableDisableChecks: [[XForm.checkInstanceValue,ZaDomain.A2_zimbraAutoProvModeEAGEREnabled,"TRUE"]],
                    enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvModeEAGEREnabled]
                },
                {type: _DWT_LIST_, ref: ZaDomain.A2_zimbraAutoProvServerList,  width: 250, height: 50,
                    label:ZaMsg.LBL_zimbraAutoProvServerList,
                    labelLocation:_LEFT_,   labelCssStyle:"vertical-align:top",
                    nowrap:false,labelWrap:true,
                    forceUpdate: true, widgetClass: ZaServerOptionList,
                    multiselect: true, preserveSelection: true,
                    enableDisableChecks: [[XForm.checkInstanceValue,ZaDomain.A2_zimbraAutoProvModeEAGEREnabled,"TRUE"]],
                    enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvModeEAGEREnabled],
                    onSelection: ZaTaskAutoProvDialog.filterSelectionListener
                }
            ]},
            {type:_GROUPER_, colSpan:"*", width: "100%",label:"Note",
                containerCssStyle: "padding-top:15px", numCols:1,
                items: [
                    {type:_OUTPUT_,value:ZaMsg.MSG_AUTOPROV_DLG_EAGER}
            ]}
        ]
    };
    cases.push(case2);

    var case3={type:_ZATABCASE_, numCols:2,colSizes:["45px","*"],  caseKey:_tab3,
        id:"auto_provision_config_lazy", getCustomWidth:ZaTaskAutoProvDialog.getCustomWidth,
        getCustomHeight:ZaTaskAutoProvDialog.getCustomHeight,
        items: [
            {type: _SPACER_, height: 20 },
            {ref:ZaDomain.A2_zimbraAutoProvModeLAZYEnabled, type:_CHECKBOX_,
                label:ZaMsg.LBL_zimbraAutoProvModeLAZY,
                trueValue:"TRUE", falseValue:"FALSE",labelLocation:_RIGHT_
            },
            {type: _SPACER_, height: 20 },
            {type:_GROUPER_, colSpan:"*", width: "100%",label:"Configuration", containerCssStyle: "padding-top:5px", colSizes:["200px","*"], numCols:2,
            items: [
                {type:_GROUP_, numCols:2, label:ZaMsg.LBL_zimbraAutoProvAuthMech,
                    labelLocation:_LEFT_, colSizes:["20px","150px"],labelCssStyle:"vertical-align:top",
                    nowrap:false,labelWrap:true,
                    enableDisableChecks:[[XForm.checkInstanceValue,ZaDomain.A2_zimbraAutoProvModeLAZYEnabled,"TRUE"]],
                    enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvModeLAZYEnabled],
                    items: [
                        {ref:ZaDomain.A2_zimbraAutoProvAuthMechLDAPEnabled, type:_CHECKBOX_,
                            label:ZaMsg.LBL_zimbraAutoProvAuthMechLDAP,
                            trueValue:"TRUE", falseValue:"FALSE",labelLocation:_RIGHT_
                        },
                        {ref:ZaDomain.A2_zimbraAutoProvAuthMechPREAUTHEnabled, type:_CHECKBOX_,
                            label:ZaMsg.LBL_zimbraAutoProvAuthMechPREAUTH,
                            trueValue:"TRUE", falseValue:"FALSE",labelLocation:_RIGHT_
                        },
                        {ref:ZaDomain.A2_zimbraAutoProvAuthMechKRB5Enabled, type:_CHECKBOX_,
                            label:ZaMsg.LBL_zimbraAutoProvAuthMechKRB5,
                            trueValue:"TRUE", falseValue:"FALSE",labelLocation:_RIGHT_
                        },
                        {ref:ZaDomain.A2_zimbraAutoProvAuthMechSPNEGOEnabled, type:_CHECKBOX_,
                            label:ZaMsg.LBL_zimbraAutoProvAuthMechSPNEGO,
                            trueValue:"TRUE", falseValue:"FALSE",labelLocation:_RIGHT_
                        }
                    ]
                }
            ]},
            {type:_GROUPER_, colSpan:"*", width: "100%",label:"Note",
                containerCssStyle: "padding-top:15px", numCols:1,
                items: [
                    {type:_OUTPUT_,value:ZaMsg.MSG_AUTOPROV_DLG_LAZY}
            ]}
        ]
    };
    cases.push(case3);

    var case4={type:_ZATABCASE_, numCols:2,colSizes:["45px","*"],  caseKey:_tab4,
        id:"auto_provision_config_lazy", getCustomWidth:ZaTaskAutoProvDialog.getCustomWidth,
        getCustomHeight:ZaTaskAutoProvDialog.getCustomHeight,
        items: [
            {type: _SPACER_, height: 20 },
            {ref:ZaDomain.A2_zimbraAutoProvModeMANUALEnabled, type:_CHECKBOX_,
                label:ZaMsg.LBL_zimbraAutoProvModeMANUAL,
                trueValue:"TRUE", falseValue:"FALSE",labelLocation:_RIGHT_,
                onChange: ZaTaskAutoProvDialog.onFormFieldChanged
            },
            {type: _SPACER_, height: 20 },
            {type:_GROUPER_, colSpan:"*", width: "100%",label:"Find & Provisioning",
            enableDisableChecks:[[XForm.checkInstanceValue,ZaDomain.A2_zimbraAutoProvModeMANUALEnabled,"TRUE"]],
            enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvModeMANUALEnabled],
            containerCssStyle: "padding-top:5px",
            items: [
                    {type:_GROUP_, colSpan:2, numCols:3, width:"100%", colSizes:["180px","85px","180px"], cellspacing:"5px",
                        items:[
                            {type:_TEXTFIELD_, cssClass:"admin_xform_name_input",width:"185px", ref:ZaSearch.A_query, label:null,
                                elementChanged: function(elementValue,instanceValue, event) {
                                  var charCode = event.charCode;
                                  if (charCode == 13 || charCode == 3) {
                                      ZaTaskAutoProvDialog.srchButtonHndlr.call(this);
                                  } else {
                                      this.getForm().itemChanged(this, elementValue, event);
                                  }
                                },
                                visibilityChecks:[],enableDisableChecks:[]
                            },
                            {type:_DWT_BUTTON_, label:ZaMsg.DLXV_ButtonSearch, width:"80px",
                                onActivate:ZaTaskAutoProvDialog.srchButtonHndlr,align:_CENTER_,
                                enableDisableChecks:[[XForm.checkInstanceValue,ZaDomain.A2_zimbraAutoProvSearchActivated,"TRUE"]],
                                enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvSearchActivated]
                            },
                            {type:_OUTPUT_, value:ZaMsg.LBL_ManualProvAccount,visibilityChecks:[]},
                            {ref:ZaDomain.A2_zimbraAutoProvAccountPool, type:_DWT_LIST_, height:"180px", width:"180px",
                                cssClass: "DLSource",
                                widgetClass:ZaAccMiniListView,
                                rowSpan:4,
                                onSelection:ZaTaskAutoProvDialog.accPoolSelectionListener,
                                visibilityChecks:[],enableDisableChecks:[]
                            },
                            {type:_DWT_BUTTON_, label:AjxMsg.addAll, width:"80px",
                                onActivate:ZaTaskAutoProvDialog.addAllButtonHndlr,
                                enableDisableChecks:[[XForm.checkInstanceValueNotEmty,ZaDomain.A2_zimbraAutoProvAccountPool]],
                                enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvAccountPool]
                            },
                            {ref: ZaDomain.A2_zimbraAutoProvAccountTargetPool, type:_DWT_LIST_, height:"180px", width:"180px",
                                cssClass: "DLSource",
                                widgetClass:ZaAccMiniListView,
                                rowSpan:4,
                                onSelection:ZaTaskAutoProvDialog.accTargetSelectionListener,
                                visibilityChecks:[],enableDisableChecks:[]
                            },
                            {type:_DWT_BUTTON_, label:AjxMsg.add, width:"80px",
                               onActivate:ZaTaskAutoProvDialog.addButtonHndlr,
                               enableDisableChecks:[[XForm.checkInstanceValueNotEmty,ZaDomain.A2_zimbraAutoProvAccountSrcSelectedPool]],
                               enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvAccountSrcSelectedPool]
                            },
                            {type:_DWT_BUTTON_, label:AjxMsg.remove, width:"80px",
                               onActivate:ZaTaskAutoProvDialog.removeButtonHndlr,
                               enableDisableChecks:[[XForm.checkInstanceValueNotEmty,ZaDomain.A2_zimbraAutoProvAccountTgtSelectedPool]],
                               enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvAccountTgtSelectedPool]
                            },
                            {type:_DWT_BUTTON_, label:AjxMsg.removeAll, width:"80px",
                                onActivate:ZaTaskAutoProvDialog.removeAllButtonHndlr,
                                enableDisableChecks:[[XForm.checkInstanceValueNotEmty,ZaDomain.A2_zimbraAutoProvAccountTargetPool]],
                                enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvAccountTargetPool]
                            },
                            {type:_GROUP_,numCols:3,colSizes:["90px","*","90px"],
                                items:[
                                    {type:_SPACER_, colSpan:3},
                                    {type:_DWT_BUTTON_, label:ZaMsg.Previous, width:75,
                                       id:"backButton", icon:"LeftArrow", disIcon:"LeftArrowDis",
                                       onActivate:ZaTaskAutoProvDialog.backPoolButtonHndlr,align:_CENTER_,
                                       enableDisableChecks:[ZaTaskAutoProvDialog.backBtnEnabled],
                                       enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvAccountPoolPageNum,ZaDomain.A2_zimbraAutoProvSearchActivated]
                                    },
                                    {type:_CELLSPACER_},
                                    {type:_DWT_BUTTON_, label:ZaMsg.Next, width:75,
                                       id:"fwdButton", icon:"RightArrow", disIcon:"RightArrowDis",
                                       onActivate:ZaTaskAutoProvDialog.fwdPoolButtonHndlr,align:_CENTER_,
                                       enableDisableChecks:[ZaTaskAutoProvDialog .forwardBtnEnabled],
                                       enableDisableChangeEventSources:[ZaDomain.A2_zimbraAutoProvAccountPoolPageNum,ZaDomain.A2_zimbraAutoProvSearchActivated]
                                    }
                                ]
                            },
                            {type:_CELLSPACER_}
                        ]
                    }
            ]}
        ]
    };
    cases.push(case4);

	var xFormObject = {
		numCols:1,
		items:[
            {type:_TAB_BAR_,  ref:ZaModel.currentTab,choices:this.tabChoices,cssClass:"ZaTabBar", id:"xform_tabbar"},
            {type:_SWITCH_, align:_LEFT_, valign:_TOP_, items:cases}
        ]
    };
    return xFormObject;
}

ZaTaskAutoProvDialog.onFormFieldChanged =
function (value, event, form) {
    var instance = this.getInstance();
    instance[ZaDomain.A2_zimbraAutoProvSearchActivated] = "TRUE";
    this.setInstanceValue(value);
    return value;
}

ZaTaskAutoProvDialog.prototype._forceApplyCallback =
function() {
    this._applyButtonListener();
}

ZaTaskAutoProvDialog.getCustomWidth = function() {
	return "100%";
}

ZaTaskAutoProvDialog.getCustomHeight = function() {
	return "100%";
}

ZaTaskAutoProvDialog.prototype._applyButtonListener =
function() {
    if(this._forceApplyMessageDialog)
        this._forceApplyMessageDialog.popdown();
    try {
        var controller = ZaApp.getInstance().getCurrentController();
        if(this._checkGeneralConfig() && this._checkEagerConfig() && this._checkLazyConfig()) {
            var savedObj = this.getObject();
            this._combineConfigureValues(savedObj);
            ZaDomain.modifyAutoPovSettings.call(this._containedObject,savedObj);
            controller._fireDomainChangeEvent(this._containedObject);
            controller._notifyAllOpenTabs();
            if(savedObj.currentTab == 4)
                this.finishConfig();
            this._button[DwtDialog.OK_BUTTON].setEnabled(false);
            this._button[ZaTaskAutoProvDialog.APPLY_BUTTON].setEnabled(false);
            this._backupLdapObj(savedObj);
        }
    } catch (ex) {
		ZaApp.getInstance().getCurrentController()._handleException(ex, "ZaTaskAutoProvDialog.prototype._applyButtonListener", null, false);
	}
}

ZaTaskAutoProvDialog.prototype._checkGeneralConfig =
function() {
    var isError = false;
    var errorMsg = "";
    if(!this._containedObject.attrs[ZaDomain.A_zimbraAutoProvLdapURL]
            || this._containedObject.attrs[ZaDomain.A_zimbraAutoProvLdapURL] == "") {
        isError = true;
        errorMsg = AjxMessageFormat.format(ZaMsg.ERROR_AUTOPROV,ZaMsg.MSG_zimbraAutoProvLdapURL);
    } else if(!this._containedObject.attrs[ZaDomain.A_zimbraAutoProvLdapAdminBindDn]
            || this._containedObject.attrs[ZaDomain.A_zimbraAutoProvLdapAdminBindDn] == "") {
        isError = true;
        errorMsg = AjxMessageFormat.format(ZaMsg.ERROR_AUTOPROV,ZaMsg.MSG_zimbraAutoProvLdapAdminBindDn);
    } else if(!this._containedObject.attrs[ZaDomain.A_zimbraAutoProvLdapAdminBindPassword]
            || this._containedObject.attrs[ZaDomain.A_zimbraAutoProvLdapAdminBindPassword] == "") {
        isError = true;
        errorMsg = AjxMessageFormat.format(ZaMsg.ERROR_AUTOPROV,ZaMsg.MSG_zimbraAutoProvLdapAdminBindPassword);
    } else if(!this._containedObject.attrs[ZaDomain.A_zimbraAutoProvLdapSearchBase]
            || this._containedObject.attrs[ZaDomain.A_zimbraAutoProvLdapSearchBase] == "") {
        isError = true;
        errorMsg = AjxMessageFormat.format(ZaMsg.ERROR_AUTOPROV,ZaMsg.MSG_zimbraAutoProvLdapSearchBase);
    }
    if(!isError && this._containedObject[ZaDomain.A2_zimbraAutoProvModeEAGEREnabled] == "TRUE") {
        if(!this._containedObject.attrs[ZaDomain.A_zimbraAutoProvLdapSearchFilter]
                || this._containedObject.attrs[ZaDomain.A_zimbraAutoProvLdapSearchFilter] == "") {
            isError = true;
            errorMsg = AjxMessageFormat.format(ZaMsg.ERROR_AUTOPROV,ZaMsg.MSG_zimbraAutoProvLdapSearchFilter);
        } else if(!this._containedObject.attrs[ZaDomain.A_zimbraAutoProvLdapBindDn]
                || this._containedObject.attrs[ZaDomain.A_zimbraAutoProvLdapBindDn] == "") {
            isError = true;
            errorMsg = AjxMessageFormat.format(ZaMsg.ERROR_AUTOPROV,ZaMsg.MSG_zimbraAutoProvLdapBindDn);
        }
    }
    if(isError) {
        ZaApp.getInstance().getCurrentController().popupErrorDialog(errorMsg);
        return false;
    } else return true;
}

ZaTaskAutoProvDialog.prototype._checkEagerConfig =
function() {
    var isError = false;
    var errorMsg = "";
    if(!isError && this._containedObject[ZaDomain.A2_zimbraAutoProvModeEAGEREnabled] == "TRUE") {
        if(!this._containedObject.attrs[ZaDomain.A_zimbraAutoProvBatchSize]
                || this._containedObject.attrs[ZaDomain.A_zimbraAutoProvBatchSize] == "") {
            isError = true;
            errorMsg = AjxMessageFormat.format(ZaMsg.ERROR_AUTOPROV,ZaMsg.MSG_zimbraAutoProvBatchSize);
        }
    }
    if(isError) {
        ZaApp.getInstance().getCurrentController().popupErrorDialog(errorMsg);
        return false;
    } else return true;
}

ZaTaskAutoProvDialog.prototype._checkLazyConfig =
function() {
        if(this._containedObject[ZaDomain.A2_zimbraAutoProvModeLAZYEnabled] == "TRUE"
                && (!this._containedObject[ZaDomain.A2_zimbraAutoProvAuthMechLDAPEnabled]
                    || this._containedObject[ZaDomain.A2_zimbraAutoProvAuthMechLDAPEnabled] == "FALSE")
                && (!this._containedObject[ZaDomain.A2_zimbraAutoProvAuthMechPREAUTHEnabled]
                    || this._containedObject[ZaDomain.A2_zimbraAutoProvAuthMechPREAUTHEnabled] == "FALSE")
                && (!this._containedObject[ZaDomain.A2_zimbraAutoProvAuthMechKRB5Enabled]
                    || this._containedObject[ZaDomain.A2_zimbraAutoProvAuthMechKRB5Enabled] == "FALSE")
                && (!this._containedObject[ZaDomain.A2_zimbraAutoProvAuthMechSPNEGOEnabled]
                    || this._containedObject[ZaDomain.A2_zimbraAutoProvAuthMechSPNEGOEnabled] == "FALSE")) {
            ZaApp.getInstance().getCurrentController().popupErrorDialog(ZaMsg.ERROR_AUTOPROV_LAZYAUTH);
            return false;
        } else return true;
}

ZaTaskAutoProvDialog.prototype._checkManualConfig =
function() {

}

ZaTaskAutoProvDialog.prototype._separateConfigureValues =
function(entry) {
    if(entry.attrs[ZaDomain.A_zimbraAutoProvMode]) {
        if(entry.attrs[ZaDomain.A_zimbraAutoProvMode] instanceof Array) {
            for(var mode = 0; mode < entry.attrs[ZaDomain.A_zimbraAutoProvMode].length; mode ++){
                if(entry.attrs[ZaDomain.A_zimbraAutoProvMode][mode] == "EAGER")
                   entry[ZaDomain.A2_zimbraAutoProvModeEAGEREnabled] = "TRUE";
                else if(entry.attrs[ZaDomain.A_zimbraAutoProvMode][mode] == "LAZY")
                   entry[ZaDomain.A2_zimbraAutoProvModeLAZYEnabled] = "TRUE";
                else if(entry.attrs[ZaDomain.A_zimbraAutoProvMode][mode] == "MANUAL")
                   entry[ZaDomain.A2_zimbraAutoProvModeMANUALEnabled] = "TRUE";
            }
        } else {
            if(entry.attrs[ZaDomain.A_zimbraAutoProvMode] == "EAGER")
               entry[ZaDomain.A2_zimbraAutoProvModeEAGEREnabled] = "TRUE";
            else if(entry.attrs[ZaDomain.A_zimbraAutoProvMode] == "LAZY")
               entry[ZaDomain.A2_zimbraAutoProvModeLAZYEnabled] = "TRUE";
            else if(entry.attrs[ZaDomain.A_zimbraAutoProvMode] == "MANUAL")
               entry[ZaDomain.A2_zimbraAutoProvModeMANUALEnabled] = "TRUE";
        }
    }

    if(entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech]) {
        if(entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech] instanceof Array) {
            for(var mode = 0; mode < entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech].length; mode ++){
                if(entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech][mode] == "LDAP")
                   entry[ZaDomain.A2_zimbraAutoProvAuthMechLDAPEnabled] = "TRUE";
                else if(entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech][mode] == "PREAUTH")
                   entry[ZaDomain.A2_zimbraAutoProvAuthMechPREAUTHEnabled] = "TRUE";
                else if(entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech][mode] == "KRB5")
                   entry[ZaDomain.A2_zimbraAutoProvAuthMechKRB5Enabled] = "TRUE";
                else if(entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech][mode] == "SPNEGO")
                   entry[ZaDomain.A2_zimbraAutoProvAuthMechSPNEGOEnabled] = "TRUE";
            }
        } else {
                if(entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech] == "LDAP")
                   entry[ZaDomain.A2_zimbraAutoProvAuthMechLDAPEnabled] = "TRUE";
                else if(entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech] == "PREAUTH")
                   entry[ZaDomain.A2_zimbraAutoProvAuthMechPREAUTHEnabled] = "TRUE";
                else if(entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech] == "KRB5")
                   entry[ZaDomain.A2_zimbraAutoProvAuthMechKRB5Enabled] = "TRUE";
                else if(entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech] == "SPNEGO")
                   entry[ZaDomain.A2_zimbraAutoProvAuthMechSPNEGOEnabled] = "TRUE";
        }
    }
    entry[ZaDomain.A2_zimbraAutoProvServerList] = ZaApp.getInstance().getServerList(true).getArray();
    entry[ZaDomain.A2_zimbraAutoProvSelectedServerList] = new AjxVector ();
    for(var i = 0; i < entry[ZaDomain.A2_zimbraAutoProvServerList].length; i++) {
        var server = entry[ZaDomain.A2_zimbraAutoProvServerList][i];
        var scheduledDomains = server.attrs[ZaServer.A_zimbraAutoProvScheduledDomains];
        for(var j = 0; scheduledDomains && j < scheduledDomains.length; j++) {
            if(scheduledDomains[j] == entry.name) {
               entry[ZaDomain.A2_zimbraAutoProvSelectedServerList].add(server.name);
                server["checked"] = true;
            }
        }
    }

}

ZaTaskAutoProvDialog.prototype._combineConfigureValues =
function(entry) {
    entry.attrs[ZaDomain.A_zimbraAutoProvMode] = [];
    if(entry[ZaDomain.A2_zimbraAutoProvModeEAGEREnabled] == "TRUE")
        entry.attrs[ZaDomain.A_zimbraAutoProvMode].push("EAGER");
    if(entry[ZaDomain.A2_zimbraAutoProvModeLAZYEnabled] == "TRUE")
        entry.attrs[ZaDomain.A_zimbraAutoProvMode].push("LAZY");
    if(entry[ZaDomain.A2_zimbraAutoProvModeMANUALEnabled] == "TRUE")
        entry.attrs[ZaDomain.A_zimbraAutoProvMode].push("MANUAL");

    entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech] = [];
    if(entry[ZaDomain.A2_zimbraAutoProvAuthMechLDAPEnabled] == "TRUE")
        entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech].push("LDAP");
    if(entry[ZaDomain.A2_zimbraAutoProvAuthMechPREAUTHEnabled] == "TRUE")
        entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech].push("PREAUTH");
    if(entry[ZaDomain.A2_zimbraAutoProvAuthMechKRB5Enabled] == "TRUE")
        entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech].push("KRB5");
    if(entry[ZaDomain.A2_zimbraAutoProvAuthMechSPNEGOEnabled] == "TRUE")
        entry.attrs[ZaDomain.A_zimbraAutoProvAuthMech].push("SPNEGO");
}

ZaTaskAutoProvDialog.prototype._backupLdapObj = function(entry) {
    if(!this._autoprovLdapObject)
        this._autoprovLdapObject = {};
    if(!entry || !entry.attrs) return;
    if(entry.attrs[ZaDomain.A_zimbraAutoProvLdapURL])
        this._autoprovLdapObject[ZaDomain.A_zimbraAutoProvLdapURL] = entry.attrs[ZaDomain.A_zimbraAutoProvLdapURL];
    if(entry.attrs[ZaDomain.A_zimbraAutoProvLdapStartTlsEnabled])
        this._autoprovLdapObject[ZaDomain.A_zimbraAutoProvLdapStartTlsEnabled] = entry.attrs[ZaDomain.A_zimbraAutoProvLdapStartTlsEnabled];
    if(entry.attrs[ZaDomain.A_zimbraAutoProvLdapAdminBindDn])
        this._autoprovLdapObject[ZaDomain.A_zimbraAutoProvLdapAdminBindDn] = entry.attrs[ZaDomain.A_zimbraAutoProvLdapAdminBindDn];
    if(entry.attrs[ZaDomain.A_zimbraAutoProvLdapAdminBindPassword])
        this._autoprovLdapObject[ZaDomain.A_zimbraAutoProvLdapAdminBindPassword] = entry.attrs[ZaDomain.A_zimbraAutoProvLdapAdminBindPassword];
    if(entry.attrs[ZaDomain.A_zimbraAutoProvLdapSearchBase])
        this._autoprovLdapObject[ZaDomain.A_zimbraAutoProvLdapSearchBase] = entry.attrs[ZaDomain.A_zimbraAutoProvLdapSearchBase];
    if(entry.attrs[ZaDomain.A_zimbraAutoProvLdapSearchFilter])
        this._autoprovLdapObject[ZaDomain.A_zimbraAutoProvLdapSearchFilter] = entry.attrs[ZaDomain.A_zimbraAutoProvLdapSearchFilter];
    if(entry.attrs[ZaDomain.A_zimbraAutoProvLdapBindDn])
        this._autoprovLdapObject[ZaDomain.A_zimbraAutoProvLdapBindDn] = entry.attrs[ZaDomain.A_zimbraAutoProvLdapBindDn];
}

ZaTaskAutoProvDialog.prototype._checkModified = function() {
    var newObj = this.getObject();
    var oldObj = this._autoprovLdapObject;

    if((oldObj[ZaDomain.A_zimbraAutoProvLdapURL] == newObj.attrs[ZaDomain.A_zimbraAutoProvLdapURL])
    && (oldObj[ZaDomain.A_zimbraAutoProvLdapStartTlsEnabled] == newObj.attrs[ZaDomain.A_zimbraAutoProvLdapStartTlsEnabled])
    && (oldObj[ZaDomain.A_zimbraAutoProvLdapAdminBindDn] == newObj.attrs[ZaDomain.A_zimbraAutoProvLdapAdminBindDn])
    && (oldObj[ZaDomain.A_zimbraAutoProvLdapAdminBindPassword] == newObj.attrs[ZaDomain.A_zimbraAutoProvLdapAdminBindPassword])
    && (oldObj[ZaDomain.A_zimbraAutoProvLdapSearchBase] == newObj.attrs[ZaDomain.A_zimbraAutoProvLdapSearchBase])
    && (oldObj[ZaDomain.A_zimbraAutoProvLdapSearchFilter] == newObj.attrs[ZaDomain.A_zimbraAutoProvLdapSearchFilter])
    && (oldObj[ZaDomain.A_zimbraAutoProvLdapBindDn] == newObj.attrs[ZaDomain.A_zimbraAutoProvLdapBindDn]))
        return false;
    else
        return true;
}

ZaTaskAutoProvDialog.prototype.tabClickHandler = function() {
    if(this.getObject().currentTab != this.TAB_STEP_MANUAL)
        return;
    if(this._checkModified()) {
        var dlgMsg = ZaMsg.MSG_LDAP_CHANGED;
        this._forceApplyMessageDialog.setMessage(dlgMsg, DwtMessageDialog.INFO_STYLE);
        this._forceApplyMessageDialog.popup();
    }
}
///////////////////
ZaTaskAutoProvDialog.srchButtonHndlr = function() {
	var instance = this.getForm().getInstance();
	var formParent = this.getForm().parent;
    var soapDoc = AjxSoapDoc.create("SearchAutoProvDirectoryRequest", ZaZimbraAdmin.URN, null);
    soapDoc.getMethod().setAttribute("keyAttr","name");
	var attr = soapDoc.set("domain", instance.id);
	attr.setAttribute("by", "id");

    var query = "(|(mail=*)(zimbraMailAlias=*)(uid=*))";
	if(instance[ZaSearch.A_query]) {
		query = ZaSearch.getSearchByNameQuery (instance[ZaSearch.A_query]);
	}
    soapDoc.set("query", query);
    var limit = ZaSettings.RESULTSPERPAGE;
	if(!instance[ZaDomain.A2_zimbraAutoProvAccountPoolPageNum]) {
		instance[ZaDomain.A2_zimbraAutoProvAccountPoolPageNum] = 0;
	}
	var offset = instance[ZaDomain.A2_zimbraAutoProvAccountPoolPageNum]*ZaSettings.RESULTSPERPAGE;
	var attrs = [ZaAccount.A_name, ZaAccount.A_mail, ZaItem.A_zimbraId,ZaAccount.A_displayname].join(",");
    soapDoc.getMethod().setAttribute("keyAttr","name");
	soapDoc.getMethod().setAttribute("offset", offset);
	soapDoc.getMethod().setAttribute("limit", limit);
    soapDoc.getMethod().setAttribute("attrs", attrs);

	this.getModel().setInstanceValue(this.getInstance(),ZaDomain.A2_zimbraAutoProvSearchActivated,"FALSE");

    var params = {};
    params.soapDoc = soapDoc;
    params.asyncMode = false;
    var reqMgrParams = {
        controller : ZaApp.getInstance().getCurrentController(),
        busyMsg : ZaMsg.BUSY_AUTOPROV_GETACCT
    }

    try {
        var resp = ZaRequestMgr.invoke(params, reqMgrParams);
        this.getModel().setInstanceValue(this.getInstance(),ZaDomain.A2_zimbraAutoProvSearchActivated,"TRUE");
        if(!resp || resp.Body.SearchAutoProvDirectoryResponse.Fault)
            return;
        if(!resp.Body.SearchAutoProvDirectoryResponse || !resp.Body.SearchAutoProvDirectoryResponse.entry)
            return;
        var provAcctList = [];
        var objs = resp.Body.SearchAutoProvDirectoryResponse.entry;
        var searchTotal = resp.Body.SearchAutoProvDirectoryResponse.searchTotal;
        for(var i = 0; objs && i < objs.length; i++) {
            var obj = objs[i];
            var acct = new Object();
            acct.dn = obj.dn;
            var len = obj.a.length;
            acct.attrs = new Array();
            for(var ix = 0; ix < len; ix ++) {
                if(!acct.attrs[[obj.a[ix].n]]) {
                    acct.attrs[[obj.a[ix].n]] = obj.a[ix]._content;
                } else {
                    if(!(acct.attrs[[obj.a[ix].n]] instanceof Array)) {
                        acct.attrs[[obj.a[ix].n]] = [acct.attrs[[obj.a[ix].n]]];
                    }
                    acct.attrs[[obj.a[ix].n]].push(obj.a[ix]._content);
                }
            }
            acct.name = acct.attrs[ZaAccount.A_mail];
            provAcctList.push(acct);
        }
        this.getModel().setInstanceValue(this.getInstance(),ZaDomain.A2_zimbraAutoProvAccountPool,provAcctList);
        var poolTotalPages = Math.ceil(searchTotal/ZaSettings.RESULTSPERPAGE);
        this.getModel().setInstanceValue(this.getInstance(),ZaDomain.A2_zimbraAutoProvAccountPoolPageTotal,poolTotalPages);
    } catch(ex) {
        ZaApp.getInstance().getCurrentController()._handleException(ex, "ZaTaskAutoProvDialog.srchButtonHndlr", null, false);
    }
}

ZaTaskAutoProvDialog.accPoolSelectionListener = function() {
	var arr = this.widget.getSelection();
	if(arr && arr.length) {
		arr.sort();
		this.getModel().setInstanceValue(this.getInstance(), ZaDomain.A2_zimbraAutoProvAccountSrcSelectedPool, arr);
	} else {
		this.getModel().setInstanceValue(this.getInstance(), ZaDomain.A2_zimbraAutoProvAccountSrcSelectedPool, null);
	}
}

ZaTaskAutoProvDialog.addButtonHndlr = function (ev) {
	var form = this.getForm();
	var instance = form.getInstance();
	var sourceListItems = form.getItemsById(ZaDomain.A2_zimbraAutoProvAccountPool);
	if(sourceListItems && (sourceListItems instanceof Array) && sourceListItems[0] && sourceListItems[0].widget) {
		var selection = sourceListItems[0].widget.getSelection();
		var currentTargetList = instance[ZaDomain.A2_zimbraAutoProvAccountTargetPool] ? instance[ZaDomain.A2_zimbraAutoProvAccountTargetPool] : [];
		var list = (selection instanceof AjxVector) ? selection.getArray() : (selection instanceof Array) ? selection : [selection];
		if(list) {
			list.sort(ZaItem.compareNamesDesc);
			var tmpTargetList = [];
			var cnt2 = currentTargetList.length;
			for(var i=0;i<cnt2;i++)
				tmpTargetList.push(currentTargetList[i]);

			tmpTargetList.sort(ZaItem.compareNamesDesc);

			var tmpList = [];
			var cnt = list.length;
			for(var i=cnt-1; i>=0; i--) {
				var dup = false;
				cnt2 = tmpTargetList.length;
				for(var j = cnt2-1; j >=0; j--) {
					if(list[i].name==tmpTargetList[j].name) {
						dup=true;
						tmpTargetList.splice(j,cnt2-j);
						break;
					}
				}
				if(!dup) {
					currentTargetList.push(list[i])
				}
			}
			this.getModel().setInstanceValue(this.getInstance(), ZaDomain.A2_zimbraAutoProvAccountTargetPool, currentTargetList);
		}
	}
	if(currentTargetList.length > 0) {
		form.parent._button[DwtDialog.OK_BUTTON].setEnabled(true);
	} else {
		form.parent._button[DwtDialog.OK_BUTTON].setEnabled(false);
	}
}

ZaTaskAutoProvDialog.accTargetSelectionListener = function() {
	var arr = this.widget.getSelection();
	if(arr && arr.length) {
		arr.sort();
		this.getModel().setInstanceValue(this.getInstance(), ZaDomain.A2_zimbraAutoProvAccountTgtSelectedPool, arr);
	} else {
		this.getModel().setInstanceValue(this.getInstance(), ZaDomain.A2_zimbraAutoProvAccountTgtSelectedPool, null);
	}
}

ZaTaskAutoProvDialog.addAllButtonHndlr = function (ev) {
	var form = this.getForm();
	var instance = form.getInstance();
	var oldArr = instance[ZaDomain.A2_zimbraAutoProvAccountTargetPool] ? instance[ZaDomain.A2_zimbraAutoProvAccountTargetPool]  : [];
	var arr = instance[ZaDomain.A2_zimbraAutoProvAccountPool];
	var arr2 = new Array();
	if(arr) {
		var cnt = arr.length;
		var oldCnt = oldArr.length;
		for(var ix=0; ix< cnt; ix++) {
			var found = false;
			for(var j = oldCnt-1;j>=0;j-- ) {
				if(oldArr[j].name == arr[ix].name) {
					found = true;
					break;
				}
			}
			if(!found)
				arr2.push(arr[ix]);
		}
	}
	arr2 = arr2.concat(oldArr);
	this.getModel().setInstanceValue(this.getInstance(), ZaDomain.A2_zimbraAutoProvAccountTargetPool, arr2);
	//this.getModel().setInstanceValue(this.getInstance(), ZaDomain.A2_zimbraAutoProvAccountPool, new Array());
	var instance = form.getInstance();
	var currentTargetList = instance[ZaDomain.A2_zimbraAutoProvAccountTargetPool] ? instance[ZaDomain.A2_zimbraAutoProvAccountTargetPool] : [];
	if(currentTargetList.length > 0) {
		form.parent._button[DwtDialog.OK_BUTTON].setEnabled(true);
	} else {
		form.parent._button[DwtDialog.OK_BUTTON].setEnabled(false);
	}
}

ZaTaskAutoProvDialog.removeButtonHndlr = function (ev) {
	var form = this.getForm();
	var instance = form.getInstance();
	var targetListItems = form.getItemsById(ZaDomain.A2_zimbraAutoProvAccountTargetPool);
	if(targetListItems && (targetListItems instanceof Array) && targetListItems[0] && targetListItems[0].widget) {
		var selection = targetListItems[0].widget.getSelection();

		var currentTargetList = instance[ZaDomain.A2_zimbraAutoProvAccountTargetPool] ? instance[ZaDomain.A2_zimbraAutoProvAccountTargetPool] : [];
		currentTargetList.sort(ZaItem.compareNamesDesc);
		var tmpTargetList = [];
		var list = (selection instanceof AjxVector) ? selection.getArray() : (selection instanceof Array) ? selection : [selection];
		if(list) {
			list.sort(ZaItem.compareNamesDesc);
			var cnt = list.length;
			var cnt2 = currentTargetList.length;
			for(var i=0;i<cnt2;i++)
				tmpTargetList.push(currentTargetList[i]);

			for(var i=cnt-1; i>=0; i--) {
				var cnt2 = tmpTargetList.length;
				for(var j = cnt2-1; j >=0; j--) {
					if(list[i].name==tmpTargetList[j].name) {
						currentTargetList.splice(j,1);
						tmpTargetList.splice(j,cnt2-j);
					}
				}
			}
			this.getModel().setInstanceValue(this.getInstance(), ZaDomain.A2_zimbraAutoProvAccountTargetPool, currentTargetList);
		}
	}
	if(currentTargetList.length > 0) {
		form.parent._button[DwtDialog.OK_BUTTON].setEnabled(true);
	} else {
		form.parent._button[DwtDialog.OK_BUTTON].setEnabled(false);
	}
}

ZaTaskAutoProvDialog.removeAllButtonHndlr = function (ev) {
	var form = this.getForm();
	var instance = form.getInstance();

	instance[ZaDomain.A2_zimbraAutoProvAccountTargetPool] = new Array();
	var currentTargetList = instance[ZaDomain.A2_zimbraAutoProvAccountTargetPool] ? instance[ZaDomain.A2_zimbraAutoProvAccountTargetPool] : [];
	if(currentTargetList.length > 0) {
		form.parent._button[DwtDialog.OK_BUTTON].setEnabled(true);
	} else {
		form.parent._button[DwtDialog.OK_BUTTON].setEnabled(false);
	}
	this.getForm().setInstance(instance);
}

ZaTaskAutoProvDialog.backPoolButtonHndlr =
function(evt) {
	var currentPageNum = parseInt(this.getInstanceValue("/poolPagenum"))-1;
	this.setInstanceValue(currentPageNum,"/poolPagenum");
	ZaTaskAutoProvDialog.srchButtonHndlr.call(this, evt);
}

ZaTaskAutoProvDialog.fwdPoolButtonHndlr =
function(evt) {
	var currentPageNum = parseInt(this.getInstanceValue("/poolPagenum"));
	this.setInstanceValue(currentPageNum+1,"/poolPagenum");
	ZaTaskAutoProvDialog.srchButtonHndlr.call(this, evt);
}

ZaTaskAutoProvDialog.forwardBtnEnabled = function () {
	return (parseInt(this.getInstanceValue(ZaDomain.A2_zimbraAutoProvAccountPoolPageNum)) < (parseInt(this.getInstanceValue(ZaDomain.A2_zimbraAutoProvAccountPoolPageTotal))-1)
            && this.getInstanceValue(ZaDomain.A2_zimbraAutoProvSearchActivated)=="TRUE");
};

ZaTaskAutoProvDialog.backBtnEnabled = function () {
	return (parseInt(this.getInstanceValue(ZaDomain.A2_zimbraAutoProvAccountPoolPageNum)) > 0
            && this.getInstanceValue(ZaDomain.A2_zimbraAutoProvSearchActivated)== "TRUE");
};

ZaTaskAutoProvDialog.prototype.finishConfig = function () {
    var instance = this.getObject();

    var acctlist = instance[ZaDomain.A2_zimbraAutoProvAccountTargetPool];//this.getModel().getInstanceValue(instance,ZaDomain.A2_zimbraAutoProvAccountTargetPool);
    if(!acctlist || acctlist.length < 1) return;
    var soapDoc = AjxSoapDoc.create("BatchRequest", "urn:zimbra");
    soapDoc.setMethodAttribute("onerror", "continue");

    for(var i = 0; i < acctlist.length; i++) {
		var autoProvDoc = soapDoc.set("AutoProvAccountRequest", null, null, ZaZimbraAdmin.URN);

        var attr = soapDoc.set("domain", instance.id, autoProvDoc);
        attr.setAttribute("by", "id");

        attr = soapDoc.set("principal", acctlist[i].dn, autoProvDoc);
        attr.setAttribute("by", "dn");
    }

    var params = new Object();
    params.soapDoc = soapDoc;
    var reqMgrParams ={
        controller:ZaApp.getInstance().getCurrentController(),
        busyMsg : ZaMsg.BUSY_CREATING_GALDS,
        showBusy:true
    }
    ZaRequestMgr.invoke(params, reqMgrParams);
}


/////////////////////////////
ZaServerOptionList = function(parent,className) {
	DwtListView.call(this, parent, null);//, Dwt.ABSOLUTE_STYLE);
}

ZaServerOptionList.prototype = new DwtListView;
ZaServerOptionList.prototype.constructor = ZaServerOptionList;

ZaServerOptionList.prototype.toString =
function() {
	return "ZaServerOptionList";
}

ZaServerOptionList.prototype._createItemHtml =
function(item) {
	var html = new Array(10);
	var	div = document.createElement("div");
	div[DwtListView._STYLE_CLASS] = "Row";
	div[DwtListView._SELECTED_STYLE_CLASS] = div[DwtListView._STYLE_CLASS] + "-" + DwtCssStyle.SELECTED;
	div.className = div[DwtListView._STYLE_CLASS];
	this.associateItemWithElement(item, div, DwtListView.TYPE_LIST_ITEM);

	var idx = 0;
    var checked = "";
    if(item.checked) checked = "checked";
	html[idx++] = "<table width='100%' cellspacing='0' cellpadding='0'><tr><td width=20>"
	html[idx++] = "<input type=checkbox value='" + item + "' " + checked + "/></td>" ;
	html[idx++] = "<td>"+ item + "</td></tr></table>";

	div.innerHTML = html.join("");
	return div;
}