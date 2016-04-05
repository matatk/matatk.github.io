google.load('visualization', '1.0', {'packages':['corechart']});
google.setOnLoadCallback(make_charts);

function make_chart(title, name1, t1, name2, rows, chart_id) {
	// Google Charts Stuff

	var data = new google.visualization.DataTable();

	// Populate the table
	data.addColumn(t1, name1);
	data.addColumn('number', name2);
	data.addRows(rows);

	// Prepare chart options, then create and draw the chart
	var chart_options = {
		'title': title,
		'curveType': 'function'
	};

	var chart = new google.visualization.LineChart(
			document.getElementById(chart_id));

	// Resizing; thanks, http://stackoverflow.com/a/23594901
	function resizeChart() {
		chart.draw(data, chart_options);
	}
	if (document.addEventListener) {
		window.addEventListener('resize', resizeChart);
	}
	else if (document.attachEvent) {
		window.attachEvent('onresize', resizeChart);
	}
	else {
		window.resize = resizeChart;
	}

	resizeChart();  // initial draw

	return {
		data: data,
		chart: chart
	};
}

function make_audio_chart(title, name1, t1, name2, rows, chart_id, trigger_id) {
	// Google charts bit
	dc = make_chart(title, name1, t1, name2, rows, chart_id);

	// AudioChart Stuff
	function make_audiochart_callback(data_object, chart_object) {
		// Instantiate a new AudioChart that will auto-play the whole chart.
		// Note: this is a wrapped closure so that it will support any number
		//       of charts on the page (the references won't get overwritten).
		return function() {
			new AudioChart({
				'type': 'google',      // (see the docs)
				'data': data_object,   // the GoogleDataTable
				'chart': chart_object, // the Google Chart object
				'duration': 5000,      // milliseconds
				'frequency_low': 200,  // Hz
				'frequency_high': 600  // Hz
			});
		};
	}

	document.getElementById(trigger_id).onclick =
		make_audiochart_callback(dc.data, dc.chart);
}

function make_charts() {
	// CSUN 1
	make_chart(
			'Search queries for CSUN',
			'Month',
			'string',
			'Searches',
			data_csun,
			'chart-csun');

	// Hello
	make_audio_chart(
			'Evil Project Efficacy',
			'Top Secret Evil Project',
			'string',
			'Watermelons',
			data_hello,
			'chart-hello',
			'play-hello');

	// CSUN 2
	make_audio_chart(
			'Search queries for CSUN',
			'Month',
			'string',
			'Searches',
			data_csun,
			'chart-csun-2',
			'play-csun-2');

	// HTML Table
	document.getElementById('btn_table1').onclick = function() {
		var options = {
			'type': 'html_table',
			'table': document.getElementById('table1'),
			'highlight_class': 'current-datum',
			'duration': 5000,      // milliseconds
			'frequency_low': 200,  // Hz
			'frequency_high': 600  // Hz
		};
		new AudioChart(options);
	};

	// sin()
	make_sine();
}

function make_sine() {
	var MIN = -Math.PI;
	var MAX = Math.PI;
	var DELTA = 0.01;
	var results = [];
	var index = 0;
	for( var i = MIN; i <= MAX; i = i + DELTA ) {
		results[index] = [i, Math.sin(i)];
		index++;
	}

	make_audio_chart(
			'sin()',
			'x radians',
			'number',
			'sin(x)',
			results,
			'chart-sin',
			'play-sin');
}

var data_hello = [
	['Alpha',    293],
	['Beta',     329],
	['Gamma',    261],
	['Delta',    130],
	['Epsilon',  196],
	['Zeta',     196]
];

var data_csun = [
	['January 2004', 59],
	['February 2004', 81],
	['March 2004', 72],
	['April 2004', 59],
	['May 2004', 65],
	['June 2004', 66],
	['July 2004', 47],
	['August 2004', 65],
	['September 2004', 62],
	['October 2004', 64],
	['November 2004', 64],
	['December 2004', 62],
	['January 2005', 57],
	['February 2005', 66],
	['March 2005', 64],
	['April 2005', 62],
	['May 2005', 63],
	['June 2005', 55],
	['July 2005', 55],
	['August 2005', 65],
	['September 2005', 62],
	['October 2005', 56],
	['November 2005', 64],
	['December 2005', 60],
	['January 2006', 59],
	['February 2006', 69],
	['March 2006', 67],
	['April 2006', 66],
	['May 2006', 71],
	['June 2006', 54],
	['July 2006', 55],
	['August 2006', 57],
	['September 2006', 70],
	['October 2006', 60],
	['November 2006', 64],
	['December 2006', 63],
	['January 2007', 68],
	['February 2007', 67],
	['March 2007', 69],
	['April 2007', 71],
	['May 2007', 78],
	['June 2007', 58],
	['July 2007', 60],
	['August 2007', 71],
	['September 2007', 62],
	['October 2007', 65],
	['November 2007', 67],
	['December 2007', 72],
	['January 2008', 75],
	['February 2008', 74],
	['March 2008', 69],
	['April 2008', 73],
	['May 2008', 76],
	['June 2008', 53],
	['July 2008', 59],
	['August 2008', 73],
	['September 2008', 75],
	['October 2008', 76],
	['November 2008', 71],
	['December 2008', 70],
	['January 2009', 73],
	['February 2009', 76],
	['March 2009', 80],
	['April 2009', 70],
	['May 2009', 72],
	['June 2009', 46],
	['July 2009', 50],
	['August 2009', 68],
	['September 2009', 69],
	['October 2009', 59],
	['November 2009', 60],
	['December 2009', 56],
	['January 2010', 56],
	['February 2010', 61],
	['March 2010', 59],
	['April 2010', 55],
	['May 2010', 56],
	['June 2010', 42],
	['July 2010', 48],
	['August 2010', 66],
	['September 2010', 66],
	['October 2010', 64],
	['November 2010', 62],
	['December 2010', 56],
	['January 2011', 60],
	['February 2011', 67],
	['March 2011', 69],
	['April 2011', 66],
	['May 2011', 71],
	['June 2011', 51],
	['July 2011', 53],
	['August 2011', 68],
	['September 2011', 82],
	['October 2011', 68],
	['November 2011', 73],
	['December 2011', 69],
	['January 2012', 67],
	['February 2012', 70],
	['March 2012', 67],
	['April 2012', 64],
	['May 2012', 70],
	['June 2012', 51],
	['July 2012', 52],
	['August 2012', 67],
	['September 2012', 69],
	['October 2012', 68],
	['November 2012', 69],
	['December 2012', 63],
	['January 2013', 61],
	['February 2013', 69],
	['March 2013', 65],
	['April 2013', 69],
	['May 2013', 71],
	['June 2013', 49],
	['July 2013', 54],
	['August 2013', 74],
	['September 2013', 75],
	['October 2013', 76],
	['November 2013', 72],
	['December 2013', 70],
	['January 2014', 71],
	['February 2014', 70],
	['March 2014', 73],
	['April 2014', 72],
	['May 2014', 79],
	['June 2014', 53],
	['July 2014', 62],
	['August 2014', 73],
	['September 2014', 80],
	['October 2014', 78],
	['November 2014', 73],
	['December 2014', 67],
	['January 2015', 68],
	['February 2015', 75],
	['March 2015', 73],
	['April 2015', 72],
	['May 2015', 80],
	['June 2015', 53],
	['July 2015', 57],
	['August 2015', 78],
	['September 2015', 82],
	['October 2015', 78],
	['November 2015', 76],
	['December 2015', 73],
	['January 2016', 68],
	['February 2016', 78]
	];
