const colors = ['#2f4f4f', '#556b2f', '#a0522d', '#006400', '#708090', '#8b0000', '#808000', '#483d8b', '#3cb371', '#bc8f8f', '#b8860b', '#bdb76b', '#4682b4', '#000080', '#d2691e', '#9acd32', '#20b2aa', '#cd5c5c', '#32cd32', '#8fbc8f', '#800080', '#b03060', '#9932cc', '#ff4500', '#ff8c00', '#ffd700', '#ffff00', '#c71585', '#0000cd', '#00ff00', '#00fa9a', '#dc143c', '#00ffff', '#00bfff', '#f4a460', '#0000ff', '#a020f0', '#adff2f', '#ff6347', '#da70d6', '#d8bfd8', '#ff00ff', '#6495ed', '#dda0dd', '#b0e0e6', '#90ee90', '#7b68ee', '#7fffd4', '#ffe4b5', '#ff69b4',]
const barChartLabels = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

let originalVotes;
let chart;
let adjustments;

const legendClick = function (e, legendItem, legend) {
    const index = legendItem.datasetIndex;
    chart.data.datasets[index].hidden = legend.chart.isDatasetVisible(index);
    chart.update();
}

function createStackedBar(expenditures, revenues, element) {
    Papa.parse(expenditures, {
        download: true, header: true, skipEmptyLines: true, complete: function (results) {
            Papa.parse(revenues, {
                download: true, header: true, skipEmptyLines: true, complete: function (revenueResults) {
                    let votes = createVotesFromData(results, revenueResults);
                    const config = {
                        type: 'bar', data: {
                            labels: barChartLabels, datasets: votes,
                        }, options: {
                            animation: {
                                duration: 0,
                            },
                            maintainAspectRatio: false, plugins: {
                                legend: {
                                    onClick: legendClick, position: 'bottom', reverse: true, title: {
                                        text: "Individual budget items can be toggled by selecting them on the legend.",
                                        display: false,
                                        padding: 0,
                                    },
                                }, title: {
                                    display: true, text: 'New Zealand budget 2010-23 by vote',
                                },
                            }, scales: {
                                x: {
                                    stacked: true, title: {
                                        text: "Year", display: true,
                                    }
                                }, y: {
                                    stacked: true, title: {
                                        display: true,
                                    }
                                }
                            }
                        }
                    };

                    const stackedBar = new Chart(element, config);


                    document.getElementById('show-all').onclick = function () {
                        setAllLabels(stackedBar, false);
                    };

                    document.getElementById('hide-all').onclick = function () {
                        setAllLabels(stackedBar, true);
                    };

                    adjustments = document.getElementById('adjustments');
                    adjustments.addEventListener('change', adjust);
                    chart = stackedBar;
                    originalVotes = stackedBar.data.datasets;

                    adjust();
                    chart.options.animation.duration = 1000;
                }
            });
        }
    });
}

function createVotesFromData(results, revenueResults) {
    let votes = [];
    Array.prototype.push.apply(votes, formatData(results.data));
    let revenueData = [];
    votes.push({
        label: "Revenue (collected)",
        data: revenueData,
        backgroundColor: "rgb(0,0,0)",
        borderColor: "rgb(0,0,0)",
        type: 'line',
        order: 0,
    });
    for (const [key, value] of Object.entries(revenueResults.data)) {
        if (parseInt(value["Grand Total"]) >= 0) {
            revenueData.push(parseInt(value["Grand Total"]));
        }
    }
    return votes;
}

function setAllLabels(chart, hidden) {
    chart.data.datasets.forEach(function (ds) {
        ds.hidden = hidden;
    });
    chart.update();
}

function formatData(data) {
    let votes = [];
    for (let i = 0; i < data.length; i++) {
        const vote = data[i]['Vote'];
        delete data[i]['Vote'];
        let voteData = [];
        for (const [key, value] of Object.entries(data[i])) {
            if (parseInt(value) >= 0) {
                voteData.push(parseInt(value));
            }
        }
        votes.push({
            label: vote,
            data: voteData,
            backgroundColor: colors[i],
            order: voteData.reduce((partialSum, a) => partialSum + a, 0),
        });
    }
    return votes;
}

function adjust() {
    const adjustment = adjustments.value;
    const original = chart.data.datasets;
    chart.data.datasets = JSON.parse(JSON.stringify(originalVotes));
    switch (adjustment) {
        case "inflation":
            chart.options.scales['y'].title.text = "Millions NZD (2010 Dollars)";
            break;
        case "infpop":
            chart.options.scales['y'].title.text = "NZD per person (2010 Dollars)";
            break;
        case "gdp":
            chart.options.scales['y'].title.text = "% of New Zealand GDP"
            break;
        default:
            chart.options.scales['y'].title.text = "Millions NZD"
            break;
    }
    if(adjustment === "inflation" || adjustment === "infpop") {
        Papa.parse("data/inflation-index-2010.csv", {
            download: true, header: true, skipEmptyLines: true, complete: function (results_infl) {
                Papa.parse("data/population.csv", {
                    download: true, header: true, skipEmptyLines: true, complete: function (results_pop) {
                        chart.data.datasets.forEach(function (ds) {
                            let index = chart.data.datasets.indexOf(ds);
                            let cd = JSON.parse(JSON.stringify(originalVotes[index]));
                            let newData = [];
                            for (let i = 0; i < cd.data.length; i++) {
                                let adjusted = cd.data[i];
                                    adjusted = (adjusted * (100 / results_infl.data[results_infl.data.length - cd.data.length + i]["FP.CPI.TOTL"]));
                                if (adjustment === "inflation") {
                                    adjusted = adjusted / 1000;
                                }
                                if (adjustment === "infpop") {


                                    adjusted = (adjusted / (results_pop.data[results_pop.data.length - cd.data.length + i]["SP.POP.TOTL"])) * 1000;
                                }
                                newData.push(adjusted);
                            }
                            ds.hidden = original[index].hidden;
                            ds.data = newData;

                        });
                        chart.update();
                    }
                });
            }
        });
    }else if(adjustment === "gdp") {
        Papa.parse("data/gdp.csv", {
            download: true, header: true, skipEmptyLines: true, complete: function (results_gdp) {
                chart.data.datasets.forEach(function (ds) {
                    let index = chart.data.datasets.indexOf(ds);
                    let cd = JSON.parse(JSON.stringify(originalVotes[index]));
                    let newData = [];
                    for (let i = 0; i < cd.data.length; i++) {
                        let adjusted = cd.data[i];
                        if (adjustment === "gdp") {
                            adjusted = (10 * (adjusted / (results_gdp.data[results_gdp.data.length - cd.data.length + i]["New Zealand"]))) * 10000;
                        }
                        newData.push(adjusted);
                    }
                    ds.hidden = original[index].hidden;
                    ds.data = newData;

                });
                chart.update();
            }
        });
    }else if(adjustment === "none") {
        chart.data.datasets = JSON.parse(JSON.stringify(originalVotes));
        chart.update()
    }
}
