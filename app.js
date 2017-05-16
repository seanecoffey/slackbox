var express       = require('express');
var bodyParser    = require('body-parser');
var request       = require('request');
var dotenv        = require('dotenv');
var SpotifyWebApi = require('spotify-web-api-node');

dotenv.load();

var spotifyApi = new SpotifyWebApi({
  clientId     : process.env.SPOTIFY_KEY,
  clientSecret : process.env.SPOTIFY_SECRET,
  redirectUri  : process.env.SPOTIFY_REDIRECT_URI
});

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.listen(process.env.PORT, '0.0.0.0');

app.get('/', function(req, res) {
  if (spotifyApi.getAccessToken()) {
    return res.send('You are logged in.');
  }
  return res.send('<a href="/authorise">Authorise</a>');
});

app.get('/authorise', function(req, res) {
  var scopes = ['playlist-modify-public', 'playlist-modify-private'];
  var state  = new Date().getTime();
  var authoriseURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authoriseURL);
});

app.get('/callback', function(req, res) {
  spotifyApi.authorizationCodeGrant(req.query.code)
    .then(function(data) {
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
      return res.redirect('/');
    }, function(err) {
      return res.send(err);
    });
});

app.get('/refresh', function(req, res) {
  spotifyApi.refreshAccessToken();
  if (spotifyApi.getAccessToken()) {
    return res.send('You are logged in.');
  }
  return res.send('<a href="/authorise">Authorise</a>');
});

function sendToSlack (s, sendURL, responseType) {
	var payload = {
		response_type: responseType,
		text: s
		};
	var theRequest = {
		url: sendURL,
		method: "POST",
		json: payload
		};
	request (theRequest, function (error, response, body) {
		if (!error && (response.statusCode == 200)) {
			console.log ("sendToSlack: " + s);
			}
		else {
			console.log ("sendToSlack: error, code == " + response.statusCode + ", " + response.body + ".\n");
			}
		});
	}

//create function to allow slack message attachments
function sendToSlack(s, a, sendURL, responseType) {
	var payload = {
		response_type: responseType,
		text: s,
		attachments: a
		};
	var theRequest = {
		url: sendURL,
		method: "POST",
		json: payload
		};
	request (theRequest, function (error, response, body) {
		if (!error && (response.statusCode == 200)) {
			console.log ("sendToSlack: " + s);
			}
		else {
			console.log ("sendToSlack: error, code == " + response.statusCode + ", " + response.body + ".\n");
			}
		});
	}
	
app.use('/store', function(req, res, next) {
  if (req.body.token !== process.env.SLACK_TOKEN) {
    return res.status(500).send('Cross site request forgerizzle!');
  }
  next();
});

app.post('/store', function(req, res) {
	var response_url = req.body.response_url;
	var userID = req.body.user_id;
	var userName = req.body.user_name;
	res.send ('Processing request: `'+req.body.text.trim()+'`');
	//res.send ('<@' + userID + '|' + userName + '> Processing request: `'+req.body.text.trim()+'`');
	spotifyApi.refreshAccessToken()
    .then(function(data) {
      spotifyApi.setAccessToken(data.body['access_token']);
      if (data.body['refresh_token']) { 
        spotifyApi.setRefreshToken(data.body['refresh_token']);
      }
     if (req.body.text.trim().length === 0) {
          sendToSlack('Enter an appropriate commmand before the song like *add* or *remove* i.e `add - fazerdaze - lucky girl`', response_url, 'ephemeral');
		  return;
    }
	if (req.body.text.indexOf('-') == -1) {
		sendToSlack('Enter an appropriate commmand before the song like *add* or *remove* i.e `add - fazerdaze - lucky girl`', response_url, 'ephemeral');
		return;
	}
	if (req.body.text.indexOf('-') > 0) {
		var pieces = req.body.text.split(' - ');
		var operation = pieces[0].trim();
		if (operation == 'add' || operation == 'remove' || operation == 'share') {
			var query = 'artist:' + pieces[1].trim() + ' track:' + pieces[2].trim();
		}
		else {
			sendToSlack('You did not enter an appropriate command, currently only `add` and `remove` are supported', response_url, 'ephemeral');
			return;
		}
	}
	else {
		sendToSlack('could not process the request');
		return;
	}
	  				  
      spotifyApi.searchTracks(query)
        .then(function(data) {
          var results = data.body.tracks.items;
          if (results.length === 0) {
            sendToSlack('Could not find that track.', response_url, 'ephemeral');
			return;
          }
           var track = results[0];
		   switch(operation) {
			   case 'add':
				  spotifyApi.addTracksToPlaylist(process.env.SPOTIFY_USERNAME, process.env.SPOTIFY_PLAYLIST_ID, ['spotify:track:' 
																 + track.id])
					.then(function(data) {
					  var text = '<@' + userID + '|' + userName + '> added <spotify:track:'+track.id+'|*' + track.name + '* by *' 
					  + track.artists[0].name + '*> to the playlist ';
					if (process.env.SPOTIFY_PERMALINK) text += '<spotify:user:' + process.env.SPOTIFY_USERNAME+':playlist:'
						+process.env.SPOTIFY_PLAYLIST_ID+'K + '|'+process.env.PLAYLIST_NAME+'>';
					  sendToSlack(text, response_url, 'in_channel');
					  return;
					}, function(err) {
					  sendToSlack(err.message, response_url, 'ephemeral');
					  return;
				});
				break;
				
				case 'remove':
					var tracks = [{ uri : 'spotify:track:' + track.id}];
					spotifyApi.removeTracksFromPlaylist(process.env.SPOTIFY_USERNAME, process.env.SPOTIFY_PLAYLIST_ID, tracks)
					.then(function(data) {
						var text = 'All instances of *' + track.name + '* by *' + track.artists[0].name + '* have been removed from the playlist ';
						if (process.env.SPOTIFY_PERMALINK) text += '<' + process.env.SPOTIFY_PERMALINK + '|'+process.env.PLAYLIST_NAME+'>';
						sendToSlack(text, response_url, 'ephemeral');
						return;
					}, function(err) {
						sendToSlack(err.message, response_url, 'ephemeral');
						return;
					});
					break;
				//create a button for looking up and sharing a song before adding it to the playlist	
				case 'share': 
						var text = '<@' + userID + '|' + userName + '> shared <spotify:track:'+track.id+'|*' 
						+ track.name + '* by *' + track.artists[0].name + '*> but has not added it to the playlist';
					//create a slack message attachment to trigger option to add song to playlist (incomplete)	
				   var attachments =  [{
							"fallback": "Would you like to add this to the playlist?",
							"title": "would you like to add this to the playlist?",
							"callback_id":'spotify:track:'+track.id,
							"attachment_type":"default",
							"color": "6AE368",
							"actions": [{
								"name": "add",
								"text": "add to playlist",
								"type": "button",
								"value": "add"
						}]}];
						sendToSlack(text,attachments,response_url, 'in_channel');
						return;
					
				default:
					sendToSlack('Enter an appropriate commmand before the song like *add* or *remove* i.e `add - fazerdaze - lucky girl`', response_url, 'ephemeral');
					return;					
		   }}, function(err) {
          sendToSlack(err.message, response_url, 'ephemeral');
		  return;
        });
    }, function(err) {
      sendToSlack('Could not refresh access token. You probably need to re-authorise yourself from your <'+process.env.APP_URL+
		  ' | app\'s homepage.>',response_url, 'ephemeral');
	  return;
    });
});

app.set('port', (process.env.PORT || 3000));
app.listen(app.get('port'));
