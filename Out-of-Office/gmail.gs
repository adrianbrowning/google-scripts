let additionalDays = 0;
function debug(){
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const firstDate = new Date();
  const secondDate = new Date(2021, 3, 1);

  additionalDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay)) + 1;  
  Logger.log(getHolidayEvent());
}

function getOptionalArgs(){
  const optionalArgs = {
    timeMin: getISODate(additionalDays),
    timeMax: getNextBusinessDay(getISODate(2+additionalDays)).toISOString(),
    showDeleted: false,
    singleEvents: true,
    maxResults: 100,
    orderBy: 'startTime'
  };
  Logger.log(optionalArgs);
  return optionalArgs;
}

function getBankHolidayEvents(optionalArgs) {
  var calendarId = 'en.uk#holiday@group.v.calendar.google.com';  
  var response = Calendar.Events.list(calendarId, optionalArgs);
  var events = response.items;
  return events.filter(event => {        
    if (!event.description) return true;
    const countries = event.description.replace("Holiday or observance in: ", "").split(/\s*,\s*/);
    if (countries.includes("England")) return true;
    return false;
  })
  .filter(event => event.summary.includes("Bank Holiday") || event.summary.includes("regional holiday")  || event.summary.includes("Good Friday") );
}

function getHolidayEvents(optionalArgs){
  var calendarId = 'primary';  
  var response = Calendar.Events.list(calendarId, optionalArgs);
  const events = response.items;  
  return events.filter(event => {
    Logger.log(`${event.summary} - ${event.status}`);
    if (event.status !== "confirmed") return false;
    if (event.summary.toLowerCase() !== "holiday") return false;
    return true;
  });
  
}

function getHolidayEvent() {  
  const optionalArgs = getOptionalArgs();
  var events = [...getBankHolidayEvents(optionalArgs), ...getHolidayEvents(optionalArgs)];
  if (events.length === 0) {
    Logger.log('No upcoming holiday found.');
    return;
  }
   
let start;
let end;

  for (i = 0; i < events.length; i++) {
    var event = events[i];          
    var startTime = event.start.dateTime;
    if (!startTime) {
      startTime = event.start.date;
    }
    if (!start || start > startTime) {
      start = startTime;
    }
    var endTime = event.end.dateTime;
    if (!endTime) {
      endTime = event.end.date;
    }
    if (!end || end < endTime) {
      end = endTime;
    }
    Logger.log('%s : %s - %s', event.summary, startTime, endTime);        
  }
  Logger.log('%s - %s', start, end);        
    const et = getNextBusinessDay(end);
    const nbd = new Date(et);
    const a =  {
      startTime: new Date(start).getTime(), 
      endTime: et.getTime(),
      nbd: nbd
    };
    return a;
} 

function runOutOfOfficeSetter(){
  const event = getHolidayEvent();  
  if (!event) {
    Logger.log('No upcoming holiday found.');
    return;
  }
  const vacation = Gmail.Users.Settings.getVacation("me");  
  vacation.setStartTime(String(event.startTime));
  vacation.setEndTime(String(event.endTime));
  const backDay = getParsedDate(event.nbd);
  vacation.setResponseBodyPlainText(`Hello,\n\nThank you for your message.\n\nI'm currently out of the office, I will be back in the office on the ${backDay}.\n\nI will respond to you as soon as I can, but please allow for some delay in coming back to you.\n\nRegards,\nAdrian`);  
  
  Gmail.Users.Settings.updateVacation(vacation,"me");
  
}
