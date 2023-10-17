import { ajax, extractCsrfTokenFromGetRequest } from "../communication/AjaxHelper.js";
import { GetStatisticsRequest, GetStatisticsResponse, StatisticData } from "../communication/Data.js";

import '/include/css/statistics.css';

class Statistics {

    //@ts-ignore
    chart: Chart;
    rawLabels: string[];
    timeFormat = 'YYYY-MM-DD HH:mm';

    async start(){

        await extractCsrfTokenFromGetRequest(true);

        let request: GetStatisticsRequest = {now: false};
        let that = this;

        let secondsSinceLastUpdate: number = 0;

        ajax("getStatistics", request, (response: GetStatisticsResponse) => {

            that.plotGraph(response.data);

            setInterval(() => {
                secondsSinceLastUpdate = 0;
                that.updateGraph();
            }, response.statisticPeriodSeconds*1000);    

            setInterval(()=>{
                $('#updatetimer').text('Nächste Messung in ' + (response.statisticPeriodSeconds - secondsSinceLastUpdate) + " s");
                secondsSinceLastUpdate++;
            }, 1000);

        }, (message: string) => {
            alert("Es ist ein Fehler aufgetreten: " + message);
        });

        let getCurrentLoad = () => {
            let request: GetStatisticsRequest = {now: true};
            ajax("getStatistics", request, (response: GetStatisticsResponse) => {

                let d = response.data[0];
                let text: string = d.users + " User, " + Math.round(d.memory/1000) + " kB, Requests pro Minute: " + d.requestsPerMinute + ", " + that.getMsPerRequest(d) + " ms/Request.";
                text += "<br>WebSockets: " + d.webSocketSessionCount + " Sessions with " + d.webSocketClientCount + " Clients, ";
                text += d.webSocketRequestPerSecond + " Requests pro Sekunde";
                $('#current').html(text);

                $('#userlist').text(d.userlist.join(", "));

                $('#current').css("color", "#0000ff");
                $('#current').animate({color: "#000000"}, 1500);
    
    
            }, (message: string) => {
                alert("Es ist ein Fehler aufgetreten: " + message);
            });
        }

        getCurrentLoad();

        setInterval(getCurrentLoad, 5000);

    }

    updateGraph(){
        let request: GetStatisticsRequest = {now: false};
        let that = this;

        ajax("getStatistics", request, (response: GetStatisticsResponse) => {

            let incomingData = response.data;
            let optionsData = that.chart.data;

            let newData: StatisticData[] = [];
            if(that.rawLabels.length > 0){
                let lastPlottedTime = that.rawLabels[that.rawLabels.length - 1];
                let i = 0;
                while(i < incomingData.length && incomingData[i].time != lastPlottedTime){
                    i++;
                }

                if(i == incomingData.length){
                    newData = incomingData;
                } else {
                    newData = incomingData.slice(i + 1);
                }
            } else {
                newData = incomingData;
            }
            
            for(let d of newData){

                //@ts-ignore
                optionsData.labels.push(moment(d.time, this.timeFormat));
                optionsData.datasets[0].data.push(d.users);
                optionsData.datasets[1].data.push(d.memory/1000000);
                optionsData.datasets[2].data.push(d.requestsPerMinute);
                optionsData.datasets[3].data.push(d.webSocketRequestPerSecond);
                optionsData.datasets[4].data.push(this.getMsPerRequest(d));
                that.rawLabels.push(d.time);
            }

            this.chart.update();

        }, (message: string) => {
            // alert("Es ist ein Fehler aufgetreten: " + message);
        });

    }

    getMsPerRequest(data: StatisticData){

        let count = 0;
        let sumTime = 0;
        data.performanceDataList.forEach(pd => {
            count += pd.count;
            sumTime += pd.sumTime;
        })

        return Math.min(1000, Math.round(sumTime/count));

    }

    plotGraph(data: StatisticData[]) {

        let ctx = (<HTMLCanvasElement>document.getElementById('chart')).getContext('2d');

        this.rawLabels = data.map((d) => d.time);

        //java: yyyy-MM-dd HH:mm
        

        let options: Chart.ChartConfiguration = {
            // The type of chart we want to create
            type: 'line',
            // The data for our dataset
            data: {
                //@ts-ignore
                labels: data.map((d) => moment(d.time, this.timeFormat)),
                datasets: [
                    {
                    label: 'User',
                    fill: false,

                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: data.map((d) => d.users),
                    yAxisID: 'y-axis-1',
                    lineTension: 0
                },
                    {
                    label: 'Memory (MB)',
                    fill: false,
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgb(0, 100, 255)',
                    data: data.map((d) => Math.round(d.memory/1000000)),
                    yAxisID: 'y-axis-2',
                    lineTension: 0

                },
                    {
                    label: 'Requests per minute',
                    fill: false,
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgb(0, 255, 100)',
                    data: data.map((d) => Math.round(d.requestsPerMinute)),
                    yAxisID: 'y-axis-1',
                    lineTension: 0

                },
                {
                    label: 'WS-Requests per second',
                    fill: false,
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgb(100, 0, 255)',
                    data: data.map((d) => Math.round(d.webSocketRequestPerSecond)),
                    yAxisID: 'y-axis-2',
                    lineTension: 0

                },
                {
                    label: 'ms per Request',
                    fill: false,
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgb(255, 255, 0)',
                    data: data.map((d) => this.getMsPerRequest(d)),
                    yAxisID: 'y-axis-2',
                    lineTension: 0

                },

            ]
            },
        
            // Configuration options go here
            options: {
                responsive: true,
                maintainAspectRatio: false,
                hover: {mode: "index"},
                title: {
                    display: false,
                    text: 'Serverauslastung'
                },
                scales: {
					xAxes: [{
                        type: 'time',
                        time: {
                            parser: this.timeFormat,
                            displayFormats: {
                                hour: 'D.M.|H:mm'
                            }
                        },
						distribution: 'series',
						offset: true,
						ticks: {
							major: {
								enabled: true,
								fontStyle: 'bold'
							},
							source: 'data',
							autoSkip: true,
							autoSkipPadding: 75,
							maxRotation: 0,
							sampleSize: 100
						}
                    }],                    
                    yAxes: [{
                        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                        display: true,
                        position: 'left',
                        id: 'y-axis-1',
                    }, {
                        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
                        display: true,
                        position: 'right',
                        id: 'y-axis-2',

                        // grid line settings
                        gridLines: {
                            drawOnChartArea: false, // only want the grid lines for one axis to show up
                        },
                    }],
                }
            }

        }

        //@ts-ignore
        this.chart = new Chart(ctx, options);

    }

    

}


$(()=>{
    new Statistics().start();
})