async function graph(data) {
    console.log("test");
    const response = await fetch("/getGraphData");

    const jsonData = await response.json();

    const promiseData = jsonData;

    const temperatures = promiseData.map((measurement) => measurement.temperature);
    const humidities = promiseData.map((measurement) => measurement.humidity);
    const altitudes = promiseData.map((measurement) => measurement.altitude);
    const pressures = promiseData.map((measurement) => measurement.pressure);
    const timestamps = promiseData.map((measurement) => new Date(measurement.timestamp));

    const formattedTimestamps = [];

    timestamps.forEach((element) => {
        const month = element.toLocaleString("default", { month: "long" });
        element = element.getDate() + ". " + month + " " + element.getHours() + ":" + element.getMinutes();
        console.log(element);
        formattedTimestamps.push(element);
    });

    let minTemperatureGraph = Math.min(...temperatures) - 2;
    if (minTemperatureGraph < -20) {
        minTemperatureGraph = -20;
    }
    let maxTemperatureGraph = Math.max(...temperatures) + 2;
    if (maxTemperatureGraph > 50) {
        maxTemperatureGraph = 50;
    }

    let minHumidityGraph = Math.min(...humidities) - 5;
    if (minHumidityGraph < 0) {
        minHumidityGraph = 0;
    }

    let maxHumidityGraph = Math.max(...humidities) + 5;
    if (maxHumidityGraph > 100) {
        maxHumidityGraph = 100;
    }

    let minAltitudeGraph = Math.min(...altitudes) - 10;
    if (minAltitudeGraph < 0) {
        minAltitudeGraph = 350;
    }

    let maxAltitudeGraph = Math.max(...altitudes) + 10;
    if (maxAltitudeGraph > 1000) {
        maxAltitudeGraph = 1000;
    }

    let minPressureGraph = Math.min(...pressures) - 75;
    if (minPressureGraph < 0) {
        minPressureGraph = 0;
    }

    let maxPressureGraph = Math.max(...pressures) + 75;
    if (maxPressureGraph > 110000) {
        maxPressureGraph = 110000;
    }

    new Chart(document.getElementById("temperature-graph"), {
        type: "line",
        data: {
            labels: formattedTimestamps,
            datasets: [
                {
                    label: "Temperature",
                    data: temperatures,
                    borderWidth: 1,
                    borderColor: "#e6640e",
                    backgroundColor: "#e6640e",
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    min: minTemperatureGraph,
                    max: maxTemperatureGraph,
                },
            },
        },
    });

    new Chart(document.getElementById("humidity-graph"), {
        type: "line",
        data: {
            labels: formattedTimestamps,
            datasets: [
                {
                    label: "Humidity",
                    data: humidities,
                    borderWidth: 1,
                    borderColor: "#0e90e6",
                    backgroundColor: "#0e90e6",
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    min: minHumidityGraph,
                    max: maxHumidityGraph,
                },
            },
        },
    });

    new Chart(document.getElementById("altitude-graph"), {
        type: "line",
        data: {
            labels: formattedTimestamps,
            datasets: [
                {
                    label: "Altitude",
                    data: altitudes,
                    borderWidth: 1,
                    borderColor: "#caddeb",
                    backgroundColor: "#caddeb",
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    min: minAltitudeGraph,
                    max: maxAltitudeGraph,
                },
            },
        },
    });

    new Chart(document.getElementById("pressure-graph"), {
        type: "line",
        data: {
            labels: formattedTimestamps,
            datasets: [
                {
                    label: "Pressure",
                    data: pressures,
                    borderWidth: 1,
                    borderColor: "#b02727",
                    backgroundColor: "#b02727",
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    min: minPressureGraph,
                    max: maxPressureGraph,
                },
            },
        },
    });
}

graph();
