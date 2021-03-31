function getParsedDate(timestamp){
    const p = s => ("" + s).padStart(2, "0");
    const d = new Date(+timestamp), dd = d.getDate(), mm = d.getMonth() + 1;
    return [p(dd), p(mm), d.getFullYear()].join("/");
}

function getISODate(addDays = 0){
  const date = new Date();
  date.setDate(date.getDate()+addDays);
  date.setHours(1);  
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date.toISOString()
}


function getNextBusinessDay(ts) {
  // Copy date so don't affect original
  let date = new Date(ts);
  // Add days until get not Sat or Sun
  while (!(date.getDay() % 6)) {
    date.setDate(date.getDate() + 1);
  } 
  return date;
}
