# slackbox
Checkout the readme at the original version from the guys at [Benchmark](https://github.com/benchmarkstudios/slackbox) for better installation info.

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

Simply create a Slash Command, such as `/playlist`, which accepts a command, and a track and artist name, in the form
    
    /playlist command - artist - song
    i.e.
    /playlist add - hazel english - make it better

## Sample Use

Adding a song:

 <p align="center">
  <img src="https://puu.sh/vRwG3/8a90c476c6.png" alt="Sample use"/>
</p>

Removing a song:

<p align="center">
  <img src="https://puu.sh/vRwHp/fb5d7ec957.png" alt="Sample use"/>
</p>

## Common

During setup, have your slash command or outgoing webhook submit a POST to your app's `/store` endpoint, e.g. `https://app-name.herokuapp.com/store`.

Make a note of the `token` (either from the slash command or outgoing webhook), as you'll need it later to help guard against cross-site request forgery.

### Spotify

Head over to [Spotify's Developer Site](http://developer.spotify.com) and create a new Application. Make sure you add whatever slackbox's callback URI as a valid callback URI. If you're running locally, this will be `http://localhost:3000/callback` or on Heroku `https://app-name.herokuapp.com/callback`

Make a note of the `key`, `secret` and `callback URI` too, as you'll need these later as well.

Also, don't forget to make a playlist. If you do this through [Spotify's web interface](http://play.spotify.com) then the `playlist identifier` will be the last segment of the URI - make a note of this too! If there's a better way of finding this out, we're all ears. If you do this through the app, right-click the playlist to get it's web URL and again, you need the last segment of the URI.

### Environment variables

Once you've cloned slackbox or hit the "Deploy with Heroku" button you'll need to setup the following environment variables. These can either be stored in a `.env` or set up as config variables in Heroku.

* `SLACK_TOKEN` - The token from Slack's Slash Command.
* `SPOTIFY_KEY` - Your Spotify application key (a.k.a Client ID).
* `SPOTIFY_SECRET` - Your Spotify application secret (a.k.a Client Secret).
* `SPOTIFY_USERNAME` - Your Spotify username.
* `SPOTIFY_PLAYLIST_ID` - Your playlist identifier.
* `SPOTIFY_REDIRECT_URI` - URI to redirect to once your user has allowed the application's permissions.
* `PORT` - Changing port if required
* `PLAYLIST_NAME` - to update the name of the playlist - [need to update to pull from the ID]


## Intended improvements
Looking to extend the functionality:
 - convert to a BOT instead of a slash command!
 - parse songs via URLs / URIs from spotify, bandcamp, soundcloud etc and present interactive buttons to add to playlist
 - option for BOT to create playlists and then update the current collaborative playlist, or overwrite which playlist is being written to
 - improve authorisation UI
 - use BOT as a jukebox, i.e. play - track will control the logged in account
 
