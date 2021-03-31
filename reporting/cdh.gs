const CDHBaseColumns = [
  {name: "All Inbound Events", id: "all_inbound_events"},
  {name: "Audience DB Visitors", id: "audiencedb_visitors"},
  {name: "Audience Store Visitors", id: "audiencestore_visitors"},
  {name: "AudienceStream Filtered Events", id: "audiencestream_filtered_events"},
  {name: "Cloud Connector All", id: "cloud_connector_all"},
  {name: "Cloud Connector Audiences", id: "cloud_connector_audiences"},
  {name: "Cloud Connector Events", id: "cloud_connector_events"},
  {name: "Data Access All", id: "data_access_all"},
  {name: "Event DB Events", id: "eventdb_events"},
  {name: "Event Store Events", id: "eventstore_events"},
  {name: "Omnichannel Events", id: "omnichannel_events"},
  {name: "Predict Enrichments", id: "predict_enrichments"},
  {name: "Realtime Events", id: "realtime_events"},
  {name: "View Through Reads", id: "viewthrough_reads"},
  {name: "View Through Writes", id: "viewthrough_writes"},
  {name: "Visitor DLE", id: "visitor_dle"}
];


let CDHColumns;

function setCDHColumns(fields) {
  CDHColumns = CDHBaseColumns.filter(col => fields.includes(col.id))
}


function cdh_getStats(account, profile, reportStart, reportEnd){
  return new Promise((res, rej) => {

    const apiUrl = `https://my.tealiumiq.com/urest/datacloud/${account}/${profile}/audit`;
    const url = apiUrl + `?utk=${utk}&start=${reportStart.toISOString()}&end=${reportEnd.toISOString()}`;

    const options = {
      method : 'GET',
      followRedirects : true,
      muteHttpExceptions : true,
      contentType : 'application/json',
      headers : {
        Cookie : `JSESSIONID=${JSESSIONID}`
      }
    };

    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() == 200) {
      const responseBody = response.getContentText();
      const stats = JSON.parse(responseBody);
      Logger.log('cdh stats length: ' + stats.length);
      return res(stats);
    }
    Logger.log("/************************/")
    Logger.log("Failed to get cdh stats");
    Logger.log(response.getResponseCode());
    Logger.log(response.toString());
    Logger.log("/************************/")
    rej("Failed to get cdh stats");
  });

}

function cdh_processStats(stats, reportStart, reportEnd){
    const recordStatsMonth = [];

  const monthly = cdh_populateMonthKeys(reportStart.getTime(), reportEnd.getTime());

    for (const col in stats) {
      stats[col].forEach(data => {
        const metricStart = new Date(data.start_time);
        const monthStr = getFormattedDate(metricStart, "-").split("-").slice(0, 2).join("-");                
        monthly[monthStr][col] = monthly[monthStr][col] + data.events;
      });
    }
    for (const monthStr in monthly){
      const month = monthly[monthStr];
      recordStatsMonth.push({
        date : monthStr,
        ...month
      });
    }
    return recordStatsMonth;
}

/**
 * @parma start {number}
 * @parma end {number}
 */
function cdh_populateMonthKeys(start, end){

 const keys = {};
  const currentDate = new Date(start);
  currentDate.setDate(1);

  const base = CDHColumns.reduce((acc, col) => {acc[col.id] = 0; return acc;}, {});

  while (currentDate < end){
    const day = getFormattedDate(currentDate, "-");
    const monthStr = day.split("-").slice(0, 2).join("-");
    keys[monthStr] = Object.assign({}, base);
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return keys;
}
