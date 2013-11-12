dojo.require("dojo.dom");
dojo.require("dojo.aspect");
dojo.require("dojo.on");
dojo.require("dojo.json");
dojo.require("dojo.parser");
dojo.require("dojo.mouse");
dojo.require("dojo.store.Memory");
dojo.require("dojo.store.Observable");
dojo.require("dojo.io.iframe");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.TabContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.tree.ObjectStoreModel");
dojo.require("dijit.Menu");
dojo.require("dijit.MenuItem");
dojo.require("dijit.MenuBar");
dojo.require("dijit.MenuBarItem");
dojo.require("dijit.PopupMenuBarItem");
dojo.require("dijit.TitlePane");
dojo.require("dijit.Toolbar");
dojo.require("dijit.Tree");
dojo.require("dijit.tree.dndSource");
dojo.require("dijit.registry");
dojo.require("dijit.form.Form");
dojo.require("dojo._base.lang");
dojo.require("dojox.grid.EnhancedGrid");
dojo.require("dojo.data.ItemFileWriteStore");
dojo.require("dojox.grid.cells.dijit");
dojo.require("dojox.layout.ContentPane");

//public
HAFlow.Main.prototype.initHdfsFileList = function() {
	var hdfsFileListContentPane = new dijit.layout.ContentPane({
		id : this.hdfsFileListContainerId,
		title : "HDFS"
	});
	this.ui.leadingContainer.addChild(hdfsFileListContentPane);
	this.initHdfsFileListStore();
	this.getHdfsFileList(this.rootPath);
	this.initHdfsFileListTree();
};

HAFlow.Main.prototype.initHdfsFileListStore = function() {
	this.hdfsFileListStore = new dojo.store.Observable(new dojo.store.Memory({
		data : [ {
			id : "root",
			name : "Root",
			isDirectory : true,
			path : this.rootPath,
			parentPath : null,
			type:null,
			time:null,
			size:null
		} ],
		getChildren : function(object) {
			return this.query({
				parentPath : object.path
			});
		}
	}));
};

HAFlow.Main.prototype.getHdfsFileList = function(path) {
	var _currentInstance = this;
	$.ajax({
		url : this.basePath + "hdfs/list",
		type : "GET",
		dataType : "json",
		data : {
			path : path
		},
		success : function(data, status) {
			_currentInstance.refreshHdfsFileList(_currentInstance, path, data);

		},
		error : function(request, status, error) {
			HAFlow.showDialog("Error",
					"An error occurred while loading flow list: " + error);
		}
	});
};

HAFlow.Main.prototype.initHdfsFileListTree = function() {
	var treeModel = new dijit.tree.ObjectStoreModel({
		store : this.hdfsFileListStore,
		query : {
			id : "root"
		},
		mayHaveChildren : function(item) {
			return item.isDirectory;
		}
	});

	var tree = new dijit.Tree({
		model : treeModel,
		dndController : dijit.tree.dndSource
	}, dojo.create("div", {
		id : this.hdfsFileListTreeId,
	}, this.hdfsFileListContainerId));
	var _currentInstance = this;
	dojo.aspect.around(this.hdfsFileListStore, "put", function(originalPut) {	
		return function(obj, options) {
			 if(options && options.parent){
				 if(options.parent.id!=obj.parentPath)
					 {
	                 obj.parentPath = options.parent.id;
	                 var frompath=obj.path;
	                 var topath=obj.parentPath+"/"+obj.name;
	                 var filename=obj.name;
	                 //TODO:
	                 var toitem=_currentInstance.hdfsFileListStore.query({
							path : obj.parentPath
						});
	                 var toisDerectory=toitem[0].isDirectory;
	                 if(toisDerectory==true)
	                	 {
		                 $.ajax({
			         			url : _currentInstance.basePath + "hdfs/movefile?frompath="+frompath+"&topath="+topath+"&filename="+filename,
			         			type : "GET",	       
			         			dataType : "json",
								contentType : "application/json",
								data : JSON.stringify({}),
			         			success : function(data, status) {
			         				if(data==true)
									HAFlow
									.showDialog(
											"Move",
											"Move success.");
			         				else
										HAFlow
										.showDialog(
												"Move",
												"Move failure.");
			         				},
			                 	error:function(e){
									HAFlow
											.showDialog(
													"Move",
													"Move failure.");
			                 	}
			                 	});
	                	 }
	                 else{
							HAFlow
							.showDialog(
									"Move",
									"Can't move to a file.");
	                 }
					 }
				 else
				 {
//					 flow.hdfsFileListStore.put({
//							id : obj.id,
//							name : obj.name,	                 
//							isDirectory : obj.directory,
//							path : obj.path,
//							parentPath : obj.parentPath
//						});
					 }
             }
			return originalPut.call(flow.hdfsFileListStore, obj, options);
		};
	});
	//TODO:
//	dojo.aspect.after(this.hdfsFileListStore, "put", function() {
//		if (dijit.byId(_currentInstance.hdfsFileListTreeId) != null) {
//			dijit.registry.remove(_currentInstance.hdfsFileListTreeId);
//		}
//		_currentInstance.getHdfsFileList(_currentInstance.rootPath);
//	});
	if (dijit.byId("treeMenu") != null) {
		dijit.registry.remove("treeMenu");
	}	
	this.menu.treeMenu = new dijit.Menu({
		id : "treeMenu",
		targetNodeIds : [ _currentInstance.hdfsFileListTreeId ],
		selector : ".dijitTreeNode"
	});
	if (dijit.byId("DownloadMenuItem") != null) {
		dijit.registry.remove("DownloadMenuItem");
	}
	this.menu.treeMenu.DownloadMenuItem = new dijit.MenuItem({
		id : "DownloadMenuItem",
		label : "Download from Hdfs"
	});
	if (dijit.byId("CreateMenuItem") != null) {
		dijit.registry.remove("CreateMenuItem");
	}
	this.menu.treeMenu.CreateMenuItem = new dijit.MenuItem({
		id : "CreateMenuItem",
		label : "Create new directory"
	});
	if (dijit.byId("DeleteMenuItem") != null) {
		dijit.registry.remove("DeleteMenuItem");
	}
	this.menu.treeMenu.DeleteMenuItem = new dijit.MenuItem({
		id : "DeleteMenuItem",
		label : "Delete"
	});
	if (dijit.byId("UploadMenuItem") != null) {
		dijit.registry.remove("UploadMenuItem");
	}
	this.menu.treeMenu.UploadMenuItem = new dijit.MenuItem({
		id : "UploadMenuItem",
		label : "Upload files to Hdfs"
	});
	if (dijit.byId("RenameMenuItem") != null) {
		dijit.registry.remove("RenameMenuItem");
	}
	this.menu.treeMenu.RenameMenuItem = new dijit.MenuItem({
		id : "RenameMenuItem",
		label : "Rename"
	});
	if (dijit.byId("RefreshMenuItem") != null) {
		dijit.registry.remove("RefreshMenuItem");
	}
	this.menu.treeMenu.RefreshMenuItem = new dijit.MenuItem({
		id : "RefreshMenuItem",
		label : "Refresh"
	});

	this.menu.treeMenu.addChild(this.menu.treeMenu.DownloadMenuItem);
	this.menu.treeMenu.addChild(this.menu.treeMenu.CreateMenuItem);
	this.menu.treeMenu.addChild(this.menu.treeMenu.DeleteMenuItem);
	this.menu.treeMenu.addChild(this.menu.treeMenu.UploadMenuItem);
	this.menu.treeMenu.addChild(this.menu.treeMenu.RenameMenuItem);
	this.menu.treeMenu.addChild(this.menu.treeMenu.RefreshMenuItem);

	dojo
			.connect(

					this.menu.treeMenu.UploadMenuItem,
					"onClick",
					function() {
						var tn = dijit.byNode(this.getParent().currentTarget);
						var path = tn.item.path;
						var isDirectory = tn.item.isDirectory;
						if (isDirectory == true) {
							var dialog = new dijit.Dialog(
									{
										title : "upload",
										content : "<form id=\"hdfsfilepath\" action=\"hdfs/upload\" enctype=\"multipart/form-data\" method=\"post\">"
												+ "<input type=\"file\" name=\"file\" id=\"file\" />"
												+ "<input type=\"hidden\" name=\"remotePath\" value="
												+ "\""
												+ path
												+ "\">"
												+ " <button type=\"button\" id=\"upload_btn\">submit</button></form><div id=\"debug\"><div>",
										style : "width:400px"
									});

							dialog.show();
							dojo.connect(dojo.byId("upload_btn"),"onclick",function(){
								var file=document.getElementById("file").files[0];
								var lastModifiedDate=file.lastModifiedDate;
								var size=file.size;
								var type=file.type;
							var filename = document.getElementById("file").value;
							var result=_currentInstance.hdfsFileListStore.query({path:path+"/"+filename});
							if(result.total==0)
								{
								dojo.io.iframe.send({
								    form: "hdfsfilepath", 								    
								    handleAs: "xml", 
								    url:_currentInstance.basePath+"/hdfs/upload?remotePath="+path,
								    load: function(response){
									    	var success = response.getElementsByTagName("success")[0].childNodes[0].nodeValue;
									    	var filename = response.getElementsByTagName("filename")[0].childNodes[0].nodeValue;
									    	if(success=="true")
									    		{
									    		HAFlow.showDialog("Upload", "Upload scceess.");
										    	_currentInstance.hdfsFileListStore.put({
										    		id:path+"/"+filename,
										    		name:filename,
										    		isDirectory:false,
										    		path:path+"/"+filename,
										    		parentPath:path,
										    		size:size,
										    		type:type,
										    		time:lastModifiedDate
										    	});	
									    		}								    		
									    	else
									    		HAFlow.showDialog("Upload", "Upload failure.");		
								    }, 
								    error: function(e){
										HAFlow.showDialog("Upload", "Upload failure.");
								    }
								});
								}
							else{
								HAFlow.showDialog("Upload", "File exits.");
							}
							dialog.destroy();
							});
							}else
							HAFlow.showDialog("Upload",
									"It's a file.Can't upload to it.");
					});
	dojo
			.connect(
					this.menu.treeMenu.DeleteMenuItem,
					"onClick",
					function() {
						var tn = dijit.byNode(this.getParent().currentTarget);
						var path = tn.item.path;
						var isDirectory = tn.item.isDirectory;
						var dialog = new dijit.Dialog(
								{
									id : "dialog_assure",
									title : "Delete",
									content : "<div>Are you sure to delete?<br><button type=\"button\" id=\"assure_btn\">Yes</button><button type=\"button\" id=\"cancel_btn\">No</button></br></div>",
									style : "width:200px"
								});
						dojo
								.connect(
										dojo.byId("assure_btn"),
										"onclick",
										function() {
											if (isDirectory == true)
												$
														.ajax({
															url : _currentInstance.basePath
																	+ "hdfs/deletedirectory?remotepath="
																	+ path,
															type : "GET",
															dataType : "json",
															contentType : "application/json",
															data : JSON
																	.stringify({}),
															success : function(
																	data,
																	status) {
																if (data.success = true) {
																	HAFlow
																			.showDialog(
																					"Remove HdfsFile Directory",
																					"HdfsFile Directory removed.");
																} else
																	HAFlow
																			.showDialog(
																					"Remove HdfsFile Directory",
																					"HdfsFile Directory can't be removed.");
																var file_item = _currentInstance.hdfsFileListStore
																		.query({
																			parentPath : path
																		});
																var i;
																for (i = 0; i < file_item.length; i++) {
																	_currentInstance.hdfsFileListStore
																			.remove(file_item[i].id);
																}
																var directory_item = _currentInstance.hdfsFileListStore
																		.query({
																			path : path
																		});
																_currentInstance.hdfsFileListStore
																		.remove(directory_item[0].id);
															},
															error : function(
																	request,
																	status,
																	error) {
																HAFlow
																		.showDialog(
																				"Error",
																				"An error occurred while removing HdfsFile Directory: "
																						+ error);
															}
														});
											else
												$
														.ajax({
															url : _currentInstance.basePath
																	+ "hdfs/deletefile?remotepath="
																	+ path,
															type : "GET",
															dataType : "json",
															contentType : "application/json",
															data : JSON
																	.stringify({}),
															success : function(
																	data,
																	status) {
																if (data.success = true) {
																	HAFlow
																			.showDialog(
																					"Remove HdfsFile",
																					"HdfsFile removed.");
																	if(dijit.byId("flowContainerPane_"+ path)!=null)
																	_currentInstance.ui.centerContainer
																			.removeChild(dijit
																					.byId("flowContainerPane_"
																							+ path));
																} else
																	HAFlow
																			.showDialog(
																					"Remove HdfsFile",
																					"HdfsFile can't be removed.");
																var item = _currentInstance.hdfsFileListStore
																		.query({
																			path : path
																		});
																_currentInstance.hdfsFileListStore
																		.remove(item[0].id);
															},
															error : function(
																	request,
																	status,
																	error) {
																HAFlow
																		.showDialog(
																				"Error",
																				"An error occurred while removing HdfsFile: "
																						+ error);
															}
														});
											dialog.destroy();
										});
						dojo.connect(dojo.byId("cancel_btn"), "onclick",
								function() {
									dialog.destroy();
								});
						dialog.show();
					});

	dojo
	.connect(
			//TODO:
			this.menu.treeMenu.CreateMenuItem,
			"onClick",
			function() {
				var tn = dijit.byNode(this.getParent().currentTarget);
				var path = tn.item.path;
				var isDirectory = tn.item.isDirectory;
				if (isDirectory == true) {
					var context="";
					context+="<html><body><form id=\"hdfsfilepath\" method=\"post\">";
					context+="new name:<input type=\"text\" id=\"directoryname\" name=\"directoryname\"> </input>";
					context+=" <button type=\"button\" id=\"create_btn\">submit</button></form></body></html>";
					var dialog = new dijit.Dialog(
							{
								title:"create new directory",
								content:context	
							});
					dialog.show();
					dojo
							.connect(
									dojo.byId("create_btn"),
									"onclick",
									function() {
										var directoryname = document
												.getElementById("directoryname").value;
										var result = _currentInstance.hdfsFileListStore
												.query({
													path : path
															+ "/"
															+ directoryname
												});
										if (result.total == 0) {
											$
													.ajax({
														url : _currentInstance.basePath
																+ "hdfs/createdirectory?remotepath="
																+ path
																+ "&directoryname="
																+ dojo
																		.byId("directoryname").value,
														type : "GET",
														dataType : "json",
														contentType : "application/json",
														data : JSON
																.stringify({}),
														success : function(
																data,
																status) {
															if (data.success = true) {
																HAFlow
																		.showDialog(
																				"Create HdfsFile Directory",
																				"HdfsFile Directory created.");
																_currentInstance.hdfsFileListStore
																		.put({
																			id : path
																					+ "/"
																					+ data.directoryname,
																			name : data.directoryname,
																			isDirectory : true,
																			path : path
																					+ "/"
																					+ data.directoryname,
																			parentPath : path,
																		});

															} else
																HAFlow
																		.showDialog(
																				"Create HdfsFile Directory",
																				"HdfsFile Directory can't be created.");
														},
														error : function(
																request,
																status,
																error) {
															HAFlow
																	.showDialog(
																			"Error",
																			"An error occurred while removing HdfsFile Directory: "
																					+ error);
														}
													});
										} else {
											HAFlow
													.showDialog(
															"Create HdfsFile Directory",
															"HdfsFile Directory exits.");
										}
										dialog.destroy();

									});
				} else {
					HAFlow
							.showDialog("Create HdfsFile Directory",
									"It's a file.HdfsFile Directory can't be created in it.");
				}

			});
	dojo.connect(
			this.menu.treeMenu.DownloadMenuItem,
			"onClick",
			function() {
				var tn = dijit.byNode(this.getParent().currentTarget);
				var path=tn.item.path;
				var name=tn.item.name;
				var isDirectory=tn.item.isDirectory;
				if(isDirectory==false)
				{
			       var form = $("<form>");   

			       form.attr('style','display:none');   
			       form.attr('target','');

			       form.attr('method','post');

			       form.attr('action',"/haflow/hdfs/download");

			       form.attr('id',"form1");

			       var input1 = $('<input>'); 
			       input1.attr('id','input1'); 

			       input1.attr('type','hidden'); 

			       input1.attr('name','remotepath'); 

			       input1.attr('value',path); 

			       var input2 = $('<input>'); 

			       input2.attr('type','hidden'); 

			       input2.attr('name','filename'); 

			       input2.attr('value',name); 

			       $('body').append(form);  

			       form.append(input1);   
			       form.append(input2); 
			       form.submit();   
					$("#form1").ajaxForm(function(){
						HAFlow.showDialog("Download", "Succeed to download it.");
					});
		} else {

			HAFlow
					.showDialog("Download",
							"It's a directory.Can't download it.");
		}
	});

	dojo
			.connect(
					this.menu.treeMenu.RenameMenuItem,
					"onClick",
					function() {
						if (dijit.byId("newname_btn") != null) {
							dijit.registry.remove("newname_btn");
						}
						if (dijit.byId("newname") != null) {
							dijit.registry.remove("newname");
						}
						var renamedialog = new dijit.Dialog(
								{
									title : "Rename",
									content : "<html><body><form id=\"rename\" method=\"post\">"
											+ "new name:<input type=\"text\" id=\"newname\" name=\"newname\"> </input>"
											+ " <button type=\"button\" id=\"newname_btn\">submit</button></form></body></html>"
								});
						renamedialog.show();
						var tn = dijit.byNode(this.getParent().currentTarget);
						var path = tn.item.path;
						var parentpath = tn.item.parentPath;
						dojo
								.connect(
										dojo.byId("newname_btn"),
										"onclick",
										function() {
											var newname = document
													.getElementById("newname").value;
											if (newname != null) {
												var result = _currentInstance.hdfsFileListStore
														.query({
															path : path + "/"
																	+ newname
														});
												var newpath = parentpath + "/"
														+ newname;
												if (result.total == 0) {
													$
															.ajax({
																url : _currentInstance.basePath
																		+ "hdfs/rename?path="
																		+ path
																		+ "&newpath="
																		+ newpath,
																type : "GET",
																dataType : "json",
																contentType : "application/json",
																data : JSON
																		.stringify({}),
																success : function(
																		data,
																		status) {
																	if (data.success = true) {
																		HAFlow
																				.showDialog(
																						"Rename",
																						"Succeed to rename.");
																		var newparentpath = parentpath;
																		var items = _currentInstance.hdfsFileListStore
																				.query({
																					path : path
																				});
																		var newhfdname = newname;
																		var child = items[0];
																		_currentInstance
																				.changepath(
																						_currentInstance,
																						child,
																						newparentpath,
																						newhfdname);
																	} else {
																		HAFlow
																				.showDialog(
																						"Rename",
																						"Can't rename.");
																	}
																},
																error : function(
																		request,
																		status,
																		error) {
																	HAFlow
																			.showDialog(
																					"Error",
																					"An error occurred while renaming: "
																							+ error);
																}
															});
												} else {
													HAFlow.showDialog("Rename",
															"It exits.");
												}
											}
											renamedialog.destroy();
										});
					});
	dojo
	.connect(
			this.menu.treeMenu.RefreshMenuItem,
			"onClick",
			function() {
				if (dijit.byId(_currentInstance.hdfsFileListTreeId) != null) {
					dijit.registry.remove(_currentInstance.hdfsFileListTreeId);
				}
				_currentInstance.getHdfsFileList(_currentInstance.rootPath);
			});

	this.menu.treeMenu.startup();
	tree.on("click", function(item) {
		if (item.directory =="true") {

		} else {
			hdfspath=item.path;
			var information=[];
			information.name=item.name;
			information.path=item.path;
			information.size=item.size;
			information.time=item.time;
			_currentInstance.onFileClicked(_currentInstance, information);
		}
	}, true);
	var picture = new RegExp("^[A-Za-z0-9_]*\.jpg$");
	var text = new RegExp("^[A-Za-z0-9_]*\.(txt|ini)$");
	var csv=new RegExp("^[A-Za-z0-9_-]*\.csv$");
	tree
			.on(
					"dblclick",
					function(item) {
						if (item.isDirectory == true) {

						} else {
							if (picture.test(item.name)) {
								_currentInstance.getHdfsPicture(
										item.parentPath, item.name);
							} else if (text.test(item.name)) {
								var url = item.parentPath+ "/" + item.name;
								if (dijit
										.byId("flowContainerPane_"
												+ url) == null) {
									_currentInstance
											.getHdfsFile(
													item.parentPath,
													item.name);
								} else {
									_currentInstance.ui.centerContainer
											.removeChild(dijit
													.byId("flowContainerPane_"
															+ url));
									dijit.registry
											.remove("flowContainerPane_"
													+ url);
									_currentInstance
											.getHdfsFile(
													item.parentPath,
													item.name);
								}
							}
							else if(csv.test(item.name))
								{
								_currentInstance.getHdfsCsv(
										item.parentPath, item.name);
								}

							else
								HAFlow
										.showDialog("Read file",
												"Can't read it.");
						}
					}, true);

	tree.startup();
};


// HDFS operation
HAFlow.Main.prototype.getHdfsFile = function(path, fileName) {
	var _currentInstance = this;
	var url = path + "/" + fileName;
	$.ajax({
		url : this.basePath + "hdfs/file",
		type : "GET",
		dataType : "json",
		data : {
			path : path,
			fileName : fileName
		},
		success : function(data, status) {
			var content = data.content;
			content = content.replace(/\r\n/ig, "<br>");
			var length = content.split("<br>").length;
			if(length<100)
				{
				var contentPane = new dijit.layout.ContentPane({
					id : "flowContainerPane_" + url,
					title : fileName,
					content : "<div id=\"flowContainer_" + url + "\">"
							+ content + "</div>",
					closable : true,
					onClose : function() {
						dijit.registry.remove("flowContainerPane_" + url);
						return true;
					}
				});
				watchHandle.unwatch();
				_currentInstance.ui.centerContainer.addChild(contentPane);
				
				_currentInstance.ui.centerContainer.selectChild(dijit
						.byId("flowContainerPane_" + url));
				}
			else
				{
				if (dijit.byId("setreadline") != null) {
					dijit.registry.remove("setreadline");
				}
				if (dojo.byId("setreadline_btn") != null) {
					dijit.registry.remove("setreadline_btn");
				}
				if (dojo.byId("start") != null) {
					dijit.registry.remove("start");
				}
				var setreadlinedialog = new dijit.Dialog(
						{
							id:"setreadline",
							title : "Set Read Line",
							content : "<html><body><form id=\"setreadline\" method=\"post\">"
									+ "start with line:<input type=\"text\" id=\"start\" name=\"newname\"> </input>"
									+ " <button type=\"button\" id=\"setreadline_btn\">submit</button></form></body></html>"
						});
				setreadlinedialog.show();
				dojo
						.connect(
								dojo.byId("setreadline_btn"),
								"onclick",
								function() {
									var startline = document.getElementById("start").value - 1;
									if (length < startline)
										HAFlow.showDialog("Error", "It has only " + length + "line!");
									else {
										var tmp = content;
										var count = 0;
										for ( var i = 0; i < startline; i++) {
											var start = tmp.indexOf("<br>");
											tmp = tmp.slice(start + 4);
										}
										content = tmp;
										if (length - startline + 1 > 100) {
											for ( var i = 0; i < 100; i++) {
												var start = tmp.indexOf("<br>");
												tmp = tmp.slice(start + 4);
												count = start + count + 4;
											}
											content = content.substring(0, count);
										}
										var contentPane = new dijit.layout.ContentPane({
											id : "flowContainerPane_" + url,
											title : fileName,
											content : "<div id=\"flowContainer_" + url + "\">"
													+ content + "</div>",
											closable : true,
											onClose : function() {
												dijit.registry.remove("flowContainerPane_" + url);
												return true;
											}
										});
										watchHandle.unwatch();
										_currentInstance.ui.centerContainer.addChild(contentPane);
										
										_currentInstance.ui.centerContainer.selectChild(dijit
												.byId("flowContainerPane_" + url));
									}
									setreadlinedialog.destroy();
									});
				}

		},
		error : function(request, status, error) {
			HAFlow.showDialog("Error",
					"An error occurred while reading hdfs file: " + error);
		}
	});
};

HAFlow.Main.prototype.getHdfsPicture = function(path, fileName) {
	var url = this.basePath + "hdfs/picture" + "?path=" + path + "&fileName="
			+ fileName;
	if (dijit.byId("flowContainerPane_"+ path + "/" + fileName) == null) {
		var text = "";
		text += "<div id=\"flowContainer_" + url + "\"><img src=\"" + url
				+ "\"/>";
		text += "</div>";
		var contentPane = new dijit.layout.ContentPane({
			id : "flowContainerPane_" + path + "/" + fileName,
			title : fileName,
			content : text,
			closable : true,
			onClose : function() {
				dijit.registry.remove("flowContainerPane_" + path + "/"
						+ fileName);
				return true;
			}
		});
		this.ui.centerContainer.addChild(contentPane);
		watchHandle.unwatch();
		this.ui.centerContainer.selectChild(dijit.byId("flowContainerPane_"
				+ path + "/" + fileName));
	} else
		this.ui.centerContainer.selectChild(dijit.byId("flowContainerPane_"
				+ path + "/" + fileName));
};

HAFlow.Main.prototype.getHdfsCsv = function(path, fileName) {
	var _currentInstance = this;
	var url = this.basePath + "hdfs/cvs_file" + "?path=" + path + "/"
			+ fileName;
	$.ajax({
		url : url,
		type : "GET",
		dataType : "html",
		success : function(data, status) {
			var data_list=JSON.parse(data);
			var length=eval(data_list)[0]["length"];
			var table = "<table border=\"1\" class=\"csvtable\" >";
			table+="<tr class=\"csvtr\">";
			for(var i=0;i<length;i++)
				table+="<th class=\"cvstd\">"+eval(data_list)[1][i]+"</th>";
			table+="</tr>";
			for(var line=2;line<data_list.length;line++)
				{
				table+="<tr>";
				for(var i=0;i<length;i++)
					table+="<td class=\"cvstd\">"+eval(data_list)[line][eval(data_list)[1][i]]+"</td>";
				table+="</tr>";
				}
			table += "</table>";
			if(dijit.byId("flowContainerPane_" + path + "/"+ fileName)!=null)
				{
				watchHandle.unwatch();
				_currentInstance.ui.centerContainer.selectChild(dijit.byId("flowContainerPane_"
						+ path + "/" + fileName));
				}
			else{
				var contentPane = new  dojox.layout.ContentPane(
						{
							id : "flowContainerPane_" + path + "/"+ fileName,
							title : fileName,
							content : table,
							closable : true,
							onClose : function() {
								dijit.registry.remove("flowContainerPane_" + path + "/"+ fileName);
								return true;
							}
						
						});
//				contentPane.setHref(url);
				_currentInstance.ui.centerContainer.addChild(contentPane);
				watchHandle.unwatch();
				_currentInstance.ui.centerContainer.selectChild(dijit.byId("flowContainerPane_"
						+ path + "/" + fileName));
			}
		},
/*		success :function(rawdata, status) {
			
			console.log(rawdata);
			var text = "";
			text += "<div id=\"gridDiv\">";
			<div id="gridContainer"><div hidefocus="hidefocus" role="grid" dojoattachevent="onmouseout:_mouseOut" tabindex="0" aria-multiselectable="true" class="dojoxGrid" id="grid" align="left" widgetid="grid" aria-readonly="true" style="height: 420px; -webkit-user-select: none;">
			<div class="dojoxGridMasterHeader" dojoattachpoint="viewsHeaderNode" role="presentation" style="display: block; height: 40px;"><div class="dojoxGridHeader" dojoattachpoint="headerNode" role="presentation" style="width: 1044px; left: 1px; top: 0px;">
				<div dojoattachpoint="headerNodeContainer" style="width:9000em" role="presentation">
					<div dojoattachpoint="headerContentNode" role="row"><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><th tabindex="-1" aria-readonly="true" role="columnheader" id="gridHdr0" class="dojoxGridCell dojoDndItem" idx="0" style="width:6em;" dndtype="gridColumn_grid"><div class="dojoxGridSortNode">Index(1)</div></th><th tabindex="-1" aria-readonly="true" role="columnheader" id="gridHdr1" class="dojoxGridCell dojoDndItem" idx="1" style="width:6em;" dndtype="gridColumn_grid"><div class="dojoxGridSortNode">Genre(2)</div></th><th tabindex="-1" aria-readonly="true" role="columnheader" id="gridHdr2" class="dojoxGridCell dojoDndItem" idx="2" style="width:6em;" dndtype="gridColumn_grid"><div class="dojoxGridSortNode">Artist(3)</div></th><th tabindex="-1" aria-readonly="true" role="columnheader" id="gridHdr3" class="dojoxGridCell dojoDndItem" idx="3" style="width:6em;" dndtype="gridColumn_grid"><div class="dojoxGridSortNode">Year(4)</div></th><th tabindex="-1" aria-readonly="true" role="columnheader" id="gridHdr4" class="dojoxGridCell dojoDndItem" idx="4" style="width:6em;" dndtype="gridColumn_grid"><div class="dojoxGridSortNode">Album(5)</div></th><th tabindex="-1" aria-readonly="true" role="columnheader" id="gridHdr5" class="dojoxGridCell dojoDndItem " idx="5" style="width:6em;" dndtype="gridColumn_grid"><div class="dojoxGridSortNode">Name(6)</div></th><th tabindex="-1" aria-readonly="true" role="columnheader" id="gridHdr6" class="dojoxGridCell dojoDndItem" idx="6" style="width:6em;" dndtype="gridColumn_grid"><div class="dojoxGridSortNode">Length(7)</div></th><th tabindex="-1" aria-readonly="true" role="columnheader" id="gridHdr7" class="dojoxGridCell dojoDndItem " idx="7" style="width:6em;" dndtype="gridColumn_grid"><div class="dojoxGridSortNode">Track(8)</div></th><th tabindex="-1" aria-readonly="true" role="columnheader" id="gridHdr8" class="dojoxGridCell dojoDndItem" idx="8" style="width:6em;" dndtype="gridColumn_grid"><div class="dojoxGridSortNode">Composer(9)</div></th><th tabindex="-1" aria-readonly="true" role="columnheader" id="gridHdr9" class="dojoxGridCell dojoDndItem" idx="9" style="width:6em;" dndtype="gridColumn_grid"><div class="dojoxGridSortNode">Download Date(10)</div></th><th tabindex="-1" aria-readonly="true" role="columnheader" id="gridHdr10" class="dojoxGridCell dojoDndItem" idx="10" style="width:6em;" dndtype="gridColumn_grid"><div class="dojoxGridSortNode">Last Played(11)</div></th></tr></tbody></table></div>
				</div>
			</div></div>
			<div class="dojoxGridMasterView" dojoattachpoint="viewsNode" role="presentation"><div class="dojoxGridView" role="presentation" id="dojox_grid__View_25" widgetid="dojox_grid__View_25" style="width: 1044px; height: 378px; left: 1px; top: 0px;">
			
			<input type="checkbox" class="dojoxGridHiddenFocus" dojoattachpoint="hiddenFocusNode" role="presentation">
			<input type="checkbox" class="dojoxGridHiddenFocus" role="presentation">
			<div class="dojoxGridScrollbox" dojoattachpoint="scrollboxNode" role="presentation" style="height: 378px;">
				<div class="dojoxGridContent" dojoattachpoint="contentNode" hidefocus="hidefocus" role="presentation" style="height: 6790px; width: 1027px;"><div role="presentation" style="position: absolute; left: 0px; top: 0px;"><div class="dojoxGridRow" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">1</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="1" style="width:6em;">Easy Listening</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="2" style="width:6em;">Bette Midler</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="3" style="width:6em;">2003</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="4" style="width:6em;">Bette Midler Sings the Rosemary Clooney Songbook</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="5" style="width:6em;">Hey There</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="6" style="width:6em;">03:31</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">4</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="8" style="width:6em;">Ross, Jerry 1926-1956 -w Adler, Richard 1921-</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="9" style="width:6em;">1923/4/9</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="10" style="width:6em;">04:32:49</td></tr></tbody></table></div><div class="dojoxGridRow dojoxGridRowOdd" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">2</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="1" style="width:6em;">Classic Rock</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="2" style="width:6em;">Jimi Hendrix</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="3" style="width:6em;">1993</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="4" style="width:6em;">Are You Experienced</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Love Or Confusion</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="6" style="width:6em;">03:15</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">4</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="8" style="width:6em;">Jimi Hendrix</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="9" style="width:6em;">1947/12/6</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="10" style="width:6em;">03:47:49</td></tr></tbody></table></div><div class="dojoxGridRow" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="0" style="width:6em;">3</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="1" style="width:6em;">Jazz</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="2" style="width:6em;">Andy Narell</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="3" style="width:6em;">1992</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="4" style="width:6em;">Down the Road</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="5" style="width:6em;">Sugar Street</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="6" style="width:6em;">07:00</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="7" style="width:6em;">8</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">Andy Narell</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="9" style="width:6em;">1906/3/22</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">21:56:15</td></tr></tbody></table></div><div class="dojoxGridRow dojoxGridRowOdd" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="0" style="width:6em;">4</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Progressive Rock</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="2" style="width:6em;">Emerson, Lake &amp; Palmer</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="3" style="width:6em;">1992</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="4" style="width:6em;">The Atlantic Years</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="5" style="width:6em;">Tarkus</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="6" style="width:6em;">20:40</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="7" style="width:6em;">5</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">Greg Lake/Keith Emerson</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="9" style="width:6em;">1994/11/29</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">03:25:19</td></tr></tbody></table></div><div class="dojoxGridRow" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">5</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Rock</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="2" style="width:6em;">Blood, Sweat &amp; Tears</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="3" style="width:6em;">1968</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="4" style="width:6em;">Child Is Father To The Man</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="5" style="width:6em;">Somethin' Goin' On</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="6" style="width:6em;">08:00</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="7" style="width:6em;">9</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="8" style="width:6em;"></td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">1973/9/11</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="10" style="width:6em;">19:49:41</td></tr></tbody></table></div></div><div role="presentation" style="position: absolute; left: 0px; top: 265px;"><div class="dojoxGridRow dojoxGridRowOdd" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">6</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Jazz</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Andy Narell</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="3" style="width:6em;">1989</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="4" style="width:6em;">Little Secrets</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="5" style="width:6em;">Armchair Psychology</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="6" style="width:6em;">08:20</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">5</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="8" style="width:6em;">Andy Narell</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">2010/4/15</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="10" style="width:6em;">01:13:08</td></tr></tbody></table></div><div class="dojoxGridRow" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">7</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Easy Listening</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Frank Sinatra</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="3" style="width:6em;">1991</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="4" style="width:6em;">Sinatra Reprise: The Very Good Years</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="5" style="width:6em;">Luck Be A Lady</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="6" style="width:6em;">05:16</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="7" style="width:6em;">4</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">F. Loesser</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="9" style="width:6em;">2035/4/12</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="10" style="width:6em;">06:16:53</td></tr></tbody></table></div><div class="dojoxGridRow dojoxGridRowOdd" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">8</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Progressive Rock</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Dixie dregs</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="3" style="width:6em;">1977</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="4" style="width:6em;">Free Fall</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Sleep</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="6" style="width:6em;">01:58</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">6</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">Steve Morse</td><td tabindex="-1" role="gridcell" class="dojoxGridCell" idx="9" style="width:6em;">2032/11/21</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">08:23:26</td></tr></tbody></table></div><div class="dojoxGridRow" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">9</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Easy Listening</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Bette Midler</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="3" style="width:6em;">2003</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="4" style="width:6em;">Bette Midler Sings the Rosemary Clooney Songbook</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Hey There</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="6" style="width:6em;">03:31</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">4</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">Ross, Jerry 1926-1956 -w Adler, Richard 1921-</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">1923/4/9</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">04:32:49</td></tr></tbody></table></div><div class="dojoxGridRow dojoxGridRowOdd" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">10</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Classic Rock</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Jimi Hendrix</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="3" style="width:6em;">1993</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="4" style="width:6em;">Are You Experienced</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Love Or Confusion</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="6" style="width:6em;">03:15</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">4</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">Jimi Hendrix</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">1947/12/6</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">03:47:49</td></tr></tbody></table></div></div><div role="presentation" style="position: absolute; left: 0px; top: 530px;"><div class="dojoxGridRow" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">11</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Jazz</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Andy Narell</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="3" style="width:6em;">1992</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="4" style="width:6em;">Down the Road</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Sugar Street</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="6" style="width:6em;">07:00</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">8</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">Andy Narell</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">1906/3/22</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">21:56:15</td></tr></tbody></table></div><div class="dojoxGridRow dojoxGridRowOdd" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">12</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Progressive Rock</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Emerson, Lake &amp; Palmer</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="3" style="width:6em;">1992</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="4" style="width:6em;">The Atlantic Years</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Tarkus</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="6" style="width:6em;">20:40</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">5</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">Greg Lake/Keith Emerson</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">1994/11/29</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">03:25:19</td></tr></tbody></table></div><div class="dojoxGridRow" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">13</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Rock</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Blood, Sweat &amp; Tears</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="3" style="width:6em;">1968</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="4" style="width:6em;">Child Is Father To The Man</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Somethin' Goin' On</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="6" style="width:6em;">08:00</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">9</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;"></td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">1973/9/11</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">19:49:41</td></tr></tbody></table></div><div class="dojoxGridRow dojoxGridRowOdd" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">14</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Jazz</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Andy Narell</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="3" style="width:6em;">1989</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="4" style="width:6em;">Little Secrets</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Armchair Psychology</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="6" style="width:6em;">08:20</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">5</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">Andy Narell</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">2010/4/15</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">01:13:08</td></tr></tbody></table></div><div class="dojoxGridRow" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">15</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Easy Listening</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Frank Sinatra</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="3" style="width:6em;">1991</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="4" style="width:6em;">Sinatra Reprise: The Very Good Years</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Luck Be A Lady</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="6" style="width:6em;">05:16</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">4</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">F. Loesser</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">2035/4/12</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">06:16:53</td></tr></tbody></table></div></div><div role="presentation" style="position: absolute; left: 0px; top: 780px;"><div class="dojoxGridRow dojoxGridRowOdd" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">16</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Progressive Rock</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Dixie dregs</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="3" style="width:6em;">1977</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="4" style="width:6em;">Free Fall</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Sleep</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="6" style="width:6em;">01:58</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">6</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">Steve Morse</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">2032/11/21</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">08:23:26</td></tr></tbody></table></div><div class="dojoxGridRow" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">17</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Easy Listening</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Bette Midler</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="3" style="width:6em;">2003</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="4" style="width:6em;">Bette Midler Sings the Rosemary Clooney Songbook</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Hey There</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="6" style="width:6em;">03:31</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">4</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">Ross, Jerry 1926-1956 -w Adler, Richard 1921-</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">1923/4/9</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">04:32:49</td></tr></tbody></table></div><div class="dojoxGridRow dojoxGridRowOdd" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">18</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Classic Rock</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Jimi Hendrix</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="3" style="width:6em;">1993</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="4" style="width:6em;">Are You Experienced</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Love Or Confusion</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="6" style="width:6em;">03:15</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">4</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">Jimi Hendrix</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">1947/12/6</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">03:47:49</td></tr></tbody></table></div><div class="dojoxGridRow" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">19</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Jazz</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Andy Narell</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="3" style="width:6em;">1992</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="4" style="width:6em;">Down the Road</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Sugar Street</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="6" style="width:6em;">07:00</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">8</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">Andy Narell</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">1906/3/22</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">21:56:15</td></tr></tbody></table></div><div class="dojoxGridRow dojoxGridRowOdd" role="row" aria-selected="false" style=""><table class="dojoxGridRowTable" border="0" cellspacing="0" cellpadding="0" role="presentation"><tbody><tr><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="0" style="width:6em;">20</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="1" style="width:6em;">Progressive Rock</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="2" style="width:6em;">Emerson, Lake &amp; Palmer</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="3" style="width:6em;">1992</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="4" style="width:6em;">The Atlantic Years</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="5" style="width:6em;">Tarkus</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="6" style="width:6em;">20:40</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="7" style="width:6em;">5</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="8" style="width:6em;">Greg Lake/Keith Emerson</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="9" style="width:6em;">1994/11/29</td><td tabindex="-1" role="gridcell" class="dojoxGridCell " idx="10" style="width:6em;">03:25:19</td></tr></tbody></table></div></div></div>
			</div>
		</div></div>
			<div class="dojoxGridMasterMessages" style="display: none;" dojoattachpoint="messagesNode"></div>
			text += "</div>";
			var contentPane = new dijit.layout.ContentPane({
				id : "flowContainerPane_" + path + "/"+ fileName,
				region:"center",
				title : fileName,
				content : text,
				closable : true,
				onClose : function() {
					dijit.registry.remove("flowContainerPane_" + path + "/"+ fileName);
					return true;
				}
			});
			_currentInstance.ui.centerContainer.addChild(contentPane);
			watchHandle.unwatch();
			_currentInstance.ui.centerContainer.selectChild(dijit.byId("flowContainerPane_"
					+ path + "/" + fileName));
			var data = {
					identifier : "id",
					items : []
				};
//				var data_list=JSON.parse(rawdata);
			var data_list=rawdata;
		        for(var i = 2 ; i < data_list.length; i++){
		          data.items.push(dojo._base.lang.mixin({ id: i+1 }, data_list[i]));		        
		        }
				var store = new dojo.data.ItemFileWriteStore({
					data : data	
				});
		    var length=eval(data_list)[0]["length"];
			var layout=[];
			for(i=0;i<length;i++)
				{
				layout.push({
					'name' :eval(data_list)[1][i],
					'field' : eval(data_list)[1][i],
					'width' : '60px',
					type : dojox.grid.cells.CheckBox,
					styles : 'text-align: center;'
				});
				}

				var grid = new dojox.grid.EnhancedGrid({
					id : 'grid',
					store : store,
					structure : layout,
					rowSelector : '20px'
				},document.createElement('div'));

				grid.placeAt("gridDiv");
				grid.startup();
				var griddiv = document.getElementById("gridDiv");
				var html = griddiv.innerHTML;
				console.log('grid div content');
				console.log(html);
	

		},*/
		error : function(request, status, error) {
			HAFlow.showDialog("Error",
					"An error occurred while reading hdfs file: " + error);
		}
	});
	
};

HAFlow.Main.prototype.refreshHdfsFileList = function(instance, parentPath, data) {
	var i;
//	signal.remove();
	//TODO:
	for (i = 0; i < data.files.length; i++) {
		this.hdfsFileListStore.put({
			id : parentPath + "/" + data.files[i].name,
			name : data.files[i].name,
			isDirectory : data.files[i].directory,
			path : parentPath + "/" + data.files[i].name,
			parentPath : parentPath,
//			type:data.files[i].type,
			size:data.files[i].length,
			time:data.files[i].time
		});
		if (data.files[i].directory) {
			instance.getHdfsFileList(parentPath + "/" + data.files[i].name);
		}
	}
};

HAFlow.Main.prototype.changepath = function(instance, child, newparentpath,
		newhfdname) {
	instance.hdfsFileListStore.put({
		id : newparentpath + "/" + newhfdname,
		name : newhfdname,
		isDirectory : child.isDirectory,
		path : newparentpath + "/" + newhfdname,
		parentPath : newparentpath,
	});
	var tmp = newparentpath + "/" + newhfdname;
	var newparentpath = tmp;
	var items = instance.hdfsFileListStore.query({
		parentPath : child.path
	});
	if (child.isDirectory == true) {
		for ( var i = 0; i < items.total; i++) {
			var childitem = items[i];
			var newhfdname = childitem.name;
			instance.changepath(instance, childitem, newparentpath, newhfdname);
		}
	}
	instance.hdfsFileListStore.remove(child.id);
};

HAFlow.Main.prototype.onFileClicked = function(instance,fileInformation) {
	var text = "";
	text+="<table border=\"0\">";
	text+="<tr style=\"tr\"><th align=\"left\">Name</th><td>"+ fileInformation.name +"</td></tr>";
	text+="<tr style=\"tr\"><th align=\"left\">Path</th><td>"+ fileInformation.path+"</td></tr>";
	text+="<tr style=\"tr\"><th align=\"left\">Update Time</th><td>"+ fileInformation.time +"</td></tr>";
	text+="<tr style=\"tr\"><th align=\"left\">Size</th><td>"+ fileInformation.size +"B</td></tr>";
	text+="</table>";
	$("#" + instance.informationContainerId).html(text);
};

//TODO for now not used
HAFlow.Main.prototype.onCloseTab_hdfs = function(instance) {
	this.id.replace("flowContainerPane_", "");
};