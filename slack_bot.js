/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
This is a sample Slack bot built with Botkit.
This bot demonstrates many of the core features of Botkit:
* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.
# RUN THE BOT:
  Get a Bot token from Slack:
    -> http://my.slack.com/services/new/bot
  Run your bot from the command line:
    token=<MY TOKEN> node slack_bot.js
# USE THE BOT:
  Find your bot inside Slack to send it a direct message.
  Say: "Hello"
  The bot will reply "Hello!"
  Say: "who are you?"
  The bot will tell you its name, where it running, and for how long.
  Say: "Call me <nickname>"
  Tell the bot your nickname. Now you are friends.
  Say: "who am I?"
  The bot will tell you your nickname, if it knows one for you.
  Say: "shutdown"
  The bot will ask if you are sure, and then shut itself down.
  Make sure to invite your bot into other channels using /invite @<my bot>!
# EXTEND THE BOT:
  Botkit has many features for building cool and useful bots!
  Read all about it here:
    -> http://howdy.ai/botkit
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


/*if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}
*/

var cleverbot = require("cleverbot.io"),  
cleverbot = new cleverbot('xxx', 'xxx');  
cleverbot.setNick("Smart Ass");  
cleverbot.create(function (err, session) {  
    if (err) {
        console.log('cleverbot create fail.');
    } else {
        console.log('cleverbot create success.');
    }
});

var Botkit = require('./node_modules/botkit/lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
	// 8dreamteam
    //token: 'xxx'
	
	// 8dteam-test
	token: 'xxx'
}).startRTM();

// contains all the commands that the bot can hear and respond to
var commands = [];
var botUserName = 'smartass';
var counter = 0;
var nameList = '';



// roll
commands.push('*roll <NUMBER>* : Returns a random generated number between 1 and <NUMBER> inclusively.');
controller.hears(['roll (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
	var maxNumber = message.match[1];
	var result = Math.floor((Math.random() * maxNumber) + 1);
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });


    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'You rolled ' + result + ', ' + user.name + '!');
        } else {
            bot.reply(message, 'You rolled ' + result + '!');
        }
    });
});

function returnChannelNames(channels) {
	var nameList = '';
	for (var i = 0, len = channels.length; i < len; i++) {
		nameList = nameList + '\n' + channels[i].name;
	}
	return nameList;
}

//channel list
commands.push('*channels* : Returns the list of public channels in this team.');
controller.hears(['channels'], 'direct_message,direct_mention,mention', function(bot, message) {
	bot.api.channels.list({'exclude_archived' : 1}, function (err, res) {  
	    console.log(res);
	    bot.reply(message, returnChannelNames(res.channels));
	});
});

//group list
commands.push('*groups* : Returns the list of private channels (groups) in this team.');
controller.hears(['groups'], 'direct_message,direct_mention,mention', function(bot, message) {
	bot.api.groups.list({'exclude_archived' : 1}, function (err, res) {  
	    console.log(res);
	    bot.reply(message, returnChannelNames(res.groups));
	});
});


function returnImNamelist(message, imList) {
	var nameList = '';
	var counter = 0;
	for (var i = 0, len = imList.length; i < len; i++) {
		bot.api.users.info(
			{user: imList[i].user},	
			function (err, res) {
				counter++;
				if (err) {
		            bot.botkit.log('Failed to get user info :(', err);
		        }
				nameList = nameList + '\n' + res.user.name + ' (' + res.user.profile.first_name + ' ' +
					res.user.profile.last_name + ", " + res.user.profile.email + ')';
				if (counter === len){
					console.log(nameList);
					bot.reply(message, nameList);
				}
			});
	}
}

//im list
commands.push('*imlist* : Returns the list of instant message channels (1on1) in this team.');
controller.hears(['imlist'], 'direct_message,direct_mention,mention', function(bot, message) {
	bot.api.im.list({}, function (err, res) {
	    returnImNamelist(message, res.ims);
	});
});


function scopeHistory(message, im, user, maxCounter) {
	bot.api.im.history({channel : im.id, count : 1}, function (errHistory, resHistory) {
		counter++; //counter used to know when this is the last im.history callback
		if (resHistory != null && resHistory.messages.length > 0) {
			console.log(user.name);
			nameList = nameList + '\n' + user.name; //doesn't work because i = userList.length
			
		}
		if (counter === maxCounter){ //if this is the last im.history callback
			bot.reply(message, nameList); //reply list of users with an history of IMs
		}
	});
}
//contact list history
commands.push('*contacthistory* : Returns the list of users with whom the bot has an history of instant messages.');
controller.hears(['contacthistory'], 'direct_message,direct_mention,mention', function(bot, message) {
	var imList = '';
	nameList = '';
	counter = 0;
	bot.api.im.list({}, function (errImList, resImList) {
		imList = resImList.ims;
		
		bot.api.users.list({}, function (errUserList, resUserList) {
			var userList = resUserList.members;
			for (var i = 0; i < userList.length; i++) { //for each user
				for (var j = 0; j < imList.length; j++) { //for each IM channel
					if (imList[j].user == userList[i].id) { //match user id with channel user id
						//call history of channel
						scopeHistory(message, imList[j], userList[i], imList.length);
						break;
						
					}
				}
			}
		});
	});

});


//openroom
commands.push('*openroom* : Returns the list of users with whom the bot has an history of instant messages.');
controller.hears(['openroom (.*) (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
	var usersTable = message.match;
	var usersCommaSeparatedListNames;
	var usersCommaSeparatedListIDs;
	
	console.log('0: ' + usersTable[0]);
	console.log('1: ' + usersTable[1]);
	console.log('2: ' + usersTable[2]);
	console.log('3: ' + usersTable[3]);
	
	bot.api.users.list({}, function (err, resUserList) {
		var userList = resUserList.members;
		
		for (var i = 1; i < usersTable.length; i++) {
			usersTable[i] = usersTable[i].slice(1);
			console.log('usertable: ' + usersTable[i]);
			for (var j = 0; j < userList.length; j++) {
				if (userList[j].name === usersTable[i]) {
					if (!usersCommaSeparatedListIDs){
						usersCommaSeparatedListIDs = userList[j].id;
						usersCommaSeparatedListNames = userList[j].name;
					}
					else {
						usersCommaSeparatedListIDs = usersCommaSeparatedListIDs + ',' + userList[j].id;
						usersCommaSeparatedListNames = usersCommaSeparatedListNames + ',' + userList[j].name;
					}
					j = userList.length;
				}
				if (j == (userList.length-1)){
					bot.reply(message, 'User ' + usersTable[i] + ' not found.');
				}
			}
		}
		
		bot.api.mpim.open({users:usersCommaSeparatedListIDs}, function (errMPIM, resMPIM) {
			if(errMPIM){
				bot.reply(message, 'Instant message room creation failed!');
			}
			else {
				bot.reply(message, 'Instant message room created for users ' + usersCommaSeparatedListNames + '!'); 
				bot.api.chat.postMessage({channel:resMPIM.group.id,as_user:true,text:'LET\'S CHAT BITCHES'}, function (errChat, resChat) {
				});
			}
		});
	});
	
});

function help (commandsTable){
	var commandsList = '';
	for (var i = 0, len = commandsTable.length; i < len; i++) {
		commandsList = commandsList + '\n' + commandsTable[i];
	}
	return commandsList;
}


function replyImHistory (imHistory, userId, userName){
	var formattedHistory = '';
	for (var i = imHistory.length - 1; i >= 0; i--) {
		if (imHistory[i].user === userId){
			formattedHistory = formattedHistory + '\n' + '*' + userName + '*' + ': ' + imHistory[i].text;
		}
		else {
			formattedHistory = formattedHistory + '\n' + '*' + botUserName + '*' + ': ' + imHistory[i].text;
		}
		
	}
	return formattedHistory;
}

//im history
commands.push('*imhistory <USERNAME>* : Returns the last 10 instant messages between this bot and <USERNAME>, if it has any.');
controller.hears(['imhistory (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
	var imList;
	bot.api.im.list({'exclude_archived' : 1}, function (err, res) {
		imList = res.ims;
		
		bot.api.users.list({}, function (err, resUserList) {
			var userList = resUserList.members;
			for (var i = 0, len = userList.length; i < len; i++) {
				
				if (userList[i].name === message.match[1]) {
					for (var j = 0, l = imList.length; j < l; j++) {
						if (imList[j].user === userList[i].id) {
							bot.api.im.history({channel : imList[j].id, count : 10}, function (err, historyRes) {
								bot.reply(message, replyImHistory(historyRes.messages,  userList[i].id, message.match[1]));
							});
						}
					}
					break;
				}
			}
		});
	});
	
	
});

// help
commands.push('*help* : List all commands that the bot can hear and respond to.');
controller.hears(['help'], 'direct_message,direct_mention,mention', function(bot, message) {
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });

    controller.storage.users.get(message.user, function(err, user) {
    	bot.reply(message, help(commands));
    });
});



/* call me X
controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

// who am i
controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});
*/

// shutdown
commands.push('*shutdown* : Shutdown smartass bot.');
controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});

// uptime
commands.push('*uptime* : Returns bot uptime.');
controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
             '>. I have been running for ' + uptime + ' on ' + hostname + '.');

    });

// cleverbot smartass
commands.push('*<ANYTHING ELSE>* : Returns a clever response.');
controller.hears('','ambient,direct_message',function(bot,message) {  
    var msg = message.text;
    cleverbot.ask(msg, function (err, response) {
        if (!err) {
            bot.reply(message, response);
        } else {
            console.log('cleverbot err: ' + err);
        }
    });
});

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}