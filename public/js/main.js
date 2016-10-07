$(document).ready(function () {
    $.ajax({
        url: "/getlogs",
        type: "get",
        dataType: "json",
        success: function (data) {
            console.log(data);
            var datesAndSpeeds = {};
            var labels = [];
            for (var i = 0; i < data.length; i++) {
                var date = new Date(data[i]['time']);
                var dateLabel = date.getUTCMonth() + "/" + date.getUTCDay();

                if (datesAndSpeeds[dateLabel] === undefined)
                    datesAndSpeeds[dateLabel] = [];
                datesAndSpeeds[dateLabel].push({
                    date: date,
                    speed: data[i]["load_speed"]
                });

                if ($.inArray(dateLabel, labels) < 0)
                    labels.push(dateLabel);
            }
            var averageSpeedData = [];
            for (var d in datesAndSpeeds) {
                var dateSpeedArray = datesAndSpeeds[d];
                var speedSum = 0;
                for (var i = 0; i < dateSpeedArray; i++) {
                    speedSum += dateSpeedArray[i].speed;
                }
                var speedDayAverage = speedSum / dateSpeedArray.length;
                averageSpeedData.push(speedDayAverage);
            }
            console.log(labels);

            var $chart = $("#canvas-chart");
            var coachChart = new Chart($chart, {
                type: "line",
                data: {
                    label: labels,
                    datasets: [
                        {
                            label: "Average Speed (ms)",
                            data: averageSpeedData,
                            borderColor: 'rgba(0, 0, 255, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            });
        }
    })
});