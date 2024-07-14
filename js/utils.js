const inflationFile = 'data/2010-25-inflation.csv';
const inflationColumnName = '2010 Index';
const populationFile = 'data/2010-25-population.csv';
const populationColumnName = 'Population';
const gdpFile = 'data/2010-25-gdp.csv';
const gdpColumnName = 'GDP';
const revenueFile = 'data/2010-25-revenue.csv';
const revenueColumnName = 'Total Revenue';
const expenditureFile = 'data/2010-25-expenditure2.csv';
const expenditureColumnNames = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];


const colors = [
    '#808080',
'#c0c0c0',
'#2f4f4f',
'#556b2f',
'#6b8e23',
'#a0522d',
'#7f0000',
'#483d8b',
'#008000',
'#3cb371',
'#008b8b',
'#4682b4',
'#d2691e',
'#9acd32',
'#00008b',
'#32cd32',
'#daa520',
'#8fbc8f',
'#800080',
'#b03060',
'#ff0000',
'#ffd700',
'#ffff00',
'#00ff00',
'#00fa9a',
'#8a2be2',
'#dc143c',
'#00ffff',
'#f4a460',
'#adff2f',
'#0000ff',
'#f08080',
'#ff6347',
'#da70d6',
'#ff00ff',
'#1e90ff',
'#f0e68c',
'#dda0dd',
'#ff1493',
'#7b68ee',
'#f5deb3',
'#afeeee',
'#98fb98',
'#87cefa',
'#7fffd4',
'#ff69b4',
'#ffb6c1',
    '#ff8c00',
];




function setGlobalButtons(chart){
    document.getElementById('show-all').onclick = function () {
        setAllLabels(chart, false);
    };

    document.getElementById('hide-all').onclick = function () {
        setAllLabels(chart, true);
    };

    let adjustments = document.getElementById('adjustments');
    adjustments.addEventListener('change', adjust);
}

const legendClick = function (e, legendItem, legend) {
    const index = legendItem.datasetIndex;
    chart.data.datasets[index].hidden = legend.chart.isDatasetVisible(index);
    chart.update();
}