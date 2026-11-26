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
