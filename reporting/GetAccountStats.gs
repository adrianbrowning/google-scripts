let utk;
let JSESSIONID;
// const account = "";
// const start = "2020-01-01";
// const end = "2021-03-31";

const USERNAME = "";
const PASSWORD = "";


async function run(accounts, start, end){
  await login();
  const [reportStart, reportEnd] = convertToDates(start, end);
  for (const details of accounts) {
    const {account, iQFields, sheetsName, asFields} = details;
    const profiles = await getProfiles(account);
    setiQColumns(iQFields);
    setCDHColumns(asFields);
    writeOutHeaders(sheetsName);
    profiles.sort();
    displayStats.currentCell = null;
    for (const profile of profiles) {
      let iq_processedStats = [];
      let cdh_processedStats = [];

    if (iQFields.length > 0) {
      try {      
      const iq_stats = await iq_getStats(account, profile, reportStart, reportEnd);
      iq_processedStats = iq_processStats(iq_stats, reportStart, reportEnd);
      } catch(e){}
    }

      if (asFields.length > 0) {
        try {        
        const stats = await cdh_getStats(account, profile, reportStart, reportEnd, asFields);
        cdh_processedStats = cdh_processStats(stats, reportStart, reportEnd);
        } catch(e){}
      }
            
      const combined = new Array(iq_processedStats.length);
      iq_processedStats.forEach((stats, i) => {
        combined[i] = {
          ...stats
        };
      });      
      cdh_processedStats.forEach((stats, i) => {
        combined[i] = {
          ...combined[i],
          ...stats
        };
      })
      displayStats(account, profile, combined, sheetsName);
    }
  }
  
}


function login(){
  return new Promise((res, rej) => {
    const url = "https://api.tealiumiq.com/v1/login";

    const payload = {
      username : USERNAME,
      password : PASSWORD
    };

    const options = {
      method : 'POST',
      followRedirects : true,
      muteHttpExceptions : true,
      payload : payload,
      contentType : "application/x-www-form-urlencoded",
    };

    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() == 200) {
      utk = JSON.parse(response.getContentText()).utk;

      const allHeaders = response.getAllHeaders();
      const setCookieHeader = allHeaders["Set-Cookie"];

      for (let i = 0; i < setCookieHeader.length; i++){
        if (setCookieHeader[i].indexOf("JSESSIONID=") === 0) {
          JSESSIONID = /JSESSIONID=(.*?);/.exec(setCookieHeader[i])[1];
          break;
        }
      }
      return res();
    }
    return rej("Not logged in!");
  });
}


function getProfiles(account){
  return new Promise((res, rej) => {

    const apiUrl = `https://my.tealiumiq.com/urest/users/${account}/profiles`;
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
      const profiles = JSON.parse(responseBody).profiles;
      Logger.log('profiles length: ' + profiles.length);
      return res(profiles);
    }
    Logger.log(response.getResponseCode());
    Logger.log(response.toString());
    rej("Failed to get profiles");
  });

}

function getFormattedDate(date, dateSplit = ""){
  const p = s => ("" + s).padStart(2, "0");
  var d = date, dd = d.getDate(), mm = d.getMonth() + 1;
  return [d.getFullYear(), p(mm), p(dd)].join(dateSplit);
}

function writeOutHeaders(sheetName){
  var spreadsheet = SpreadsheetApp.getActive();  
  spreadsheet.setActiveSheet(spreadsheet.getSheetByName(sheetName))  
  SpreadsheetApp.flush();
  
  
  spreadsheet.getActiveRange().getDataRegion().activate();  
  spreadsheet.getActiveRangeList().clear({contentsOnly: true, skipFilteredRows: false});
  SpreadsheetApp.flush();
  let currentCell = spreadsheet.getRange("A1");
  const cols = [...iQColumns, ...CDHColumns];
  
    currentCell.setValue("Date");
    currentCell.offset(0,1).setValue("Profile");
    cols.forEach((col, i) => {
      currentCell.offset(0,i+2).setValue(col.name);  
    });
SpreadsheetApp.flush();
}

function displayStats(account, profile, stats, sheetsName){
  var spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.setActiveSheet(spreadsheet.getSheetByName(sheetsName))  ;
  if (displayStats.currentCell) spreadsheet.setActiveRange(displayStats.currentCell);
  SpreadsheetApp.flush();
  spreadsheet = spreadsheet.getSheetByName(sheetsName);
  const cols = [...iQColumns, ...CDHColumns];

  let currentCell = displayStats.currentCell || spreadsheet.getRange("A2");
  let currentCellName = currentCell.getRowIndex() + ":"+currentCell.getColumnIndex();
  stats.forEach((s, i) => {
    currentCell.setValue(s.date);
    currentCell.offset(0,1).setValue(profile);
    currentCellName = currentCell.getRowIndex() + ":"+currentCell.getColumnIndex();
    cols.forEach((col, i) => {
      currentCell.offset(0,i+2).setValue(s[col.id] || 0);  
      currentCellName = currentCell.getRowIndex() + ":"+currentCell.getColumnIndex();
    });    
    
    currentCell = currentCell.offset(1,0);
    currentCellName = currentCell.getRowIndex() + ":"+currentCell.getColumnIndex();
  })
  displayStats.currentCell = currentCell.offset(0,0);
  currentCellName = currentCell.getRowIndex() + ":"+currentCell.getColumnIndex();
  spreadsheet.setActiveRange(displayStats.currentCell);
  SpreadsheetApp.flush();
}

function getSheets(){
  var spreadsheet = SpreadsheetApp.getActive();
  sheets = spreadsheet.getSheets();
  Logger.log(sheets.map(sheet => sheet.getName()));
}

function convertToDates(start, end) {
  const reportStart = new Date(start);
  reportStart.setUTCHours(0);
  reportStart.setUTCMinutes(0);
  reportStart.setUTCSeconds(0);
  reportStart.setUTCMilliseconds(0);
  const reportEnd = new Date(end);
  reportEnd.setUTCHours(23);
  reportEnd.setUTCMinutes(59);
  reportEnd.setUTCSeconds(59);
  reportEnd.setUTCMilliseconds(999);
  return [start, end];
}
