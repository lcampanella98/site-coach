$(document).ready(function () {
    $.ajax({
        url: "/getLogs",
        type: "get",
        dataType: "json",
        success: function (data) {
            console.time("chartData");
            var chartData = getChartData(data); // organizes the JSON data for insertion into the chart
            console.timeEnd("chartData");


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
    var labels = [];
    var avgLoadTimes = [];
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var date = new Date(row["date"]);
        labels.push((date.getUTCMonth() + 1) + "/" + date.getUTCDate());
        avgLoadTimes.push(row["avg_load"]);
    }
    var cLabel = labels[0];
    var cLabelSplit = cLabel.split("/");
    var cMonth = cLabelSplit[0];
    var cDayOfMonth = parseInt(cLabelSplit[1]);
    var cLoadTime = avgLoadTimes[0];
    for (var i = 0; i < data.length; i++) {
        var nextLabel = labels[i + 1];
        var nextDayOfMonth = parseInt(nextLabel.split("/")[1]);
        var nextLoadTime = avgLoadTimes[i + 1];
        if (cDayOfMonth + 1 < nextDayOfMonth) {
            var numDaysBetween = nextDayOfMonth - cDayOfMonth - 1;
            for (var numDaysAfter = 1; numDaysAfter <= numDaysBetween; numDaysAfter++) {
                labels.splice(i + numDaysAfter, 0, cMonth + "/" + (cDayOfMonth + numDaysAfter));
                var interpolatedLoadTime = cLoadTime + numDaysAfter * Math.round((nextLoadTime - cLoadTime) / (numDaysBetween + 1));
                avgLoadTimes.splice(i + numDaysAfter, 0, interpolatedLoadTime);
            }
            i += numDaysBetween;
        }
    }

    return {
        labels: labels,
        avgLoadTimes: avgLoadTimes
    }
}