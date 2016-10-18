var chartBorderColor = 'rgba(0, 0, 255, 1)';
var chartBackgroundColor = 'rgba(0, 0, 255, 0.15)';
var chartHeaderFlagBackgroundColor = 'rgba(0, 0, 255, 0.25)';

$(document).ready(function() { // style the page
    $(".chart-header-flag").css('background-color', chartHeaderFlagBackgroundColor);
    $("#title-jumbotron").css('background-color', chartHeaderFlagBackgroundColor);
});

$.ajax({ // the main ajax call which requests the log data from the server
    url: "/getAllLogs",
    type: "get",
    dataType: "json",
    success: function (data) {
        sortLogData(data); // parses and adds a date object to each row and sorts the data by date

        $(document).ready(function () {
            setupAverageLoadTimeChart(data); // sets up the main load time chart
            setupHourlyCharts(data); // sets up the hourly charts
        });
    },
    error: function (request, status, error) {
        $(document).ready(function () {
            $("#chart-error-info").html(request.responseText); // displays any errors from the ajax request
        });
    }
});

function sortLogData(data) {
    for (let i = 0; i < data.length; i++) {
        data[i].date = new Date(data[i]["request_timestamp"]); // create a new Date object from the timestamp
    }

    var rowDateComparison = function (r1, r2) { // comparison function for sorting the data by date of the month
        if (r1.date.getUTCDate() < r2.date.getUTCDate())
            return -1;
        else if (r1.date.getUTCDate() > r2.date.getUTCDate())
            return 1;
        else // the dates must be equal
            return 0;
    };

    data.sort(rowDateComparison); // sort the data
}

function setupAverageLoadTimeChart(data) {
    var avgLoadTimeData = getAverageLoadTimeChartData(data); // organizes the JSON data for insertion into the chart

    var $avgLoadTimeChartCanvas = $("#canvas-chart"); // selects the canvas for the chart

    var avgLoadTimeChart = new Chart($avgLoadTimeChartCanvas, { // create our chart
        type: "line", // line chart as specified
        data: {
            labels: avgLoadTimeData.labels,
            datasets: [
                {
                    label: "RDE Test Site",
                    tension: 0, // sharp lines at data points
                    data: avgLoadTimeData.avgLoadTimes,
                    borderColor: chartBorderColor, // set the color of the line to a solid blue
                    backgroundColor: chartBackgroundColor,
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
}

function getAverageLoadTimeChartData(data) {
    var labels = []; // store the labels for the graph
    var avgLoadTimes = []; // store the average load times for each label

    // populate the labels and avgLoadTimes arrays
    for (let i = 0; i < data.length; i++) { // loop through the rows from the query

        // create and add a label in the format "month/day" (1 is added to the UTC month to obtain a readable month)
        labels.push((data[i].date.getUTCMonth() + 1) + "/" + data[i].date.getUTCDate());

        let loadTimeSum = data[i]["load_time"];
        let j = i + 1;
        while (j < data.length && data[i].date.getUTCDate() === data[j].date.getUTCDate()) { // sum the load times while the dates are equal
            loadTimeSum += data[j]["load_time"];
            j++;
        }
        let numLoadTimes = j - i;
        avgLoadTimes.push(Math.round(loadTimeSum / numLoadTimes)); // add the average load time for the date
        i += numLoadTimes - 1; // for loop takes care of the -1
    }

    /*
     Interpolation of the data for missing dates:
        We loop through the labels and avgLoadTimes and store the important data for the current day and the next day.
        Then we check if there are days between them.
            If so, we interpolate the missing days by "drawing a line" between the two days we do have and
            setting the average load time for each missing day to its corresponding point on that line

            If not, we continue checking the next two days until we hit the last day in the data-set
     */
    // initialize the "current" necessary variables
    let cLabel = labels[0];
    let cLabelSplit = cLabel.split("/");
    let cMonth = cLabelSplit[0];
    let cDayOfMonth = parseInt(cLabelSplit[1]);
    let cLoadTime = avgLoadTimes[0];

    for (let i = 0; i < labels.length - 1; i++) { // loop through all adjacent days
        // set the values for the "next" day
        let nextLabel = labels[i + 1];
        let nextDayOfMonth = parseInt(nextLabel.split("/")[1]);
        let nextLoadTime = avgLoadTimes[i + 1];

        // main algorithm for interpolation
        if (cDayOfMonth + 1 < nextDayOfMonth) { // there are missing days between these two dates
            let changeInLoadTime = nextLoadTime - cLoadTime;
            let changeInDays = nextDayOfMonth - cDayOfMonth;
            let slope = Math.round(changeInLoadTime / changeInDays); // the change in load time over the change in days
            for (let numDaysAfter = 1; numDaysAfter < changeInDays; numDaysAfter++) { // loop through the missing days
                // calculate the load time using the slope and y-intercept (the current load time)
                let interpolatedLoadTime = cLoadTime + numDaysAfter * slope;

                labels.splice(i + numDaysAfter, 0, cMonth + "/" + (cDayOfMonth + numDaysAfter)); // splice in the missing label
                avgLoadTimes.splice(i + numDaysAfter, 0, interpolatedLoadTime); // splice in the interpolated load time
            }
            i += changeInDays - 1; // the for loop will take care of the -1
        }

        // set the current variables we need equal to the next values
        cLabel = nextLabel;
        cLabelSplit = nextLabel.split("/");
        cMonth = cLabelSplit[0];
        cDayOfMonth = nextDayOfMonth;
        cLoadTime = nextLoadTime;
    }

    // return the labels and the data
    return {
        labels: labels,
        avgLoadTimes: avgLoadTimes
    }
}

function setupHourlyCharts(data) {
    var hourlyData = getHourlyChartData(data); // gets the login data

    var $loginDistChartCanvas = $("#canvas-hourly-login-dist-chart"); // select the canvas for the

    var hourlyLoginDistributionChart = new Chart($loginDistChartCanvas, { // create the chart
        type: "line",
        data: {
            labels: hourlyData.labels,
            datasets: [
                {
                    label: "RDE Test Site",
                    tension: 0,
                    data: hourlyData.avgLoginDistribution,
                    borderColor: chartBorderColor, // set the color of the line to a solid blue
                    backgroundColor: chartBackgroundColor,
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
                        beginAtZero: true
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

    var $hourlyLoadTimesChartCanvas = $("#canvas-hourly-load-times-chart");

    var averageHourlyLoadTimesChart = new Chart($hourlyLoadTimesChartCanvas, { // create the chart
        type: "line",
        data: {
            labels: hourlyData.labels,
            datasets: [
                {
                    label: "RDE Test Site",
                    tension: 0,
                    data: hourlyData.avgLoadTimesByHour,
                    borderColor: chartBorderColor, // set the color of the line to a solid blue
                    backgroundColor: chartBackgroundColor,
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
                        beginAtZero: true
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

function UTCToTwelveHourString(hourUTC) {
    return (((hourUTC + 11) % 12 + 1) + " " + (Math.floor(hourUTC / 12) < 1 ? "AM" : "PM")).toString();
}

function getHourlyChartData(data) {
    var labels = [];
    var numLoginsByHour = [];
    var totalLoadTimesByHour = []; // the average load time during each hour of the day

    var numDaysToCompare = 0; // this will be used to average the log-ins


    for (let hour = 0; hour < 24; hour++) {
        // sets the labels to the 12-hour format
        labels.push(UTCToTwelveHourString(hour)); // converts the UTC hour to the 12 hour and (AM/PM)
        numLoginsByHour.push(0);
        totalLoadTimesByHour.push(0);
    }

    for (let i = 0; i < data.length; i++) {
        let row = data[i];
        let hour = row.date.getUTCHours();
        numLoginsByHour[hour]++;
        totalLoadTimesByHour[hour] += row["load_time"];
        /*
         the average will be calculated by greatest date of the month (e.g. 30),
         not by the number of days counted, since some days are missing.
         */
        if (row.date.getUTCDate() > numDaysToCompare)
            numDaysToCompare = row.date.getUTCDate();
    }

    var avgLoginDistribution = [];
    var avgLoadTimesByHour = [];
    for (let i = 0; i < numLoginsByHour.length; i++) {
        avgLoginDistribution.push(Math.round(numLoginsByHour[i] / numDaysToCompare)); // average and push the log-ins
        if (numLoginsByHour[i] != 0)
            avgLoadTimesByHour.push(Math.round(totalLoadTimesByHour[i] / numLoginsByHour[i])); // average and push the load times
        else
            avgLoadTimesByHour.push(0);
    }

    // return the labels and the data
    return {
        labels: labels,
        avgLoginDistribution: avgLoginDistribution,
        avgLoadTimesByHour: avgLoadTimesByHour
    }
}