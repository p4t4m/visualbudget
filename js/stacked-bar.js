let originalVotes;
let chart;

function createStackedBar(expenditures, revenues, element) {
    Papa.parse(expenditures, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {

            Papa.parse(revenues, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: function (revenueResults) {

                    const config = {
                        responsive: true,
                        type: 'bar',
                        data: {
                            labels: expenditureColumnNames,
                            datasets: createVotesFromData(results, revenueResults),
                        },
                        options: {
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    onClick: legendClick,
                                    position: 'bottom',
                                    reverse: true,
                                    title: {
                                        text: "Individual budget items can be toggled by selecting them on the legend.",
                                        display: false,
                                        padding: 0,
                                    },
                                },
                                title: {
                                    display: true,
                                    text: 'New Zealand budget 2010-25 by vote',
                                },
                            },
                            scales: {
                                x: {
                                    stacked: true,
                                    title: {
                                        text: "Year",
                                        display: true,
                                    }
                                },
                                y: {
                                    stacked: true,
                                    title: {
                                        display: true,
                                    }
                                }
                            }
                        }
                    };

                    chart = new Chart(
                        element,
                        config
                    );

                    setGlobalButtons(chart);
                    originalVotes = chart.data.datasets;

                    adjust();
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
        if (parseInt(value[revenueColumnName]) >= 0) {
            revenueData.push(parseInt(value[revenueColumnName]));
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
    Papa.parse(inflationFile, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results_infl) {
            Papa.parse(populationFile, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: function (results_pop) {
                    Papa.parse(gdpFile, {
                        download: true,
                        header: true,
                        skipEmptyLines: true,
                        complete: function (results_gdp) {
                            chart.data.datasets.forEach(function (ds) {
                                let index = chart.data.datasets.indexOf(ds);
                                let cd = JSON.parse(JSON.stringify(originalVotes[index]));
                                let newData = [];
                                for (let i = 0; i < cd.data.length; i++) {
                                    let adjusted = cd.data[i];
                                    if (adjustment === "inflation" || adjustment === "infpop") {
                                        adjusted = (adjusted * (100 / results_infl.data[results_infl.data.length - cd.data.length + i][inflationColumnName]));
                                    }
                                    if(adjustment === "inflation" || adjustment === "none"){
                                        adjusted = adjusted / 1000;

                                    }
                                    if (adjustment === "infpop") {
                                        adjusted = (adjusted / (results_pop.data[results_pop.data.length - cd.data.length + i][populationColumnName])) * 1000;
                                    }
                                    if (adjustment === "gdp") {
                                        adjusted = (10 * (adjusted / (results_gdp.data[results_gdp.data.length - cd.data.length + i][gdpColumnName]))) * 10000;
                                    }
                                    if(adjustment === "percentage-of-budget") {
                                        let year = i
                                        let total_of_year = 0;
                                        for (let j = 0; j < original.length-1; j++) {

                                            if(originalVotes[j].data[year] !== undefined){
                                            total_of_year += originalVotes[j].data[year];
                                        }
                                        }



                                        adjusted = (adjusted / total_of_year);

                                    }
                                    newData.push(adjusted);
                                }
                                ds.hidden = original[index].hidden;
                                ds.data = newData;

                            });
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
                                case "percentage-of-budget":
                                    chart.options.scales['y'].title.text = "% of total budget"
                                    break;
                                default:
                                    chart.options.scales['y'].title.text = "Millions NZD"
                                    break;
                            }
                            chart.update();
                        }
                    });
                }
            });
        }
    });
}
