var myUserProperties = PropertiesService.getUserProperties();
const account = "";
const repo = "";

function getProperties(){
Logger.log("username: " + myUserProperties.getProperty("username"))
Logger.log("ghToken: " + myUserProperties.getProperty("ghToken"))
Logger.log("SlackBotURL: "+ myUserProperties.getProperty("SlackBotURL"))
}

function LogURL(){
 Logger.log(myUserProperties.getProperty("SlackBotURL"))
  Logger.log(Utilities.base64Encode(myUserProperties.getProperty("username") + ":" + myUserProperties.getProperty("ghToken")))
}

function _getId(url) {
if (!url || typeof url !== "string") return null;
var match = url.match(/\/(\d+)$/);
  if (match) {
    return match[1];
  }
  return null;
}

function getNotifications(){

var yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
yesterday.setMilliseconds(0)
yesterday.setSeconds(0)
yesterday.setMinutes(0);
yesterday.setHours(8);

  var notifications = _getURL(`https://api.github.com/repos/${account}/${repo}/notifications?participating=true&since=`+yesterday.toISOString());
  var results = JSON.parse(notifications.getContentText());
  if (results.length === 0 ) return;
  
  var messages = [];
  results.forEach(function(notification){
  var prNumber = _getId(notification.subject.url);
  var commentNumber = _getId(notification.subject.latest_comment_url);
  var url = "";
  if (prNumber) {
    url = `https://github.com/${account}/${repo}/pull/`+prNumber+(commentNumber ? "#issuecomment-"+commentNumber : "");
  }
    messages.push("*"+notification.subject.title + "*\n" + url + "\n" + notification.subject.type);
  });
  _postToSlack(messages.join("\n\n"),myUserProperties.getProperty("SlackBotURL"));
}

/*myUserProperties.setProperties({
  "username":"",
  "ghToken" : "",
  "SlackBotURL" : ""
});*/


function _getURL(url){
  return UrlFetchApp.fetch(url, {
    headers : {
      Authorization : "Basic " + Utilities.base64Encode(myUserProperties.getProperty("username") + ":" + myUserProperties.getProperty("ghToken"))
    }
  });
}

function getPRs(){
  var hours = new Date().getHours();
  var _url = `https://api.github.com/search/issues?q=repo:${account.toLowerCase()}/${repo} is:open is:pr author:`+myUserProperties.getProperty("username");
  var attachments = _getURL(_url);
  var results = JSON.parse(attachments.getContentText());
  var messages = [];
  results.items.forEach(function(pr){
    var pull = _getURL(`https://api.github.com/repos/${account}/${repo}/pulls/` + pr.number);
    var pull_results = JSON.parse(pull.getContentText());
    if (!pull_results.mergeable) {
      messages.push(pull_results.title + " - " + pull_results.number + "\n" + pull_results.html_url);
    }
  });
  if (messages.length === 0) return;
  _postToSlack(messages.join("\n\n"));
}

function _postToSlack(message, url){

  var data = {
    'text' : message,
  };
  var options = {
    'method' : 'post',
    'contentType' : 'application/json',
    'payload' : JSON.stringify(data)
  };
  UrlFetchApp.fetch(url || myUserProperties.getProperty("SlackBotURL"), options);
}
