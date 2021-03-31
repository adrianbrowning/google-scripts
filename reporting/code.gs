async function RunReport(){
  var spreadsheet = SpreadsheetApp.getActive();
  const configSheet = spreadsheet.getSheetByName("Config");
  const ranges = configSheet.getNamedRanges();
  let startDate;
  let endDate;
  let currentRow;
  for (const r of ranges){
    switch (r.getName()) {
      case "FromDate": {startDate = r.getRange().offset(0,1).getValue(); break;}
      case "ToDate": {endDate = r.getRange().offset(0,1).getValue(); break;}
      case "ConfigListStart": {currentRow = r.getRange(); break;}
      default: throw new Error("Unkown Named Range");
    }
  }
  if (!currentRow) throw new Error("Named Range ConfigListStart missing");
  if (!startDate) throw new Error("Named Range FromDate missing");
  if (!endDate) throw new Error("Named Range ToDate missing");

  //let currentRow = configSheet.getNamedRanges();
  const details =[];
  while (currentRow.getValue() !== "") {
    const sheetsName = currentRow.getValue();
    const account = currentRow.offset(0,1).getValue();
    const iQFields = (currentRow.offset(0,2).getValue()||"").trim().split(/\s*,\s*/);
    if (iQFields.length === 1 && iQFields[0] === ""){
      iQFields.length = 0;
    }
    const asFields = (currentRow.offset(0,3).getValue() || "").trim().split(/\s*,\s*/);
    if (asFields.length === 1 && asFields[0] === ""){
      asFields.length = 0;
    }
    details.push({
      account, iQFields, sheetsName, asFields
    });
    Logger.log(`${account}, ${sheetsName} ${iQFields} ${asFields}`)
    currentRow = currentRow.offset(1,0);
  }  
  await run(details, startDate, endDate);

  var spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.setActiveSheet(configSheet);
  spreadsheet.getRange("A2");
  SpreadsheetApp.flush();
}
