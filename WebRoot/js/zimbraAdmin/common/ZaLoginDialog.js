/*
 * ***** BEGIN LICENSE BLOCK *****
 * Version: ZPL 1.2
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.2 ("License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.zimbra.com/license
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 * 
 * The Original Code is: Zimbra Collaboration Suite Web Client
 * 
 * The Initial Developer of the Original Code is Zimbra, Inc.
 * Portions created by Zimbra are Copyright (C) 2005, 2006 Zimbra, Inc.
 * All Rights Reserved.
 * 
 * Contributor(s):
 * 
 * ***** END LICENSE BLOCK *****
 */

function ZaLoginDialog(parent, zIndex, className, appCtxt) { 

    className = className || "ZaLoginDialog";
    DwtDialog.call(this, parent, className, ZaMsg.login, DwtDialog.NO_BUTTONS);

	var licenseStatus = ZaZimbraAdmin.getLicenseStatus();
	var params = ZLoginFactory.copyDefaultParams(ZaMsg);
	params.showPanelBorder = false;
	params.showForm = true;
	params.showUserField = true;
	params.showPasswordField = true;
	params.showLicenseMsg = licenseStatus.licenseExists;
	params.licenseMsg = licenseStatus.message;
	params.showRememberMeCheckbox = false;
	params.showLogOff = true;
	params.logOffAction = "ZaLoginDialog._loginDiffListener()";
	params.loginAction = "ZaLoginDialog._loginListener(this)";
	params.showButton = true;
	var html = ZLoginFactory.getLoginDialogHTML(params);
	this.setContent(html);
}

ZaLoginDialog.prototype = new DwtDialog;
ZaLoginDialog.prototype.constructor = ZaLoginDialog;

ZaLoginDialog.prototype.toString = 
function() {
	return "ZaLoginDialog";
}

ZaLoginDialog.prototype.registerCallback =
function(func, obj) {
	this._callback = new AjxCallback(obj, func);
}

ZaLoginDialog.prototype.clearAll =
function() {
	ZLoginFactory.get(ZLoginFactory.USER_ID).value = "";
	ZLoginFactory.get(ZLoginFactory.PASSWORD_ID).value = "";
}

ZaLoginDialog.prototype.clearPassword =
function() {
	ZLoginFactory.get(ZLoginFactory.PASSWORD_ID).value = "";
}

ZaLoginDialog.prototype.showNewPasswordFields = function () {
	ZLoginFactory.showNewPasswordFields();
}

ZaLoginDialog.prototype.hideNewPasswordFields = function () {
	ZLoginFactory.hideNewPasswordFields();
}

ZaLoginDialog.prototype.disableUnameField = function () {
	ZLoginFactory.get(ZLoginFactory.USER_ID).disabled = true;
}

ZaLoginDialog.prototype.disablePasswordField = function () {
	ZLoginFactory.get(ZLoginFactory.PASSWORD_ID).disabled = true;
}

ZaLoginDialog.prototype.setError =
function(errorStr) {
	if(errorStr)
		ZLoginFactory.showErrorMsg(errorStr);
}

ZaLoginDialog.prototype.setFocus =
function(username, bReloginMode) {
	ZLoginFactory.showUserField(username);
	this.setReloginMode(username && username.length && bReloginMode);
 }
 
ZaLoginDialog.prototype.popup =
function(loc) {
	if (this._poppedUp) return;
	
	this.cleanup(true);
	var thisZ = this._zIndex;
	// if we're modal, setup the veil effect,
	// and track which dialogs are open
	if (this._mode == DwtBaseDialog.MODAL) {
		thisZ = this._setModalEffect(thisZ);
	}

	this._shell._veilOverlay.activeDialogs.push(this);

	
	// Deal with Firefox's horrible bug with absolutely 
	// positioned divs and inputs floating over them.
	if (!this._ffHackDisabled) Dwt._ffOverflowHack(this._htmlElId, thisZ, null, false);
	
	// use whichever has a value, local has precedence
	if (loc) {
		this._loc.x = loc.x;
		this._loc.y = loc.y;
		this._positionDialog(loc);
	} else {
		this._positionDialog();
	}
	
	this.setZIndex(thisZ);
	this._poppedUp = true;
}


ZaLoginDialog.prototype.setVisible = 
function(visible, transparentBg) {
	if (!!visible == this.isPoppedUp()) {
		return;
	}
	
	if (visible) {
		this.popup();
	} else {
		this.popdown();
	}
	for (var i = 0; i < ZLoginFactory.TAB_ORDER.length; i++) {
		var element = document.getElementById(ZLoginFactory.TAB_ORDER[i]);
		if (visible) {
			Dwt.associateElementWithObject(element, this);
		} else {
			Dwt.disassociateElementFromObject(null, this);
		}
	}

	Dwt.setHandler(this._getContentDiv(), DwtEvent.ONKEYDOWN, ZLoginFactory.handleKeyPress);
}

ZaLoginDialog.prototype.addChild =
function(child, childHtmlElement) {
    this._children.add(child);
}

ZaLoginDialog.prototype.setReloginMode = 
function(bReloginMode) {
	if (bReloginMode) {
		ZLoginFactory.showLogOff();
		ZLoginFactory.get(ZLoginFactory.USER_ID).disabled = true;
	} else {
		ZLoginFactory.hideLogOff();
		ZLoginFactory.get(ZLoginFactory.USER_ID).disabled = false;
	}
	
}

ZaLoginDialog.prototype._loginSelListener =
function() {
	this.setCursor("wait");
	var username = ZLoginFactory.get(ZLoginFactory.USER_ID).value;
	if (!(username && username.length)) {
		this.setError(ZaMsg.enterUsername);
		return;
	}
	if (this._callback) {
		var password = ZLoginFactory.get(ZLoginFactory.PASSWORD_ID).value;
		var newPassword = "";
		var confPassword = "";
		if(ZLoginFactory.isShown(ZLoginFactory.NEW_PASSWORD_ID) && ZLoginFactory.isShown(ZLoginFactory.PASSWORD_CONFIRM_ID)) {
			newPassword = ZLoginFactory.get(ZLoginFactory.NEW_PASSWORD_ID).value;
			confPassword = ZLoginFactory.get(ZLoginFactory.PASSWORD_CONFIRM_ID).value; 
		}
			
		this._callback.run(username, password,newPassword,confPassword);		
	}
}

ZaLoginDialog._loginListener =
function(target) {
	var loginDialogInstance = Dwt.getObjectFromElement(target);
	loginDialogInstance._loginSelListener();
};

ZaLoginDialog._loginDiffListener =
function(ev) {
	ZmZimbraMail.logOff();
};

