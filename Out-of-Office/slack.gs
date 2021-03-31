function getAllProperties(){
    const userProperties = PropertiesService.getUserProperties();
    Logger.log(userProperties.getKeys());
    Logger.log(userProperties.getProperties());
}

function deleteAllProperties(){
    PropertiesService.getUserProperties().deleteAllProperties();
}

function deleteUserList(){
    PropertiesService.getUserProperties().deleteProperty("userList");
}

function runSlackOoO(){
    const vacationEnd = Gmail.Users.Settings.getVacation("me").endTime;
    if ((Date.now()) > parseInt(vacationEnd, 10)) {
        PropertiesService.getUserProperties().deleteAllProperties();
        return;
    }  

    const emailsToSend = processSlackEmails();
    emailsToSend.forEach(({
                              emails,
                              convo
                          }) => {
        Logger.log(emails);
        sendEmail(emails, convo);
    });
}

function processSlackEmails(searchTerm = "is:unread from:notification@slack.com ", markAsRead = true){
    const threads = GmailApp.search(searchTerm);

    const userProperties = PropertiesService.getUserProperties();
    const usersList = JSON.parse(userProperties.getProperty("userList")) || {};
    const emailsToSend = [];

    try {      
        threads.forEach(thread => { 
          const mapped = [];
          try{            
              thread.getMessages().forEach(message => {
                let body = message.getBody();
                const regex = new RegExp("<span>From.*?</span>");
                let matchData;                
                while ((matchData = body.match(regex))){
                    body = body.substr(matchData.index + matchData[0].length);
                    let convo = matchData[0];

                    convo = convo.substr(convo.indexOf("<span>") + 6);
                    convo = convo.substr(0, convo.indexOf("</span>"));

                    // Logger.log(convo);

                    if (markAsRead) message.markRead();
                    if (convo.includes("Google Calendar")) return;
                    if (convo.includes("Jira")) return;
                    if (convo.includes("Slackbot")) return;
                    if (convo.includes("Clockwise")) return;
                    if (convo.includes("Lattice")) return;
                    if (convo.includes("standuply")) return;                                  

                    let names = [];

                    if (convo.startsWith("From <") || convo.startsWith("From #") || convo.startsWith("From a thread in")) {
                        //debugger;
                        if (convo.startsWith("From #")) {
                          

                            const toSearch = bodyToNextCard(body);
                            if (toSearch.includes("elton-browning</span></span></a> has joined the channel")) return;      
                            names.push(parseCardForPersonWhoMentioned(toSearch));
                        } else if (convo.startsWith("From <") || convo.startsWith("From a thread in")) {
                            const match = convo.match(/(.*?)\<.*?\>(.*)/);
                            if (match) {
                                convo = match[1] + match[2];
                            }

                            const toSearch = bodyToNextCard(body);
                            names.push(parseCardForPersonWhoMentioned(toSearch));
                        }
                    } else {
                        names = convo
                            .substr(convo.indexOf("with ") + 5)
                            .toLowerCase()
                            .split(" and ")
                            .map(name => name.trim().replace(/\s/g, "."))
                            .filter(name => name !== "adrian.elton-browning");
                    }
                    if (names.length === 0) continue;
                    
                    names.forEach(name =>{
                      if(Array.isArray(name)){
                        name.forEach(name => {
                        if (usersList[name]) {
                            return;
                        }
                          Logger.log(convo, "|",  slackNameToEmail(name));                  

                        usersList[name] = Date.now();
                        
                        emailsToSend.push({
                            emails: slackNameToEmail(name)+ "@tealium.com",
                            convo
                        });
                        });                       
                      } else {
                        if (usersList[names.join(",")]) {
                            return;
                        }
                        Logger.log(convo, "|",  names.map(name => slackNameToEmail(name)).join(","));
                  
                        usersList[names.join(",")] = Date.now();

                        const emails = names.map(name => slackNameToEmail(name) + "@tealium.com").join(",");
                        emailsToSend.push({
                            emails,
                            convo
                        });
                      }
                    });
                    
                    
                    
                }                
            });
          } catch(e){Logger.log(e)}
        });
        
    } finally{
    userProperties.setProperty("userList", JSON.stringify(usersList));    
}
return emailsToSend;

}

/**
 * @param {String} emails
 * @param {String} convo
 */
function sendEmail(emails, convo){  
    MailApp.sendEmail({
        to : emails,
        bcc : "adrian@tealium.com",
        subject : "Out of Office: RE: " + convo,
        body : Gmail.Users.Settings.getVacation("me").responseBodyPlainText
    });
}

function bodyToNextCard(body){
    return body.substring(0, (body.match(new RegExp("<span>From.*?</span>")) || { index : undefined }).index);
}
function getLastIndexOf(str, regex){

  let match;
  let index = 0;

while ((match = regex.exec(str)) !== null) {
  index = match.index;//} end=${regexp.lastIndex}.`);  
}

  return index;
}

function parseCardForPersonWhoMentioned(body){
    const regex = new RegExp("@<span style=\"background-color:.*?\">adrian</span>.<span style=\"background-color:.*?\">elton-browning</span>");
    const names = [];
    let matchData;
    while ((matchData = body.match(regex))){
        let message = body.substr(0, matchData.index);
        body = body.substr(matchData.index + matchData[0].length);
        message = message.substr(getLastIndexOf(message, /class="email-body"/g));
        message = message.substr(0, message.indexOf("</a>"));
        message = message.substr(message.lastIndexOf(">") + 1);
        names.push(message.toLowerCase().trim().replace(/\s/g, "."));
    }
    return names.filter(name => name !== "adrian.elton-browning");
}

function slackNameToEmail(name){
    switch (name){
        case "julian.llorente.perdigones":
            return "julian.llorente";
        default:
            return name;
    }
}

function removeUsersOlderThan3Days(){
  const threeDaysAgo = Date.now() - 2592e5;
  const usersList = JSON.parse(PropertiesService.getUserProperties().getProperty("userList")) || {};  
  for (const user in usersList) {    
    if (usersList[user] < threeDaysAgo) {
      delete usersList[user];
    }
  }
  PropertiesService.getUserProperties().setProperty("userList", JSON.stringify(usersList));
}
