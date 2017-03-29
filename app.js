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

app.listen(3000, '0.0.0.0');

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
	res.send ('What is your damage, <@' + userID + '|' + userName + '>?');
	spotifyApi.refreshAccessToken()
    .then(function(data) {
      spotifyApi.setAccessToken(data.body['access_token']);
      if (data.body['refresh_token']) { 
        spotifyApi.setRefreshToken(data.body['refresh_token']);
      }
      if (req.body.text.trim().length === 0) {
          sendToSlack('Enter the name of a song and the name of the artist, separated by a "-"\nExample: Blue (Da Ba Dee) - Eiffel 65', response_url, 'ephemeral');
		  return;
      }
      if (req.body.text.indexOf(' - ') === -1) {
        var query = 'track:' + req.body.text;
      } else { 
        var pieces = req.body.text.split(' - ');
        var query = 'artist:' + pieces[0].trim() + ' track:' + pieces[1].trim();
      }
      spotifyApi.searchTracks(query)
        .then(function(data) {
          var results = data.body.tracks.items;
          if (results.length === 0) {
            sendToSlack('Could not find that track.', response_url, 'ephemeral');
			return;
          }
           var track = results[0];
          spotifyApi.addTracksToPlaylist(process.env.SPOTIFY_USERNAME, process.env.SPOTIFY_PLAYLIST_ID, ['spotify:track:' + track.id])
            .then(function(data) {
              var text = 'That is so fetch! <@' + userID + '|' + userName + '> added a track: *' + track.name + '* by *' + track.artists[0].name + '*';
			if (process.env.SPOTIFY_PERMALINK) text += ' - <' + process.env.SPOTIFY_PERMALINK + '| Listen Here!>';
              sendToSlack(text, response_url, 'in_channel');
			  return;
            }, function(err) {
              sendToSlack(err.message, response_url, 'ephemeral');
			  return;
            });
        }, function(err) {
          sendToSlack(err.message, response_url, 'ephemeral');
		  return;
        });
    }, function(err) {
      sendToSlack('Could not refresh access token. You probably need to re-authorise yourself from your app\'s homepage.',response_url, 'ephemeral');
	  return;
    });
});

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));
