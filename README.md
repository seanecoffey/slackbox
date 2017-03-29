# slackbox
Checkout the readme at the original version from the guys at [Benchmark](https://github.com/benchmarkstudios/slackbox) for more specific info.

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

Simply create a Slash Command, such as `/playlist`, which accepts a track name (also the artist too for a less fuzzy search) to add to a pre-defined Spotify playlist:

    /playlist Bell Biv DeVoe – Poison

## Changes to Original

I've altered this to do a couple of things differently to the original slackbox:
 - Due to timeout errors randomly occurring (slack needs to receive a response within 3000ms of invocation), I've added an ephemeral response as soon as a request is detected (before the Spotify search) By default this currently says "What is your damage @slackusername?". 
 - Once the song has been added, a post to the slack channel 'in_channel' is made with the user that added the track, and a spotify URI link to the current playlist. 
 
 <p align="center">
  <img src="http://puu.sh/v1VIM/0fa902a8e7.png" alt="Sample use"/>
</p>

## Intended improvements
Over time I'm looking to extend the functionality by adding the following:
 - add option to delete tracks
 - add option to add tracks by url 
 - option to search for a spotify track using a youtube / soundcloud link 
