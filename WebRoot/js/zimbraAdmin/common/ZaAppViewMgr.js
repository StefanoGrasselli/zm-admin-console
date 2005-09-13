/*
 * ***** BEGIN LICENSE BLOCK *****
 * Version: ZPL 1.1
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.1 ("License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.zimbra.com/license
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 * 
 * The Original Code is: Zimbra Collaboration Suite.
 * 
 * The Initial Developer of the Original Code is Zimbra, Inc.
 * Portions created by Zimbra are Copyright (C) 2005 Zimbra, Inc.
 * All Rights Reserved.
 * 
 * Contributor(s):
 * 
 * ***** END LICENSE BLOCK *****
 */

/**
* Creates a layout manager from the given components.
* @constructor
* @class
* This class manages layout. The layout is divided into the following parts:
* <p><ul>
*  <li>banner: static; has a few account-related buttons</li>
*  <li>search bar: static; has buttons for various ways to search, including browse</li>
*  <li>overview panel: tree view of folders, tags, app links</li>
*  <li>sash: a thin moveable vertical bar for resizing the surrounding elements
*  <li>app container: the most dynamic area; displays app-specific toolbar and content</li>
* </ul></p>
* <p>
* Visibility is managed through Z indexes, which have constants in the following order:</p>
* <p>
* Z_HIDDEN, Z_CURTAIN, Z_VIEW, Z_TOOLTIP, Z_MENU, Z_VEIL, Z_DIALOG, Z_BUSY</p>
* <p>
* Since z-index matters only among peer elements, anything that we manage via z-index has to
* hang off the shell. To manage an app view, we create an app container that hangs off the shell
* and put the app view in there.</p>
* <p>
* The app container lays out the app elements in the desired style, for example, in a vertical
* layout. Different layout styles can be added here, and then specified when the app view is
* created.</p>
* <p>
* Some views are "volatile", which means they trigger browser bugs when we try to hide them. It happens
* with views that contain forms. In IE, SELECT fields don't obey z-index, and in Firefox, the cursor
* bleeds through.
*
* @author Conrad Damon
* @author Ross Dargahi
* @param shell			the outermost containing element
* @param banner			the banner
* @param controller		the app controller
*/
function ZaAppViewMgr(shell, banner, controller) {

	this._shell = shell;
	this._controller = controller;

	this._shellSz = this._shell.getSize();
	this._shell.addControlListener(new AjxListener(this, this._shellControlListener));
	this._needBannerLayout = false;
	this._sash = new DwtSash(this._shell, DwtSash.HORIZONTAL_STYLE, "AppSash-horiz", 5);
	this._sash.registerCallback(this._sashCallback, this);
	
	this._currentView = null;			// name of currently visible view
	this._views = new Object();			// hash that gives names to app views
	this._hidden = new Array();			// stack of views that aren't visible
	
	this._layoutStyle = new Object();	// hash matching view to layout style
	this._appView = new Object();		// hash matching an app name to its current main view
	this._popCallback = new Object();	// a view can have a callback for when it is popped
	this._viewApp = new Object();		// hash matching view names to their owning apps
	this._volatile = new Object();		// names of volatile views (which trigger browser bugs)
	this._isAppView = new Object();		// names of top-level app views
	this._staleCallback = new Object(); // when topmost view is popped, allow underlying view to cleanup

	// hash matching layout style to their methods	
	this._layoutMethod = new Object();
	this._layoutMethod[ZaAppViewMgr.LAYOUT_VERTICAL] = this._appLayoutVertical;
}

ZaAppViewMgr.DEFAULT = -1;

// reasons the layout changes
ZaAppViewMgr.RESIZE = 1;
ZaAppViewMgr.BROWSE = 2;
ZaAppViewMgr.OVERVIEW = 3;

// visible margins (will be shell background color)
ZaAppViewMgr.TOOLBAR_SEPARATION = 0;	// below search bar
ZaAppViewMgr.COMPONENT_SEPARATION = 2;	// in app container

// layout styles
ZaAppViewMgr.LAYOUT_VERTICAL = 1;	// top to bottom, full width, last element gets remaining space

// used when coming back from pop shield callbacks
ZaAppViewMgr.PENDING_VIEW = "ZaAppViewMgr.PENDING_VIEW";

// Public methods

ZaAppViewMgr.prototype.toString = 
function() {
	return "ZaAppViewMgr";
}

ZaAppViewMgr.prototype.dtor = 
function() {
	for (var i in this._views)
		this._views[i].getHtmlElement().innerHTML = "";
	if (this._overviewPanel)
		this._overviewPanel.getHtmlElement().innerHTML = "";
	if (this._searchPanel)
		this._searchPanel.getHtmlElement().innerHTML = "";		
	if (this._headerPanel)
		this._headerPanel.getHtmlElement().innerHTML = "";		
		
}

/**
* Provides the search panel for this shell.
*
* @param searchPanel	the search panel
*/
ZaAppViewMgr.prototype.setSearchPanel =
function(searchPanel) {
	this._searchPanel = searchPanel;
}


/**
* Provides the header panel for this shell.
*
* @param searchPanel	the search panel
*/
ZaAppViewMgr.prototype.setHeaderPanel =
function(headerPanel) {
	this._headerPanel = headerPanel;
}

/**
* Provides the overview panel for this shell.
*
* @param overviewPanel	the overview panel
*/
ZaAppViewMgr.prototype.setOverviewPanel =
function(overviewPanel) {
	this._overviewPanel = overviewPanel;
}

/**
* Returns the name of the app view currently being displayed.
*/
ZaAppViewMgr.prototype.getCurrentView =
function() {
	return this._currentView;
}

/**
* Returns the current top-level view for the given app.
*
* @param app	the name of an app
*/
ZaAppViewMgr.prototype.getAppView =
function(app) {
	return this._appView[app];
}

/**
* Sets the current top-level view for the given app. Should be called by an app (or controller) that
* changes the top-level view of the app.
*
* @param app	the name of an app
* @param view	the name of a view
*/
ZaAppViewMgr.prototype.setAppView =
function(app, view) {
	this._appView[app] = view;
	this._controller.setActiveApp(app);
}

/**
* Creates an app view from the given components and puts it in an app container.
*
* @param viewName		the name of the view
* @param appName		the name of the owning app
* @param elements		an array of elements to display
* @param popCallback 	function to call when this view is about to be hidden
* @param style			layout style
* @param isVolatile		view is to be destroyed on pop
* @param isAppView 		
* @param staleCallback 	function to call on underlying view when topmost is popped
* @returns				the app view
*/
ZaAppViewMgr.prototype.createView =
function(viewName, appName, elements, popCallback, style, isVolatile, isAppView, staleCallback) {
	DBG.println(AjxDebug.DBG1, "createView: " + viewName);
	var appContainer = new DwtComposite(this._shell, null, DwtControl.ABSOLUTE_STYLE);
	for (var i = 0; i < elements.length; i++)
		elements[i].reparent(appContainer);
	this._views[viewName] = appContainer;
	this._layoutStyle[viewName] = style || ZaAppViewMgr.LAYOUT_VERTICAL;
	this._popCallback[viewName] = popCallback;
	this._staleCallback[viewName] = staleCallback;
	this._viewApp[viewName] = appName;

	this._volatile[viewName] = true; // make every view volatile, see if it helps with browser quirks
	if (isAppView)
		this._isAppView[viewName] = true;
	
	return appContainer;
}

/**
* Makes the given view visible, pushing the previously visible one to the top of the
* hidden stack.
*
* @param viewName	the name of the app view to push
* @param force		ignore popped view's callbacks
* @returns			true if the view was pushed
*/
ZaAppViewMgr.prototype.pushView =
function(viewName, force) {
	DBG.println(AjxDebug.DBG1, "pushView: " + viewName);
	if (this._currentView == viewName)
		return false;
	if (viewName == ZaAppViewMgr.PENDING_VIEW) {
	DBG.println(AjxDebug.DBG1, "pushView of pending view");
		viewName = this._pendingView;
		force = true;
	}
	if (this._currentView) {
		if (!this._hideCurrentView(new AjxCallback(this, this.pushView), viewName, force))
		 	return false;

			this._hidden.push(this._currentView);
	}
	this._currentView = viewName;
	DBG.println(AjxDebug.DBG2, "app view mgr: current view is now " + this._currentView);
	this._views[viewName].zShow(true);
	this._layout();
	this._controller.getControllerForView(viewName).setCurrentView(viewName);
	if (this._isAppView[viewName])
		this.setAppView(this._viewApp[viewName], viewName);
	return true;
}


/**
* Makes the given view visible, and clears the hidden stack.
*
* @param viewName	the name of a view
* @param force		ignore popped view's callbacks
* @returns			true if the view was set
*/
ZaAppViewMgr.prototype.setView =
function(viewName, force) {
	DBG.println(AjxDebug.DBG1, "setView: " + viewName);
	var result = this.pushView(viewName, force);
        if (result)
		this._hidden = new Array();
	return result;
}

/**
* Shows the view that was waiting for return from a popped view's callback. Typically, the
* popped view's callback will have put up some sort of dialog, and this function would be
* called by a listener on a dialog button.
*
* @param show		whether to show the pending view
*/
ZaAppViewMgr.prototype.showPendingView =
function(show) {
	if (show && this._pendingAction) {
		if (this._pendingAction.run(ZaAppViewMgr.PENDING_VIEW)) {
			this._controller.setActiveApp(this._viewApp[this._pendingView]);
		}
	}
	this._pendingAction = this._pendingView = null;
}

/**
* Returns the geometry of the app container.
*/
ZaAppViewMgr.prototype.getAppBounds =
function() {
	return this._appBounds;
}

/**
* Forces layout to be done.
*
* @param reason		used to control layout of specific components
*/
ZaAppViewMgr.prototype.layoutChanged =
function(reason) {
DBG.println(AjxDebug.DBG2, "The layout changed! (reason = " + reason + ")");
	this._shellSz = this._shell.getSize();

	this._layout();
}

/**
* Lays out the banner, which is a composite with two children: an image, and a banner bar that
* contains the banner links.
*/
ZaAppViewMgr.prototype.layoutBanner =
function() {
	DBG.println(AjxDebug.DBG2, "doing banner layout");
	var bannerHtmlElement = this._banner.getHtmlElement();
	var bannerImg = bannerHtmlElement.firstChild;
	Dwt.setLocation(bannerImg, 0, 0);
	this._bannerImageSize = Dwt.getSize(bannerImg);
	this._banner.setBounds(0, 0, this._shellSz.x, this._bannerImageSize.y);
	var bannerBar = Dwt.getObjectFromElement(bannerHtmlElement.lastChild);
	bannerBar.setBounds(this._bannerImageSize.x, 0, this._shellSz.x - this._bannerImageSize.x, this._bannerImageSize.y);
	var bannerTable = bannerBar.getHtmlElement().firstChild;
	Dwt.setSize(bannerTable, Dwt.DEFAULT, this._bannerImageSize.y);
	this._needBannerLayout = false;
}

// Private methods

// Tries to hide the current view. First checks to see if the current view has a callback
// for when it is popped. The callback must return true for the view to be hidden. If the
// view was created as "volatile", it is moved offscreen in order to mask browser bugs with
// z-index handling. In IE, SELECT elements ignore z-index, and in FireFox, the cursor stays
// visible. Basically, any view with a form is volatile.
ZaAppViewMgr.prototype._hideCurrentView =
function(pendingAction, pendingView, skipCallback) {
	var okToContinue = true;
	var callback = this._popCallback[this._currentView];
	if (callback && !skipCallback) {
		DBG.println(AjxDebug.DBG2, "hiding " + this._currentView + ", waiting on " + pendingView + "; skip = " + skipCallback);
		this._pendingAction = pendingAction;
		this._pendingView = pendingView;
		okToContinue = callback.run();
	}
	if (okToContinue) {
		this._views[this._currentView].zShow(false);
		DBG.println(AjxDebug.DBG2, this._currentView + " hidden");
		if (this._volatile[this._currentView]) {
			DBG.println(AjxDebug.DBG1, "quarantining volatile view: " + this._currentView);
			this._views[this._currentView].setLocation(Dwt.LOC_NOWHERE, Dwt.LOC_NOWHERE);
		}
	}

	return okToContinue;
}

/**
* This is the core method of the app view manager. It lays out everything, including
* the search bar (which may include a browse panel), the overview panel,
* and the app area.
**/
ZaAppViewMgr.prototype._layout =
function(style) {
	
	if (!this._currentView) return;
	
	// search panel
	var x = 0, y = 0;

		
	if (this._searchPanel) {
		DBG.println(AjxDebug.DBG3, "searchPanel: " + x + '/' + y + '/' + this._shellSz.x + '/' + Dwt.DEFAULT);
		this._searchPanel.setBounds(x, y, this._shellSz.x, Dwt.DEFAULT);

		var searchSz = this._searchPanel.getSize();
		y += searchSz.y;
		if(!AjxEnv.isIE)
			y += ZaAppViewMgr.TOOLBAR_SEPARATION;
	}
	
		
	if (this._headerPanel) {
		DBG.println(AjxDebug.DBG3, "headerPanel: " + x + '/' + y + '/' + this._shellSz.x + '/' + Dwt.DEFAULT);
		this._headerPanel.setBounds(x, y, this._shellSz.x, Dwt.DEFAULT);
		var headerSz = this._headerPanel.getSize();
		y += headerSz.y;
		if(!AjxEnv.isIE)
			y += ZaAppViewMgr.TOOLBAR_SEPARATION;
	}	

	// overview panel
	if (this._overviewPanel) {
		var overviewHeight = Math.max(this._shellSz.y - y, 0);
		DBG.println(AjxDebug.DBG3, "overviewPanel: " + x + '/' + y + '/' + Dwt.DEFAULT + '/' + overviewHeight);
		this._overviewPanel.setBounds(x, y, Dwt.DEFAULT, overviewHeight);
		x += this._overviewPanel.getSize().x;
	}
	
	// sash
	if (this._sash && this._sash.getVisible()) {
		var sashHeight = this._overviewPanel.getSize().y;
		DBG.println(AjxDebug.DBG3, "sash: " + x + '/' + y + '/' + Dwt.DEFAULT + '/' + sashHeight);
		this._sash.setBounds(x, y, Dwt.DEFAULT, sashHeight);
		x += this._sash.getSize().x;
	}	

	// layout the app portion in the appropriate style
	this._layoutMethod[this._layoutStyle[this._currentView]].call(this, x, y);
}

/** 
* Lays out the elements one on top of the other, separated by COMPONENT_SEPARATION. Each
* element extends the entire width. The last element uses the remaining vertical space.
**/
ZaAppViewMgr.prototype._appLayoutVertical =
function(x, y) {
	// app container
	var appContainer = this._views[this._currentView];
	var width = Math.max(this._shellSz.x - x, 0);
	var height = Math.max(this._shellSz.y - y, 0);
	DBG.println(AjxDebug.DBG3, "appContainer: " + x + '/' + y + '/' + width + '/' + height);
	appContainer.setBounds(x, y, width, height);
	this._appBounds = new DwtRectangle(x, y, width, height);
	
	// position the app container's children
	x = y = 0;
	var children = appContainer.getChildren();
	var num = children.length;
	for (var i = 0; i < num; i++) {
		var child = children[i];
		if (!child.getVisible())
			child.setVisible(true);
		var size = child.getSize();
		var childHeight = size.y || child.getHtmlElement().clientHeight;
		// last child gets the rest of the vertical space
		if (i == (num - 1))
			childHeight = Math.max(height - y, 0);
		DBG.println(AjxDebug.DBG3, "child " + i + ": " + x + '/' + y + '/' + width + '/' + childHeight);
		child.setBounds(x, y, width, childHeight);
		y += childHeight;
		if(!AjxEnv.isIE)
			y += ZaAppViewMgr.COMPONENT_SEPARATION;
	}
}

// Resizes the app container and its children.
ZaAppViewMgr.prototype._resizeView =
function(view, bds) {
	view.setBounds(bds.x, bds.y, bds.width, bds.height);
	var children = view.getChildren();
	for (var i = 0; i < children.length; i++) {
		var child = children[i];
		// children are positioned absolute
		child.setBounds(Dwt.DEFAULT, Dwt.DEFAULT, bds.width, bds.height);
	}
}

// Listeners

// Handles shell resizing event.
ZaAppViewMgr.prototype._shellControlListener =
function(ev) {
	if (ev.oldWidth != ev.newWidth || ev.oldHeight != ev.newHeight) {
		this._shellSz.x = ev.newWidth;;
		this._shellSz.y = ev.newHeight;
		this.layoutChanged(ZaAppViewMgr.RESIZE);
	}
}

// Handles sash movement. An attempt to move the sash beyond the extent of the overview 
// panel or the view results in no movement at all.
ZaAppViewMgr.prototype._sashCallback =
function(delta) {
	var absDelta = Math.abs(delta);
	var view = this._views[this._currentView];
	var viewBds = view.getBounds();
	var ovSize = this._overviewPanel.getSize();
	// make sure we aren't moving too far
	if ((delta < 0 && (absDelta >= ovSize.x)) || (delta > 0 && (absDelta >= viewBds.width)))
		return 0;
	this._resizeView(view, new DwtRectangle(viewBds.x + delta, Dwt.DEFAULT, viewBds.width - delta, Dwt.DEFAULT));
	this._overviewPanel.setSize(ovSize.x + delta, Dwt.DEFAULT);
	return delta;
}
