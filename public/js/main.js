$(document).ready(function () {
    $.ajax({
        url: "/getLogs",
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
                            data: chartData.averageSpeedData,
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
                                beginAtZero: true // if this remains false (default), the y value of the origin will be the lowest average load time, which I don't want
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
    })
});

function getChartData(data) {
    var datesAndSpeeds = {};
    /*
    Description of the "datesAndSpeeds" object:
    Keys:
        Each key is a string containing the month and day in the form "m/d"
    Values:
        Each value will be an array of objects.
        Each object in that array represents one login, containing two name-value pairs;
            date: the date object,
            loadTime: page load time in ms
     */

    var labels = []; // define the labels array for the x-axis

    for (var i = 0; i < data.length; i++) { // loops through the row results from database query
        var date = new Date(data[i]['time']); // instantiates a date object from the timestamp
        var dateLabel = (date.getUTCMonth() + 1) + "/" + date.getUTCDate(); // creates a label for the x-axis (example: 7/22 for July 22nd)

        if (datesAndSpeeds[dateLabel] === undefined) // initializes the array
            datesAndSpeeds[dateLabel] = [];
        datesAndSpeeds[dateLabel].push({ // pushes the date and load speed to the array
            date: date,
            loadTime: data[i]["load_speed"] // gets the load time in ms from the "load_speed" column
        });

    }

    var averageSpeedData = []; // the average speeds for each given day

    for (var d in datesAndSpeeds) { // loops through the keys in "datesAndSpeeds"
        var dateSpeedArray = datesAndSpeeds[d]; // gets the array for d (d is a string of the form "m/d")

        var loadTimeSum = 0; // keeps track of the sum of the load times
        for (var i = 0; i < dateSpeedArray.length; i++) // sums the load times in the given day
            loadTimeSum += dateSpeedArray[i].loadTime;

        var speedDayAverage = Math.round(loadTimeSum / dateSpeedArray.length); // take the average and round to nearest ms
        averageSpeedData.push(speedDayAverage); // push the data

        if ($.inArray(d, labels) < 0) // adds the label to the labels array if it does not yet contain it
            labels.push(dateLabel);
    }

    return {
        labels: labels,
        averageSpeedData: averageSpeedData
    }
}