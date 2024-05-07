



async function graph(data) {
    console.log("test")
    const response = await fetch('/getGraphData');
    //console.log(response.json());
    
    const jsonData = await response.json();

    const promiseData = jsonData; 

    console.log(promiseData);
    const temperatures = promiseData.map(measurement => measurement.temperature);
    const timestamps = promiseData.map(measurement => new Date(measurement.timestamp));

    const formattedTimestamps = []

    timestamps.forEach(element => {
        const month = element.toLocaleString('default', { month: 'long' });
        element = element.getDate() + '. ' + month + ' ' +element.getHours() + ':' + element.getMinutes();
        console.log(element)
        formattedTimestamps.push(element)
    });

    console.log(formattedTimestamps)


    new Chart(
      document.getElementById('acquisitions'),
      {
        type: 'line',
        data: {
            labels: formattedTimestamps,
            datasets: [{
                label: 'Temperature',
                data: temperatures,
                borderWidth: 1,
                backgroundColor: '#928459',
            }]
        },
        options: {
            scales: {
                x: [{
                    type: 'time',
                    time: {
                        unit: 'hour' 
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Time'
                    }
                }],
                y: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Temperature (°C)'
                    }
                }]
            }
        }
      }
    );
  };

  graph();

