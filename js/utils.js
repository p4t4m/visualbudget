const colors = [
    '#2f4f4f',
    '#556b2f',
    '#a0522d',
    '#006400',
    '#708090',
    '#8b0000',
    '#808000',
    '#483d8b',
    '#3cb371',
    '#bc8f8f',
    '#b8860b',
    '#bdb76b',
    '#4682b4',
    '#000080',
    '#d2691e',
    '#9acd32',
    '#20b2aa',
    '#cd5c5c',
    '#32cd32',
    '#8fbc8f',
    '#800080',
    '#b03060',
    '#9932cc',
    '#ff4500',
    '#ff8c00',
    '#ffd700',
    '#ffff00',
    '#c71585',
    '#0000cd',
    '#00ff00',
    '#00fa9a',
    '#dc143c',
    '#00ffff',
    '#00bfff',
    '#f4a460',
    '#0000ff',
    '#a020f0',
    '#adff2f',
    '#ff6347',
    '#da70d6',
    '#d8bfd8',
    '#ff00ff',
    '#6495ed',
    '#dda0dd',
    '#b0e0e6',
    '#90ee90',
    '#7b68ee',
    '#7fffd4',
    '#ffe4b5',
    '#ff69b4',
];




function setGlobalButtons(chart){
    document.getElementById('show-all').onclick = function () {
        setAllLabels(chart, false);
    };

    document.getElementById('hide-all').onclick = function () {
        setAllLabels(chart, true);
    };

    adjustments = document.getElementById('adjustments');
    adjustments.addEventListener('change', adjust);
}

const legendClick = function (e, legendItem, legend) {
    const index = legendItem.datasetIndex;
    chart.data.datasets[index].hidden = legend.chart.isDatasetVisible(index);
    chart.update();
}