$(document).ready(function () {
    $.ajax({
        url: "/getAllLogs",
        type: "get",
        dataType: "json",
        success: function (data) {

            sortLogData(data);

            setupAverageLoadTimeChart(data);
            setupLoginDistributionChart(data);
        },
        error: function (request, status, error) {
            $("#chart-error-info").html(request.responseText);
        }
    });

});

function sortLogData(data) {
    for (let i = 0; i < data.length; i++) {
        data[i].date = new Date(data[i]["request_timestamp"]);
    }

    var rowDateComparison = function (r1, r2) {
        if (r1.date.getUTCDate() < r2.date.getUTCDate())
            return -1;
        else if (r1.date.getUTCDate() > r2.date.getUTCDate())
            return 1;
        else // the dates must be equal
            return 0;
    };

    data.sort(rowDateComparison); // sort the data by the date of the month
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
                    tension: 0,
                    data: avgLoadTimeData.avgLoadTimes,
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
}

function getAverageLoadTimeChartData(data) {
    var labels = []; // store the labels for the graph
    var avgLoadTimes = []; // store the average load times for each label



    // populate the labels and avgLoadTimes arrays
    for (let i = 0; i < data.length; i++) { // loop through the rows from the query
        let dateLabel = data[i].date.getUTCMonth() + "/" + data[i].date.getUTCDate();
        labels.push(dateLabel); // add a label in the format "month/day"
        let loadTimeSum = data[i]["load_time"];
        let j = i + 1;
        while (j < data.length && data[i].date.getUTCDate() == data[j].date.getUTCDate()) {
            loadTimeSum += data[j]["load_time"];
            j++;
        }
        let numLoadTimes = j - i;
        avgLoadTimes.push(Math.round(loadTimeSum / numLoadTimes)); // add the average load time for the day
        i += numLoadTimes - 1;
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

    return {
        labels: labels,
        avgLoadTimes: avgLoadTimes
    }
}

function setupLoginDistributionChart(data) {
    var loginDistData = getLoginDistributionChartData(data);

    var $loginDistChartCanvas = $("#canvas-hourly-chart");

    var hourlyChart = new Chart($loginDistChartCanvas, {
        type: "line",
        data: {
            labels: loginDistData.labels,
            datasets: [
                {
                    label: "RDE Test Site",
                    tension: 0.2,
                    data: loginDistData.avgLoginDistribution,
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

/**
 * @return {string}
 */
function UTCToTwelveHourString(UTCHour) {
    return (UTCHour % 12 != 0 ? UTCHour % 12 : 12).toString()
        + " " + (Math.floor(UTCHour / 12) < 1 ? "AM" : "PM").toString();
}

function getLoginDistributionChartData(data) {
    var labels = [];
    var numLoginsByHour = [];
    var numDaysToCompare = 0;

    for (let hour = 0; hour < 24; hour++) {
        // sets the labels to the 12-hour format
        labels.push(UTCToTwelveHourString(hour));
        numLoginsByHour.push(0);
    }

    for (let i = 0; i < data.length; i++) {
        let row = data[i];
        let timestamp = new Date(row["request_timestamp"]);
        let hour = timestamp.getUTCHours();
        numLoginsByHour[hour]++;
        if (timestamp.getUTCDate() > numDaysToCompare)
            numDaysToCompare = timestamp.getUTCDate();
    }

    var avgLoginDistribution = [];
    for (let i = 0; i < numLoginsByHour.length; i++) {
        avgLoginDistribution.push(Math.round(numLoginsByHour[i] / numDaysToCompare));
    }

    return {
        labels: labels,
        avgLoginDistribution: avgLoginDistribution
    }
}