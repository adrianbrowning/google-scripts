function testRunSlackOoO(){
    
    const emailsToSend = processSlackEmails("from:notification@slack.com  after:2021/03/25 ", false);
    emailsToSend.forEach(({
                              emails,
                              convo
                          }) => {
        Logger.log(emails, convo);
    });
    getAllProperties();
}

function testOutOfOfficeSetter(){
  const event = getHolidayEvent();  
  if (!event) {
    Logger.log('No upcoming holiday found.');
    return;
  }

  Logger.log(`startTime: ${String(event.startTime)}`);
  Logger.log(`endTime: ${String(event.endTime)}`);
  const backDay = getParsedDate(event.nbd);
  Logger.log(`backDay: ${backDay}`);
  
}

function testGetEvents(){
   const optionalArgs = getOptionalArgs();
  const events = getHolidayEvents(optionalArgs);
  events.forEach(e => Logger.log(e));
}
