var restify = require('restify');
var builder = require('botbuilder');
var prompts = require('./prompts');

var appId = process.env.MY_APP_ID || "Missing your app ID";
var appPassword = process.env.MY_APP_PASSWORD || "Missing your app password";

var server = restify.createServer();
server.listen(process.env.PORT || 3978, function()
{
   console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector
({ appId: process.env.MY_APP_ID, appPassword: process.env.MY_APP_PASSWORD });

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

var model = process.env.LUIS_MODEL || 'Missing Model URL';
var recognizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', dialog);

dialog.matches('Help', builder.DialogAction.send(prompts.helpMessage));
dialog.onDefault(builder.DialogAction.send(prompts.helpMessage));

dialog.matches('Acquisitions', [askCompany, answerQuestion('acquisitions', prompts.answerAcquisitions)]);
dialog.matches('IpoDate', [askCompany, answerQuestion('ipoDate', prompts.answerIpoDate)]);
dialog.matches('Headquarters', [askCompany, answerQuestion('headquarters', prompts.answerHeadquarters)]);
dialog.matches('Description', [askCompany, answerQuestion('description', prompts.answerDescription)]);
dialog.matches('Founders', [askCompany, answerQuestion('founders', prompts.answerFounders)]);
dialog.matches('Website', [askCompany, answerQuestion('website', prompts.answerWebsite)]);

dialog.matches('End', [
    function(session){
        session.endDialog("Global command that is available anytime:\n\n* goodbye - End this conversation.\n* help - Display help commands.");
    }
]);

function askCompany(session, args, next) {
    var company;
    var entity = builder.EntityRecognizer.findEntity(args.entities, 'CompanyName');

    if (entity) {
        company = builder.EntityRecognizer.findBestMatch(data, entity.entity);
    } else if (session.dialogData.company) {
        company = session.dialogData.company;
    }

    if (!company) {
        var txt = entity ? session.gettext(prompts.companyUnknown, { company: entity.entity }) : prompts.companyMissing;
        builder.Prompts.choice(session, txt, data);
    } else {
        next({ response: company })
    }
}

function answerQuestion(field, answerTemplate) {
    return function (session, results) {
        if (results.response) {
            var company = session.dialogData.company = results.response;
            var answer = { company: company.entity, value: data[company.entity][field] };
            session.send(answerTemplate, answer);
        } else {
            session.send(prompts.cancel);
        }
    };
}


/**
 * Sample data sourced from http://crunchbase.com on 3/18/2016
 */

var data = {
  'Microsoft': {
      acquisitions: 170,
      ipoDate: 'Mar 13, 1986',
      headquarters: 'Redmond, WA',
      description: 'Microsoft......., a software corporation, develops licensed and support products and services ranging from personal use to enterprise application.',
      founders: 'Bill Gates and Paul Allen',
      website: 'http://www.microsoft.com'
  },
  'Apple': {
      acquisitions: 72,
      ipoDate: 'Dec 19, 1980',
      headquarters: 'Cupertino, CA',
      description: 'Apple is a multinational corporation that designs, manufactures, and markets consumer electronics, personal computers, and software.',
      founders: 'Kevin Harvey, Steve Wozniak, Steve Jobs, and Ron Wayne',
      website: 'http://www.apple.com'
  },
  'Google': {
      acquisitions: 39,
      ipoDate: 'Aug 19, 2004',
      headquarters: 'Mountain View, CA',
      description: 'Google is a multinational corporation that is specialized in internet-related services and products.',
      founders: 'Baris Gultekin, Michoel Ogince, Sergey Brin, and Larry Page',
      website: 'http://www.google.com'
  },
  'Amazon': {
      acquisitions: 58,
      ipoDate: 'May 15, 1997',
      headquarters: 'Seattle, WA',
      description: 'Amazon.com is an international e-commerce website for consumers, sellers, and content creators.',
      founders: 'Sachin Agarwal and Jeff Bezos',
      website: 'http://amazon.com'
  }
};
