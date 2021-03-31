const iQBaseColumns = [
  {name: "Visits", id: "VISIT"},
  {name: "Loader", id: "LOADER"},
  {name: "Vendor", id: "VENDOR"},
  {name: "Sync", id: "SYNC"},
  {name: "Mobile", id: "MOBILE"}
];

let iQColumns;

function setiQColumns(fields) {
  iQColumns = iQBaseColumns.filter(col => fields.includes(col.id))
}

function iq_getStats(account, profile, reportStart, reportEnd){
  return new Promise((res, rej) => {
    const apiUrl = `https://my.tealiumiq.com/urest/tag_usage/${account}/${profile}/${reportStart.getTime()}/${reportEnd.getTime()}`;
    const url = apiUrl + `?utk=${utk}`;

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
      Logger.log('iq stats length: ' + stats.length);
      return res(stats);
    }
    Logger.log("/************************/")
    Logger.log("Failed to get iQ stats");
    Logger.log(response.getResponseCode());
    Logger.log(response.toString());
    Logger.log("/************************/")
    rej("Failed to get iQ stats");
  });

}

/**
 * @param start {number}
 * @param end {number}
 */
function iq_populateMonthKeys(start, end){
  const keys = {};
  const currentDate = new Date(start);
  currentDate.setDate(1);

  const base = iQColumns.reduce((acc, col) => {acc[col.id] = 0; return acc;}, {});

  while (currentDate < end){
    const day = getFormattedDate(currentDate, "-");
    const monthStr = day.split("-").slice(0, 2).join("-");
    keys[monthStr] = Object.assign({}, base);
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return keys;
}

function iq_processStats(stats, reportStart, reportEnd){
  const recordStatsMonth = [];

  const monthly = iq_populateMonthKeys(reportStart.getTime(), reportEnd.getTime());

  if (stats.length > 0) {
    stats.forEach(_data => {
      const metricStart = new Date(_data.start);

      const day = getFormattedDate(metricStart, "-");      
   

      const monthStr = day.split("-").slice(0, 2).join("-");
      const month = monthly[monthStr];

      if (!month) debugger;

      iQColumns.reduce((acc, col) => {
        acc[col.id] = acc[col.id] + (_data.metrics[col.id] || 0);
       return acc;
      }, month);
    });

    for (const monthStr in monthly){
      const month = monthly[monthStr];
      recordStatsMonth.push({
        date : monthStr,
        ...month
      });
    }
  }
  return recordStatsMonth;
}
