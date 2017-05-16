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


## Intended improvements
Looking to extend the functionality:
 - convert to a BOT instead of a slash command!
 - parse songs via URLs / URIs from spotify, bandcamp, soundcloud etc and present interactive buttons to add to playlist
 - option for BOT to create playlists and then update the current collaborative playlist, or overwrite which playlist is being written to
 - improve authorisation UI
 - use BOT as a jukebox, i.e. play - track will control the logged in account
 
