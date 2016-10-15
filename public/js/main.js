$(document).ready(function () {
    $.ajax({
        url: "/getAverageLoadTimes",
        type: "get",
        dataType: "json",
        success: function (data) {
            var chartData = getChartData(data); // organizes the JSON data for insertion into the chart

            var $chart = $("#canvas-chart"); // selects the canvas for the chart

            var coachChart = new Chart($chart, { // create our chart
                type: "line", // line chart as specified
                data: {
                    labels: chartData.labels,
                    datasets: [
                        {
                            label: "RDE Test Site",
                            tension: 0,
                            data: chartData.avgLoadTimes,
                            borderColor: 'rgba(0, 0, 255, 1)', // set the color of the line to a solid blue
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    scales: {
                        yAxes: [{
                            scaleLabel: { // label the y-axis
                                display: true,
                                labelString: "Average Load Time (ms)"
                            },
                            ticks: {
                                // if beginAtZero remains false (default), the y value of the origin will be the lowest average load time, which I don't want
                                beginAtZero: true
                            }
                        }],
                        xAxes: [{
                            scaleLabel: { // label the x-axis
                                display: true,
                                labelString: "Date"
                            }
                        }]
                    }
                }
            });
        },
        error: function (request, status, error) {
            $("#chart-error-info").html(request.responseText);
        }
    });

    $.ajax({
        url: "/getAllLogs",
        type: "get",
        dataType: "json",
        success: function (data) {
            var hourlyChartData = getHourlyChartData(data);

            var $hourlyChart = $("#canvas-hourly-chart");

            var hourlyChart = new Chart($hourlyChart, {
                type: "line",
                data: {
                    labels: hourlyChartData.labels,
                    datasets: [
                        {
                            label: "RDE Test Site",
                            tension: 0.2,
                            data: hourlyChartData.avgNumLogins,
                            borderColor: 'rgba(0, 0, 255, 1)', // set the color of the line to a solid blue
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    scales: {
                        yAxes: [{
                            scaleLabel: { // label the y-axis
                                display: true,
                                labelString: "Average Number of Log-ins"
                            },
                            ticks: {
                                beginAtZero: true // if this remains false (default), the y value of the origin will be the lowest average load time, which I don't want
                            }
                        }],
                        xAxes: [{
                            scaleLabel: { // label the x-axis
                                display: true,
                                labelString: "Hour"
                            }
                        }]
                    }
                }
            });
        }
    })
});

function getHourlyChartData(data) {
    var labels = [];
    var numLoginsByHour = [];
    var numDaysToCompare = 0;

    for (var i = 0; i < 24; i++) {
        var labelStr = (i % 12 != 0 ? i % 12 : 12).toString() + " " + (Math.floor(i / 12) < 1 ? "AM" : "PM");
        labels.push(labelStr);
        numLoginsByHour.push(0);
    }

    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var timestamp = new Date(row["request_timestamp"]);
        var hour = timestamp.getUTCHours();
        numLoginsByHour[hour]++;
        if (timestamp.getUTCDate() > numDaysToCompare)
            numDaysToCompare = timestamp.getUTCDate();
    }

    var avgNumLogins = [];
    for (var i = 0; i < numLoginsByHour.length; i++) {
        avgNumLogins.push(Math.round(numLoginsByHour[i] / numDaysToCompare));
    }

    return {
        labels: labels,
        avgNumLogins: avgNumLogins
    }
}

function getChartData(data) {
    var labels = []; // store the labels for the graph
    var avgLoadTimes = []; // store the average load times for each label
    for (var i = 0; i < data.length; i++) { // loop through the rows from the query
        var row = data[i];
        var date = new Date(row["date"]);
        labels.push((date.getUTCMonth() + 1) + "/" + date.getUTCDate()); // add a label in the format "month/day"
        avgLoadTimes.push(row["avg_load_time"]); // add the average load time for the day
    }

    /*
    Interpolation of the data for missing dates:
        We loop through the labels and avgLoadTimes and store the important current and next values.
        Then we check if there are days between them.
            If so, we interpolate the missing days by "drawing a line" between the two days we do have and
            setting the average load time for each missing day to its corresponding point on that line

            If not, we continue checking the next two days until we hit the last day in the data-set
     */
    // initialize the "current" necessary values
    var cLabel = labels[0];
    var cLabelSplit = cLabel.split("/");
    var cMonth = cLabelSplit[0];
    var cDayOfMonth = parseInt(cLabelSplit[1]);
    var cLoadTime = avgLoadTimes[0];
    for (var i = 0; i < data.length - 1; i++) {
        // set the values for the "next" day
        var nextLabel = labels[i + 1];
        var nextDayOfMonth = parseInt(nextLabel.split("/")[1]);
        var nextLoadTime = avgLoadTimes[i + 1];

        // main algorithm for interpolation
        if (cDayOfMonth + 1 < nextDayOfMonth) { // there are missing days between these two dates
            var changeInLoadTime = nextLoadTime - cLoadTime;
            var changeInDays = nextDayOfMonth - cDayOfMonth;
            var slope = Math.round(changeInLoadTime / changeInDays); // the change in load time over the change in days
            for (var numDaysAfter = 1; numDaysAfter < changeInDays; numDaysAfter++) { // loop through the missing days
                // calculate the load time using the slope and y-intercept (the current load time)
                var interpolatedLoadTime = cLoadTime + numDaysAfter * slope;

                labels.splice(i + numDaysAfter, 0, cMonth + "/" + (cDayOfMonth + numDaysAfter)); // splice in the missing label
                avgLoadTimes.splice(i + numDaysAfter, 0, interpolatedLoadTime); // splice in the interpolated load time
            }
            i += changeInDays - 1; // the for loop will take care of the -1
        }

        // set the current values equal to the next values
        cLabel = nextLabel;
        cLabelSplit = nextLabel.split("/");
        cMonth = cLabelSplit[0];
        cDayOfMonth = nextDayOfMonth;
        cLoadTime = nextLoadTime;
    }

    return {
        labels: labels,
        avgLoadTimes: avgLoadTimes
    }
}