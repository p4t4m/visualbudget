let originaldata;
let chart;
let originalData;
let yearElement;

function createPieChart(expenditures, element) {


    const actual_width = window.innerWidth;

    if(actual_width < 800) {
        const pc = document.getElementById('pie-chart');
        pc.height = 1300;

        pc.width = window.innerWidth * 0.9;
    } else {
const pc = document.getElementById('pie-chart');
        //pc.height = 700;
        pc.width = window.innerWidth * 0.8;
        pc.height = window.innerHeight * 0.8;
    }

    Papa.parse(expenditures, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
                    originalData = results;
                    let data = formatData(results,"2023");
                    const config = {
                        type: 'pie',
                        data: data,
                        options: {

                            responsive: false,

                            plugins: {

                                legend: {
                                    position: 'bottom',
                                    display: true,
                                },
                                title: {
                                    display: true,
                                }
                            }
                        },

                    };

                    console.log(config);

                    const pie = new Chart(
                        element,
                        config
                    );

                    yearElement = document.getElementById('yearAdjust');
                    yearElement.addEventListener('change', changeYear);


                    setGlobalButtons(pie);
                    chart = pie;

                    adjust();
                    changeYear();
                    pie.update();
                }
            });
}

function changeYear() {
    let year = yearElement.value;
    chart.data = formatData(originalData, year);
    chart.config.options.plugins.title.text = "New Zealand budget " + year + " by vote";
    adjust();
}

function formatData(results, year) {
    const data = results.data;
    let tuples = [];
    for (let i = 0; i < data.length; i++) {
        const vote = data[i]['Vote'];
        const value = data[i][year];
        if(value > 0) {
            tuples.push([vote, value]);
        }
    }
    tuples.sort((a, b) => b[1] - a[1]);
    let labels = tuples.map((a) => a[0]);
    let dataset = tuples.map((a) => a[1]);

    console.log(tuples);
    originaldata = dataset;
    return {
        labels: labels,
        datasets: [
            {
                data: dataset,
                backgroundColor: colors,
            }
        ]
    };
}

function setAllLabels(chart, hidden) {
    chart.data.datasets.forEach(function (ds) {
        ds.hidden = hidden;
    });
    chart.update();
}

function adjust() {
    const adjustment = adjustments.value;
    const year = parseInt(yearElement.value);
    Papa.parse("data/inflation-index-2010.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results_infl) {
            Papa.parse("data/population.csv", {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: function (results_pop) {
                    Papa.parse("data/gdp.csv", {
                        download: true,
                        header: true,
                        skipEmptyLines: true,
                        complete: function (results_gdp) {
                            let newData = [];
                            originaldata.forEach(function (value) {
                                let adjusted = value;
                                if (adjustment === "inflation" || adjustment === "infpop") {
                                    adjusted = (adjusted * (100 / results_infl.data[results_infl.data.length - 2023 + year-1]["FP.CPI.TOTL"]));
                                }
                                if(adjustment === "inflation" || adjustment === "none"){
                                    adjusted = adjusted / 1000;

                                }
                                if (adjustment === "infpop") {
                                    adjusted = (adjusted / (results_pop.data[results_pop.data.length - 2023 + year-1]["SP.POP.TOTL"])) * 1000;
                                }
                                if (adjustment === "gdp") {
                                    adjusted = (10 * (adjusted / (results_gdp.data[results_gdp.data.length - 2023 + year-1]["New Zealand"]))) * 10000;
                                }
                                newData.push(adjusted);

                            });
                            chart.data.datasets[0].data = newData;

                            switch (adjustment) {
                                case "inflation":
                                    chart.options.plugins.title.text = "New Zealand Budget " + year + ", Millions NZD (2010 Dollars)";
                                    break;
                                case "infpop":
                                    chart.options.plugins.title.text = "New Zealand Budget "  + year + ", NZD per person (2010 Dollars)";
                                    break;
                                case "gdp":
                                    chart.options.plugins.title.text = "New Zealand Budget "  + year + ", % of New Zealand GDP"
                                    break;
                                default:
                                    chart.options.plugins.title.text = "New Zealand Budget "  + year + ", Millions NZD"
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

const getOrCreateLegendList = (chart, id, ulid) => {
    const legendContainer = document.getElementById(id);
    let listContainer = document.getElementById(ulid);

    if (!listContainer) {
        listContainer = document.createElement('ul');
        listContainer.id = ulid;
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'row';
        listContainer.style.margin = 0;
        listContainer.style.padding = 0;

        legendContainer.appendChild(listContainer);
    }

    while (listContainer.firstChild) {
        listContainer.firstChild.remove();
    }

    listContainer.style.fontSize = "10px";

    return listContainer;
};


const htmlLegendPlugin = {
    id: 'htmlLegend',
    afterUpdate(chart, args, options) {
        let ul = getOrCreateLegendList(chart, options.containerID, 'ul');

        // Remove old legend items


        // Reuse the built-in legendItems generator
        const items = chart.options.plugins.legend.labels.generateLabels(chart);

        let count = 0;
        items.forEach(item => {
            if(count % 10 === 0){
                 ul = getOrCreateLegendList(chart, options.containerID, 'ul'+count);
            }
            count++;
            const li = document.createElement('li');
            li.style.alignItems = 'center';
            li.style.cursor = 'pointer';
            li.style.display = 'flex';
            li.style.flexDirection = 'row';
            li.style.marginLeft = '10px';

            li.onclick = () => {
                const {type} = chart.config;
                if (type === 'pie' || type === 'doughnut') {
                    // Pie and doughnut charts only have a single dataset and visibility is per item
                    chart.toggleDataVisibility(item.index);
                } else {
                    chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
                }
                chart.update();
            };

            // Color box
            const boxSpan = document.createElement('span');
            boxSpan.style.background = item.fillStyle;
            boxSpan.style.borderColor = item.strokeStyle;
            boxSpan.style.borderWidth = item.lineWidth + 'px';
            boxSpan.style.display = 'inline-block';
            boxSpan.style.flexShrink = 0;
            boxSpan.style.height = '10px';
            boxSpan.style.marginRight = '10px';
            boxSpan.style.width = '10px';

            // Text
            const textContainer = document.createElement('p');
            textContainer.style.color = item.fontColor;
            textContainer.style.margin = 0;
            textContainer.style.padding = 0;
            textContainer.style.textDecoration = item.hidden ? 'line-through' : '';

            const text = document.createTextNode(item.text);
            textContainer.appendChild(text);

            li.appendChild(boxSpan);
            li.appendChild(textContainer);
            ul.appendChild(li);
        });
    }
};