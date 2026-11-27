# Handbell PWA

A static, offline-capable web app for iPhone and Android. No build tools, dependencies, analytics or backend. Original synthesized handbell audio; accelerometer and gyroscope data stay on the device.

## Deploy

Upload the contents of this folder (index.html, manifest, sw.js and PNGs) together to any HTTPS static host. GitHub Pages: create a repository, put the files at its root, enable Pages from the main branch root in Settings → Pages, and open the resulting HTTPS URL on your phone. A local file or an ordinary HTTP LAN URL cannot be relied on for motion or PWA installation. Desktop localhost is useful for testing the interface.

## Install

* iPhone: Safari → Share → Add to Home Screen → Open as Web App if offered.
* Android: Chrome → menu → Install app / Add to Home screen.

Open the app, press **Enable motion & sound**, grant motion access if prompted, and flick your wrist gently. Tap the bell to test audio. Adjust sensitivity if it triggers too easily or not enough. Keep the phone securely in your hand and the app visible. Silent mode or media volume can affect audio. Notes C4–C6, velocity-sensitive strikes, polyphonic tails, offline app shell, and remembered settings are included.

## Technical details

`DeviceMotionEvent` provides acceleration and angular velocity; an adaptive gravity estimate is used when linear acceleration is absent. The detector uses a smoothed magnitude, adjustable threshold, hysteresis, and a 150 ms refractory period. The algorithm is intentionally heuristic, not a physically calibrated clapper simulation. Audio is synthesized with Web Audio (no downloads). On iOS, permission and audio activation are both initiated within the button gesture. Motion events are processed only in the foreground. Sensor behavior, audio routing and permission handling should be verified on physical iOS and Android devices.

To run on a desktop for a UI test: `python3 -m http.server 8000` then open `http://localhost:8000/`.


## Version 2: physical clapper

- Traditional mode simulates a freely moving clapper in two planes. Tuned mode constrains the clapper to one plane; use the direction selector to choose side-to-side or forward/back.
- Sensitivity changes effective clapper travel and coupling to phone motion, not simply a shake threshold. Impact velocity controls both loudness and brightness.
- Tap the bell to preview; hold it to damp sounding voices.
- Recorded sound uses its natural pitch. Choose Synthesised for selectable notes and a tuned modal sound.
- The first successful online load of the default recording caches it for offline use. You can also import your own single-strike WAV or MP3; it is stored locally on your device, if browser storage permits.

### Recorded audio

The default recording is `bell-single.mp3`, **Bell #3** by Joseph Sardin (BigSoundBank), [source and CC0 license](https://bigsoundbank.com/bell-3-s2115.html). It is explicitly described by the source as one ring of a handbell. The earlier Bronze bell #2 recording had four strikes and is no longer used. The Import CC0 bell recording workflow downloads the replacement and commits it to main. If the workflow fails, download the MP3 from the source page and place it in the repository root as `bell-single.mp3`. GitHub Pages may need a manual redeployment after a bot-generated commit. No external request is made from the app to the audio provider.

Until the recording is present, or if it cannot be decoded, the app uses improved modal synthesis and reports the fallback. The selected recording has not yet been auditioned in this app. For real chromatic handbell samples, see [radwoc's CC0 recordings](https://freesound.org/people/radwoc/sounds/370001/); these contain multiple ringing techniques and need to be edited into individual strikes before use.

### Validation

Simulated motion at approximately 60 Hz produces no strikes at rest or with slow tilt; sinusoidal forward and sideways wrist swings generate alternating impacts; the wrong axis is rejected in tuned mode. The physical parameters have not been calibrated on a real iPhone or Android device.


## Motion diagnostics (v6)

Enable motion and sound, then open Motion diagnostics. Choose a trial and press Start test. After a three-second countdown, the detector resets and records the trial automatically. Leave the app foregrounded and hold the phone securely. Follow the prompts for rest/slow tilt, five isolated forward flicks, five sideways flicks, five progressively harder flicks, eight alternating swings and natural ringing. Note the number of audible rings and any misses, duplicates, latency or changes in grip. Export all completed trials together with Download JSON or Share / Save JSON; send the file to the person investigating the detector. Trials are kept in memory until exported or the page is closed. No data is uploaded automatically and no microphone is accessed.

The JSON includes raw browser motion readings (including missing values), exact detector input time relative to the trial start, browser event timestamps, per-sample settings, clapper position/velocity and rearm state, detector outputs, and separate audio scheduling events. The audio timestamps indicate scheduling, not measured speaker output. Detector version remains 5; diagnostics do not change its motion algorithm.
