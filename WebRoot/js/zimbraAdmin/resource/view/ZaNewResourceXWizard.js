/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2006, 2007, 2008, 2009, 2010 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.3 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 */

/**
* @class ZaNewResourceXWizard
* @contructor ZaNewResourceXWizard
* @param parent
* @param ZaApp app
* This class defines the New Resource Wazards in XForm
* @author Charles Cao
**/
ZaNewResourceXWizard = function(parent, app) {
	ZaXWizardDialog.call(this, parent, app, null, ZaMsg.NCD_NewResTitle, "700px", "300px","ZaNewResourceXWizard");
	
	this.stepChoices = [
		{label:ZaMsg.TABT_ResourceProperties, value:1},
		{label:ZaMsg.TABT_ResLocationContact, value:2}
	];
	
	this._lastStep = this.stepChoices.length;
	this.cosChoices = new XFormChoices([], XFormChoices.OBJECT_LIST, "id", "name");
	this.initForm(ZaResource.myXModel,this.getMyXForm());	
   
	this._localXForm.setController(this._app);	
	this._localXForm.addListener(DwtEvent.XFORMS_FORM_DIRTY_CHANGE, new AjxListener(this, ZaNewResourceXWizard.prototype.handleXFormChange));
	this._localXForm.addListener(DwtEvent.XFORMS_VALUE_ERROR, new AjxListener(this, ZaNewResourceXWizard.prototype.handleXFormChange));	
	this._helpURL = ZaNewResourceXWizard.helpURL;
	
	this._domains = {} ;
}


ZaNewResourceXWizard.prototype = new ZaXWizardDialog;
ZaNewResourceXWizard.prototype.constructor = ZaNewResourceXWizard;
ZaXDialog.XFormModifiers["ZaNewResourceXWizard"] = new Array();
ZaNewResourceXWizard.helpURL = location.pathname + ZaUtil.HELP_URL + "managing_accounts/managing_resource.htm?locid="+AjxEnv.DEFAULT_LOCALE;

ZaNewResourceXWizard.prototype.handleXFormChange = 
function () {
	//Enable/disable the finish button
	if(this._localXForm.hasErrors()) {
		this._button[DwtWizardDialog.FINISH_BUTTON].setEnabled(false);
	} else {
		if(this._containedObject.attrs[ZaResource.A_displayname] && this._containedObject[ZaResource.A_name].indexOf("@") > 0)
			this._button[DwtWizardDialog.FINISH_BUTTON].setEnabled(true);
	}
}

/**
* Overwritten methods that control wizard's flow (open, go next,go previous, finish)
**/
ZaNewResourceXWizard.prototype.popup = 
function (loc) {
	ZaXWizardDialog.prototype.popup.call(this, loc);
	this._button[DwtWizardDialog.NEXT_BUTTON].setEnabled(true);
	this._button[DwtWizardDialog.FINISH_BUTTON].setEnabled(false);
	this._button[DwtWizardDialog.PREV_BUTTON].setEnabled(false);	
}

ZaNewResourceXWizard.prototype.finishWizard = 
function() {
	try {		
		if(!ZaResource.checkValues(this._containedObject, this._app)) {
			return false;
		}
		var resource = ZaItem.create(this._containedObject, ZaResource, "ZaResource", this._app);
		if(resource != null) {
			this._app.getResourceController().fireCreationEvent(resource);
			this.popdown();		
		}
	} catch (ex) {
		this._app.getCurrentController()._handleException(ex, "ZaNewResourceXWizard.prototype.finishWizard", null, false);
	}
}

ZaNewResourceXWizard.prototype.goNext = 
function() {
	if (this._containedObject[ZaModel.currentStep] == 1) {
		//check if passwords match
		if(this._containedObject.attrs[ZaResource.A_password]) {
			if(this._containedObject.attrs[ZaResource.A_password] != this._containedObject[ZaResource.A2_confirmPassword]) {
				this._app.getCurrentController().popupErrorDialog(ZaMsg.ERROR_PASSWORD_MISMATCH);
				return false;
			}
		}
		this._button[DwtWizardDialog.PREV_BUTTON].setEnabled(true);

		//check if account exists
		var params = { 	query: ["(|(uid=",this._containedObject[ZaResource.A_name],")(cn=",this._containedObject[ZaResource.A_name],")(sn=",this._containedObject[ZaResource.A_name],")(gn=",this._containedObject[ZaResource.A_name],")(mail=",this._containedObject[ZaResource.A_name],")(zimbraMailDeliveryAddress=",this._containedObject[ZaResource.A_name],"))"].join(""),
						limit : 2,
						applyCos: 0,
						controller: this._app.getCurrentController(),
						types: [ZaSearch.DLS,ZaSearch.ALIASES,ZaSearch.ACCOUNTS,ZaSearch.RESOURCES]
					 };
					
		var resp = ZaSearch.searchDirectory(params).Body.SearchDirectoryResponse;		
		var list = new ZaItemList(null, this._app);	
		list.loadFromJS(resp);	
		if(list.size() > 0) {
			var acc = list.getArray()[0];
			if(acc.type==ZaItem.ALIAS) {
				this._app.getCurrentController().popupErrorDialog(ZaMsg.ERROR_aliasWithThisNameExists);
			} else if (acc.type==ZaItem.RESOURCE) {
				this._app.getCurrentController().popupErrorDialog(ZaMsg.ERROR_resourceWithThisNameExists);
			} else if (acc.type==ZaItem.DL) {
				this._app.getCurrentController().popupErrorDialog(ZaMsg.ERROR_dlWithThisNameExists);
			} else {
				this._app.getCurrentController().popupErrorDialog(ZaMsg.ERROR_accountWithThisNameExists);
			}
			return false;
		} 
		this._button[DwtWizardDialog.PREV_BUTTON].setEnabled(true);		
	} 	
	
	this.goPage(this._containedObject[ZaModel.currentStep] + 1);
	if(this._containedObject[ZaModel.currentStep] == this._lastStep) {
		this._button[DwtWizardDialog.NEXT_BUTTON].setEnabled(false);
	}	
}

ZaNewResourceXWizard.prototype.goPrev = 
function() {
	if (this._containedObject[ZaModel.currentStep] == 2) {
		this._button[DwtWizardDialog.PREV_BUTTON].setEnabled(false);
	}
	
	this._button[DwtWizardDialog.NEXT_BUTTON].setEnabled(true);
	
	this.goPage(this._containedObject[ZaModel.currentStep] - 1);
}

/**
* @method setObject sets the object contained in the view
* @param entry - ZaResource object to display
**/
ZaNewResourceXWizard.prototype.setObject =
function(entry) {
	this._containedObject = new Object();
	this._containedObject.attrs = new Object();

	for (var a in entry.attrs) {
		this._containedObject.attrs[a] = entry.attrs[a];
	}
	this._containedObject.name = "";

	this._containedObject.id = null;
	if(ZaSettings.COSES_ENABLED) {
		this._containedObject.cos = ZaCos.getCosByName("default",this._app);
		if(!this._containedObject.cos) {
			var cosList = this._app.getCosList().getArray();
			this._containedObject.cos = cosList[0];
			this._containedObject.attrs[ZaResource.A_COSId] = cosList[0].id;
		}
	} else {
		this._containedObject.cos = new ZaCos(this._app);
	}
	//set the default value of resource type and schedule policy
	this._containedObject.attrs[ZaResource.A_zimbraCalResType] = ZaResource.RESOURCE_TYPE_LOCATION;
	this._containedObject[ZaResource.A2_schedulePolicy] = ZaResource.SCHEDULE_POLICY_ACCEPT_UNLESS_BUSY;
	this._containedObject.attrs[ZaResource.A_accountStatus] = ZaResource.ACCOUNT_STATUS_ACTIVE;
	this._containedObject[ZaResource.A2_autodisplayname] = "TRUE";
	this._containedObject[ZaResource.A2_autoMailServer] = "TRUE";
	this._containedObject[ZaResource.A2_autoCos] = "TRUE";
	this._containedObject[ZaResource.A2_autoLocationName] = "TRUE";	
	this._containedObject[ZaResource.A2_confirmPassword] = null;
	this._containedObject[ZaModel.currentStep] = 1;
	var domainName;
	
	if(ZaSettings.GLOBAL_CONFIG_ENABLED) {
		if(!domainName) {
			//find out what is the default domain
			domainName = this._app.getGlobalConfig().attrs[ZaGlobalConfig.A_zimbraDefaultDomainName];
			if(!domainName && ZaSettings.DOMAINS_ENABLED && this._app.getDomainList().size() > 0) {
				domainName = this._app.getDomainList().getArray()[0].name;
			}
		}
		this._containedObject.globalConfig = this._app.getGlobalConfig();
	} 
	if(!domainName) {
		domainName =  ZaSettings.myDomainName;
	}
	this._containedObject[ZaResource.A_name] = "@" + domainName;
	this._localXForm.setInstance(this._containedObject);
}

ZaNewResourceXWizard.onCOSChanged = 
function(value, event, form) {
	if(ZaItem.ID_PATTERN.test(value))  {
		form.getInstance().cos = ZaCos.getCosById(value, form.parent._app);
		this.setInstanceValue(value);
	} else {
		form.getInstance().cos = ZaCos.getCosByName(value, form.parent._app);
		if(form.getInstance().cos) {
			//value = form.getInstance().cos.id;
			value = form.getInstance().cos.id;
		} 
	}
	this.setInstanceValue(value);
    form.parent._isCosChanged = true ;

    //if cos is changed,  update the account type information
 
    return value;
}

ZaNewResourceXWizard.myXFormModifier = function(xFormObject) {	
	var domainName;
	if(ZaSettings.DOMAINS_ENABLED && this._app.getDomainList().size() > 0)
		domainName = this._app.getDomainList().getArray()[0].name;
	else 
		domainName = ZaSettings.myDomainName;

	var cases = new Array();
	
	var nameGroup = {type:_ZAWIZ_TOP_GROUPER_, label:ZaMsg.NAD_ResourceNameGrouper, id:"resource_wiz_name_group",numCols:2,
		items:[
			{ref:ZaResource.A_displayname, type:_TEXTFIELD_, msgName:ZaMsg.NAD_ResourceName,
				label:ZaMsg.NAD_ResourceName, labelLocation:_LEFT_, 
				elementChanged: function(elementValue,instanceValue, event) {
					//auto fill the account name when autodisplayname is true
					if(this.getInstance()[ZaResource.A2_autodisplayname]=="TRUE") {
						try {
							ZaResource.setAutoAccountName(this.getInstance(), elementValue );
							this.getForm().itemChanged(this.getForm().getItemById(this.getForm().getId()+"_case").__xform.getItemById(this.getForm().getId()+"_resource_email_addr"), this.getInstance()[ZaResource.A_name], event);
							this.getInstance()[ZaResource.A2_autodisplayname]="TRUE";
						} catch (ex) {
							this.getForm().parent._app.getCurrentController()._handleException(ex, "XForm." + ZaResource.A_displayname + ".elementChanged", null, false);
						}
					}
					this.getForm().itemChanged(this, elementValue, event);
				}
			},			
/*			{ref:ZaResource.A_zimbraCalResType, type:_OSELECT1_, msgName:ZaMsg.NAD_ResType,label:ZaMsg.NAD_ResType, 
				labelLocation:_LEFT_, choices:ZaResource.resTypeChoices
			},	*/	
			{ref:ZaResource.A_name, type:_EMAILADDR_, msgName:ZaMsg.NAD_ResAccountName,label:ZaMsg.NAD_ResAccountName, 
				labelLocation:_LEFT_,id:"resource_email_addr", forceupdate: true, 
				onChange: function(value, event, form) {
					//disable the autodisplayname whenever user does some action on the account name
					this.getInstance()[ZaResource.A2_autodisplayname] = "FALSE";							
					this.setInstanceValue(value);	
				}
			}				
		]
	}
	
	var setupGroup = {type:_ZAWIZ_TOP_GROUPER_, label:ZaMsg.NAD_ResourceSetupGrouper, id:"resource_wiz_name_group",numCols:2,
		items:[
			{ref:ZaResource.A_zimbraCalResType, type:_OSELECT1_, msgName:ZaMsg.NAD_ResType,label:ZaMsg.NAD_ResType, 
				labelLocation:_LEFT_, choices:ZaResource.resTypeChoices
			}		
		]
	}	

	if(ZaSettings.COSES_ENABLED) {
		setupGroup.items.push(
			/*{ref:ZaResource.A_COSId, type:_OSELECT1_, msgName:ZaMsg.NAD_ClassOfService,
				label:ZaMsg.NAD_ClassOfService, labelLocation:_LEFT_, 
				choices:this._app.getCosListChoices(), onChange:ZaNewResourceXWizard.onCOSChanged
			}*/
			{type:_GROUP_, numCols:3, nowrap:true, label:ZaMsg.NAD_ClassOfService, labelLocation:_LEFT_,
				items: [
					{ref:ZaResource.A_COSId, type:_DYNSELECT_,label: null, 
						onChange:ZaNewResourceXWizard.onCOSChanged,
						relevant:"instance[ZaResource.A2_autoCos]==\"FALSE\"",relevantBehavior:_DISABLE_ ,
						dataFetcherMethod:ZaSearch.prototype.dynSelectSearchCoses,choices:this.cosChoices,
						dataFetcherClass:ZaSearch,editable:true,getDisplayValue:function(newValue) {
								// dereference through the choices array, if provided
								//newValue = this.getChoiceLabel(newValue);
								if(ZaItem.ID_PATTERN.test(newValue)) {
									var cos = ZaCos.getCosById(newValue, this.getForm().parent._app);
									if(cos)
										newValue = cos.name;
								} 
								if (newValue == null) {
									newValue = "";
								} else {
									newValue = "" + newValue;
								}
								return newValue;
							}
					},
					{ref:ZaResource.A2_autoCos, type:_CHECKBOX_, 
						msgName:ZaMsg.NAD_Auto,label:ZaMsg.NAD_Auto,labelLocation:_RIGHT_,
						trueValue:"TRUE", falseValue:"FALSE" ,
						elementChanged: function(elementValue,instanceValue, event) {
							if(elementValue=="TRUE") {
								ZaAccount.setDefaultCos(this.getInstance(), this.getForm().parent._app);	
							}
							this.getForm().itemChanged(this, elementValue, event);
						}
					}
				]
			}
		);
	}
	
	setupGroup.items.push({ref:ZaResource.A_accountStatus, type:_OSELECT1_, editable:false, msgName:ZaMsg.NAD_ResourceStatus,
					  label:ZaMsg.NAD_ResourceStatus, labelLocation:_LEFT_, choices:ZaResource.accountStatusChoices});
		
	setupGroup.items.push({ref:ZaResource.A2_schedulePolicy, type:_OSELECT1_, msgName:ZaMsg.NAD_ResType,
						label:ZaMsg.NAD_SchedulePolicy, labelLocation:_LEFT_, width: "300px", 
						elementChanged: function(elementValue,instanceValue, event) {
							if(elementValue==ZaResource.SCHEDULE_POLICY_MANUAL) {
								this.getInstance().attrs[ZaResource.A_zimbraCalResAutoDeclineRecurring]="FALSE";
							}
							this.getForm().itemChanged(this, elementValue, event);
						},
						choices:ZaResource.schedulePolicyChoices});	
						
	setupGroup.items.push({ref:ZaResource.A_zimbraCalResMaxNumConflictsAllowed, type:_TEXTFIELD_,
		msgName:ZaMsg.zimbraCalResMaxNumConflictsAllowed, label:ZaMsg.zimbraCalResMaxNumConflictsAllowed,
		labelLocation:_LEFT_, cssClass:"admin_xform_number_input"});		
		
	setupGroup.items.push({ref:ZaResource.A_zimbraCalResMaxPercentConflictsAllowed, type:_TEXTFIELD_,
		msgName:ZaMsg.zimbraCalResMaxPercentConflictsAllowed, label:ZaMsg.zimbraCalResMaxPercentConflictsAllowed,
		labelLocation:_LEFT_, cssClass:"admin_xform_number_input"});	
								
	setupGroup.items.push({ref:ZaResource.A_zimbraCalResAutoDeclineRecurring, type:_CHECKBOX_, 
						relevant:"(instance[ZaResource.A2_schedulePolicy]!=ZaResource.SCHEDULE_POLICY_MANUAL)",relevantBehavior:_DISABLE_,
						msgName:ZaMsg.NAD_DeclineRecurring,label:ZaMsg.NAD_DeclineRecurring, 
						labelCssClass:"xform_label", align:_LEFT_,labelLocation:_LEFT_,trueValue:"TRUE", falseValue:"FALSE"});
					
	
	if(ZaSettings.SERVERS_ENABLED) {		
		setupGroup.items.push({type:_GROUP_, numCols:3, nowrap:true, label:ZaMsg.NAD_MailServer, labelLocation:_LEFT_,
							items: [
								{ ref: ZaResource.A_mailHost, type: _OSELECT1_, label: null, editable:false, 
									choices: this._app.getServerListChoices(), 
									relevant:"instance[ZaResource.A2_autoMailServer]==\"FALSE\" && form.getController().getServerListChoices().getChoices().values.length != 0",
									relevantBehavior:_DISABLE_
							  	},
								{ref:ZaResource.A2_autoMailServer, type:_CHECKBOX_, msgName:ZaMsg.NAD_Auto,
									label:ZaMsg.NAD_Auto,labelLocation:_RIGHT_,trueValue:"TRUE", falseValue:"FALSE"}
							]
						}); 
	}
	
	var passwordGroup = {type:_ZAWIZ_TOP_GROUPER_, label:ZaMsg.NAD_PasswordGrouper,id:"account_wiz_password_group", 
		numCols:2,
		items:[
			{ref:ZaResource.A_password, type:_SECRET_, msgName:ZaMsg.NAD_Password,label:ZaMsg.NAD_Password, labelLocation:_LEFT_, cssClass:"admin_xform_name_input"},
			{ref:ZaResource.A2_confirmPassword, type:_SECRET_, msgName:ZaMsg.NAD_ConfirmPassword,label:ZaMsg.NAD_ConfirmPassword, labelLocation:_LEFT_, cssClass:"admin_xform_name_input"}
		]
		
	}

	var notesGroup = {type:_ZAWIZ_TOP_GROUPER_, label:ZaMsg.NAD_NotesGrouper, id:"account_wiz_notes_group",
		numCols:2,
	 	items:[
			{ref:ZaResource.A_description, type:_INPUT_, msgName:ZaMsg.NAD_Description,
					label:ZaMsg.NAD_Description, labelLocation:_LEFT_, width: "300px", cssClass:"admin_xform_name_input"},
			{ref:ZaResource.A_notes, type:_TEXTAREA_, msgName:ZaMsg.NAD_Notes,label:ZaMsg.NAD_Notes, labelLocation:_LEFT_}
		]
	};
	var case1 = {type:_CASE_, numCols:1, relevant:"instance[ZaModel.currentStep] == 1", align:_LEFT_, valign:_TOP_,
		items:[nameGroup,setupGroup,passwordGroup,notesGroup]
	
	};	
	

	cases.push(case1);

	var defaultWidth = 250;	
	var case2={type:_CASE_, numCols:1,  relevant:"instance[ZaModel.currentStep] == 2",
					items: [
						/*{type:_GROUP_, numCols:3, nowrap:true, useParentTable:false,
							colSizes:["250px","50px","100px"],
							msgName:ZaMsg.NAD_LocationDisplayName, 
							label:ZaMsg.NAD_LocationDisplayName, labelLocation:_LEFT_, 
							items: [
								{ref:ZaResource.A_locationDisplayName, type:_TEXTFIELD_, label:null, 
									cssClass:"admin_xform_name_input", 
									width:defaultWidth,  
									relevant:"instance[ZaResource.A2_autoLocationName] == \"FALSE\"",
									relevantBehavior:_DISABLE_
								},
								{ref:ZaResource.A2_autoLocationName , type:_CHECKBOX_, msgName:ZaMsg.NAD_Auto,
									label:ZaMsg.NAD_Auto,labelLocation:_RIGHT_,trueValue:"TRUE", falseValue:"FALSE",
									elementChanged: ZaResource.setAutoLocationName
								 }
							]
						},*/					
						{type:_ZAWIZGROUP_, 
							items:[
								{ref:ZaResource.A_zimbraCalResContactName, type:_TEXTFIELD_, msgName:ZaMsg.NAD_ContactName,
									label:ZaMsg.NAD_ContactName, labelLocation:_LEFT_, width:defaultWidth},
								{ref:ZaResource.A_zimbraCalResContactEmail, type:_TEXTFIELD_, msgName:ZaMsg.NAD_ContactEmail,
									label:ZaMsg.NAD_ContactEmail, labelLocation:_LEFT_, width:defaultWidth},
								{ref:ZaResource.A_zimbraCalResContactPhone, type:_TEXTFIELD_, msgName:ZaMsg.NAD_ContactPhone,
									label:ZaMsg.NAD_ContactPhone, labelLocation:_LEFT_, width:defaultWidth}
							]
						},
						{type:_ZAWIZGROUP_, colSizes:["200px","300px"],
							items:[
								{type:_GROUP_, numCols:3, nowrap:true, width:200, msgName:ZaMsg.NAD_LocationDisplayName,label:ZaMsg.NAD_LocationDisplayName, labelLocation:_LEFT_, 
									items: [
										{ref:ZaResource.A_locationDisplayName, type:_TEXTFIELD_, 
											label:null,	width:defaultWidth,  
											relevant:"instance[ZaResource.A2_autoLocationName] == \"FALSE\"",
											relevantBehavior:_DISABLE_
										},
										{ref:ZaResource.A2_autoLocationName, type:_CHECKBOX_, msgName:ZaMsg.NAD_Auto,label:ZaMsg.NAD_Auto,labelLocation:_RIGHT_,trueValue:"TRUE", falseValue:"FALSE",
											elementChanged: ZaResource.setAutoLocationName
										}
									]
								},								
								{ref:ZaResource.A_zimbraCalResSite, type:_TEXTFIELD_, msgName:ZaMsg.NAD_Site,label:ZaMsg.NAD_Site, 
										labelLocation:_LEFT_, width:defaultWidth, elementChanged: ZaResource.setAutoLocationName},
								{ref:ZaResource.A_zimbraCalResBuilding, type:_TEXTFIELD_, msgName:ZaMsg.NAD_Building,label:ZaMsg.NAD_Building, 
										labelLocation:_LEFT_, width:defaultWidth, elementChanged: ZaResource.setAutoLocationName},						
								{ref:ZaResource.A_zimbraCalResFloor, type:_TEXTFIELD_, msgName:ZaMsg.NAD_Floor,label:ZaMsg.NAD_Floor, 
										labelLocation:_LEFT_, width:defaultWidth, elementChanged: ZaResource.setAutoLocationName},						
								{ref:ZaResource.A_zimbraCalResRoom, type:_TEXTFIELD_, msgName:ZaMsg.NAD_Room,label:ZaMsg.NAD_Room, 
										labelLocation:_LEFT_, width:defaultWidth, elementChanged: ZaResource.setAutoLocationName},
								{ref:ZaResource.A_zimbraCalResCapacity, type:_TEXTFIELD_, msgName:ZaMsg.NAD_Capacity,label:ZaMsg.NAD_Capacity, 
									labelLocation:_LEFT_, width:defaultWidth,
									relevant: "instance.attrs[ZaResource.A_zimbraCalResType].toLowerCase() ==  ZaResource.RESOURCE_TYPE_LOCATION.toLowerCase( )",
									relevantBehavior:_HIDE_
								}
							]
						},											
						{type:_ZAWIZGROUP_, 
							items:[
								{ref:ZaResource.A_street, type:_TEXTFIELD_, msgName:ZaMsg.NAD_Street,label:ZaMsg.NAD_Street, 
									labelLocation:_LEFT_, width:defaultWidth},
								{ref:ZaResource.A_city, type:_TEXTFIELD_, msgName:ZaMsg.NAD_city ,label:ZaMsg.NAD_city, 
									labelLocation:_LEFT_, width:defaultWidth},
								{ref:ZaResource.A_state, type:_TEXTFIELD_, msgName:ZaMsg.NAD_state ,label:ZaMsg.NAD_state, 
									labelLocation:_LEFT_, width:defaultWidth},
								{ref:ZaResource.A_country, type:_TEXTFIELD_, msgName:ZaMsg.country ,label:ZaMsg.NAD_country, 
									labelLocation:_LEFT_, width:defaultWidth},
								{ref:ZaResource.A_zip, type:_TEXTFIELD_, msgName:ZaMsg.zip ,label:ZaMsg.NAD_zip, 
									labelLocation:_LEFT_, width:defaultWidth}
							]
						}
					]
				};
	cases.push(case2);

	xFormObject.items = [
			{type:_OUTPUT_, colSpan:2, align:_CENTER_, valign:_TOP_, ref:ZaModel.currentStep, choices:this.stepChoices},
			{type:_SEPARATOR_, align:_CENTER_, valign:_TOP_},
			{type:_SPACER_,  align:_CENTER_, valign:_TOP_},
			{type:_SWITCH_, width:650, align:_LEFT_, valign:_TOP_, items:cases}
		];
};
ZaXDialog.XFormModifiers["ZaNewResourceXWizard"].push(ZaNewResourceXWizard.myXFormModifier);
