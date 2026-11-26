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

The default recording is intended to be `bell.mp3`, **Bronze bell #2** by Pierre Sibanarco (BigSoundBank), [source and CC0 license](https://bigsoundbank.com/bronze-bell-2-s2704.html). The Import CC0 bell recording workflow fetches the original MP3 from the source and commits it to main. If the workflow is unavailable or fails, download the MP3 from the source page and place it in the repository root as `bell.mp3`. GitHub Pages may need a manual redeployment after a bot-generated commit. No external request is made from the app to the audio provider.

Until the recording is present, or if it cannot be decoded, the app uses improved modal synthesis and reports the fallback. The selected recording has not yet been auditioned in this app. For real chromatic handbell samples, see [radwoc's CC0 recordings](https://freesound.org/people/radwoc/sounds/370001/); these contain multiple ringing techniques and need to be edited into individual strikes before use.

### Validation

Simulated motion at approximately 60 Hz produces no strikes at rest or with slow tilt; sinusoidal forward and sideways wrist swings generate alternating impacts; the wrong axis is rejected in tuned mode. The physical parameters have not been calibrated on a real iPhone or Android device.
