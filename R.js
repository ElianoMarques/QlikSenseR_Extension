define(["jquery", "text!./R.css","./opencpu-0.4","./highcharts"
], function($, cssContent) {'use strict';
	$("<style>").html(cssContent).appendTo("head");
	return {
		initialProperties : {
			version: 1.0,
			qHyperCubeDef : {
				qDimensions : [],
				qMeasures : [],
				qInitialDataFetch : [{
					qWidth : 10,
					qHeight : 250
				}]
			}
		},
		definition : {
			type : "items",
			component : "accordion",
			items : {
				dimensions : {
					uses : "dimensions",
					min : 1
				},
				measures : {
					uses : "measures",
					min : 0
				},
				sorting : {
					uses : "sorting"
				},
				settings : {
					uses : "settings",
					items : {
						initFetchRows : {
							ref : "qHyperCubeDef.qInitialDataFetch.0.qHeight",
							label : "Initial fetch rows",
							type : "number",
							defaultValue : 250
						},
					 customStringProp: {
						label: "R Code",
						type: "string",
						ref: "RCode",
						defaultValue: 'rnorm(100)',
						expression: "always"
						},
						customStringProp2: {
						label: "Data Label",
						type: "string",
						ref: "Data2R",
						defaultValue: 'Data2R',
						expression: "always"
						},
						customStringProp3: {
						label: "Data path",
						type: "string",
						ref: "DataPath",
						defaultValue: "C://DemoQlikR//",
						expression: "always"
						},
						customStringProp4: {
						label: "R Server",
						type: "string",
						ref: "RServer",
						defaultValue: 'http://localhost:5742/ocpu/library/ModellingUtils/R',
						expression: ""
						},
						customStringProp5: {
						label: "R Output",
						type: "string",
						component: "dropdown",
						ref: "ROutput",
						options: [ {
							value: "p",
							label: "Plot"
						}, {
							value: "t",
							label: "Table"
						},{
							value: "b",
							label: "Both"
						}],
						defaultValue: 't',
						expression: ""
						},
					}
				}
			}
		},
		snapshot : {
			canTakeSnapshot : true
		},
		paint : function($element,layout) {
		//Parameters to pass to the options
		var divGeneral='GeneralOutputs';
		var  routput=layout.ROutput; 
		if(routput=='t') {var divName='ROutputsTable';}  else {if(routput=='p') {var divName='ROutputsPlot';} else {var divName='ROutputsHC';}}; 
		var data=layout.Data2R;
		var path= layout.DataPath;
		var RServer= layout.RServer;
		var RCode= layout.RCode;
		
		
		var DataObj = "<table><thead><tr>", self = this, lastrow = 0;
			//render titles
			$.each(this.backendApi.getDimensionInfos(), function(key, value) {
				DataObj += '<th>' + value.qFallbackTitle + '</th>';
			});
			$.each(this.backendApi.getMeasureInfos(), function(key, value) {
				DataObj += '<th>' + value.qFallbackTitle + '</th>';
			});
			DataObj += "</tr></thead><tbody>";
			//render data
			this.backendApi.eachDataRow(function(rownum, row) {
				lastrow = rownum;
				DataObj += '<tr>';
				$.each(row, function(key, cell) {
					if(cell.qIsOtherCell) {
						cell.qText = self.backendApi.getDimensionInfos()[key].othersLabel;
					}
					DataObj += '<td';
					//if(!isNaN(cell.qNum)) {
						//DataObj += " class='numeric'";
					//}
					DataObj += '>' + cell.qText + '</td>';
				});
				DataObj += '</tr>';
			});
			DataObj += "</tbody></table>";
			
			     function postData(RServer) {			
				document.getElementById(divName).innerHTML = 'Trying to run R';
				ocpu.seturl(RServer);
                var req = ocpu.call("QlikFunction_ReadRCode", {
				RCode: RCode,
				data: data,
				path: path
				}, function(session) {
					session.getObject(function(data){
					var GetResults=data;
					document.getElementById(divName).innerHTML = GetResults; });
				});
				 //Second row of the table with timestamp. To do the table
				req.fail(function() {
										var response= "R returned an error: " + req.responseText;
										document.getElementById(divName).innerHTML = response;
										});
	
			}
			
			function postDataPlot(RServer) {		
				document.getElementById(divName).innerHTML = 'Trying to run R';
				ocpu.seturl(RServer);
                var req = $("#"+divName).rplot("QlikFunction_ReadRCode", {
				RCode: RCode,
				data: data,
				path: path
				});
				 //Second row of the table with timestamp. To do the table
				req.fail(function() {
										var response= "R returned an error: " + req.responseText;
										document.getElementById(divName).innerHTML = response;
										});		
			}
			
			function postDataHTML(RServer,path) {		
				 document.getElementById(divName).innerHTML = 'Trying to load Highcharts';
				 $element.html( divExt );
				 //alert(divName);
				$("#ROutputsHC").highcharts({
				chart: {
				type: 'bar'
				},
				title: {
				text: 'Fruit Consumption'
				},
				xAxis: {
				categories: ['Apples', 'Bananas', 'Oranges']
				},
				yAxis: {
				title: {
                text: 'Fruit eaten'
				}
				},
				series: [{
				name: 'Jane',
				data: [1, 0, 4]
				}, {
				name: 'John',
				data: [5, 7, 3]
				}]
				});
			}

		function exportData(data, path, DataObj){
			 document.getElementById(divName).innerHTML = 'Trying to export';
			 ocpu.seturl(RServer);
                var req = ocpu.call("QlikFunction_LoadData", { 
				data: data,
				path: path,
				DataObj: DataObj
				}, function(session) {
				});
				req.fail(function() {
										var response= "R returned an error reading the data: " + req.responseText;
										document.getElementById(divName).innerHTML = response;										
										
										//add stoping clause or other postDate(RServer) only if this has a success									
										});
				req.done(function() {
										var response = "R loaded the data successfully";
										document.getElementById(divName).innerHTML = response;
										if(routput=='t') {postData(RServer);} 
											else {
													if(routput=='p') {postDataPlot(RServer);}
														else {
														postDataHTML(RServer,path);
																};
												};
										});
			}

					
		function button_click() {
		    var divTextExt= document.createElement("div");
			 divTextExt.setAttribute("id",divName);
             divTextExt.setAttribute("class", "DivOutput");
			divExt.appendChild(divTextExt);
			 $element.html(divExt);
			 //First row of a table with timestamp. To do the table
			 exportData(data,path, DataObj);
			 document.getElementById(divName).innerHTML = 'Executing';			 			 
			 //
			 
			 }

		//render html
		var divExt = document.createElement("div");
                divExt.setAttribute("id", divGeneral);
                divExt.setAttribute("class", "DivGeneral");
		 //creation of a button
		  var divButtonExt= document.createElement("div");
                divButtonExt.setAttribute("class", "DivButton");
		//var button='<button name="button">Click me</button>';
		 var divButton = document.createElement("BUTTON");
                //divButton.setAttribute("href", "javascript:void(0);");
                divButton.setAttribute("id", "button_123");
                divButton.setAttribute("class", "TestButton");
                divButton.innerText= "Run R";
				divButton.addEventListener("click", button_click, false);
		 divButtonExt.appendChild(divButton);
		 //divExt.appendChild(html);
		 divExt.appendChild(divButtonExt);
		$element.html(divExt);
		//end of rendering html

		}
	};
});
