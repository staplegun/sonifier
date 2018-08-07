# Sonifier

Generate sounds that represents an image within a web browser.

Sonifier provides a tonal soundtrack when viewing images. The sound changes
based on what is currently visible, e.g. the current image in a slideshow,
or panning around a single image.

It plays and holds notes on a synthesizer, then adjusts the volume of those
notes depending on the brightness of red, green, and blue channels in each
pixel in the visible image. By regularly re-sampling the image as it is
changed, the sound heard will adjust as the relative colour brightnesses
change within the currently visible image (see 'How it works' below).

## Demo

Sonifier is used in the 'hum' option in [Arotahi](https://staplegun.github.io/arotahi/)

## Usage

The library is simple Javascript so include it directly.

NB: Currently it does not work in Internet Explorer (as the code uses `class`
and there is no transpiling pipeline set up).

```HTML
<canvas id="canvas" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/13.1.4/Tone.js"></script>
<script src="https://rawgit.com/staplegun/sonifier/master/sonifier.min.js"></script>

<script type="text/javascript">
let canvasElement = document.getElementById('mycanvas');
let sonifier = new Sonifier()

// usually each method below would be called by a triggering action
sonifier.play()
sonifier.analyseCanvas(canvasElement)
sonifier.release()

sonifier.play()
sonifier.pollCanvasStart(canvasElement, 3)
sonifier.pollCanvasStop()
sonifier.release()
</script>
```

## Config

* Notes can be specified as frequency numbers (like 440) or pitch-octave (like D#2) - see: [Tone.js](https://tonejs.github.io/)
* There are two image analysis strategies available: `absolute` and `tiers`

```javascript
let sonifierConfig = {
  "synthRedNotes" = ["C2", "E2"],
  "synthGreenNotes" = ["G3", "D4"],
  "synthBlueNotes" = ["A3", "C4"],
  "dynamicRange" = 30,
  "imagePixelSampling" = 10,
  "imageAnalysisStrategy" = "absolute"
}
let sonifier = new Sonifier(sonifierConfig)
```

## How it works

Each colour channel plays two music notes that represent it.
The default tones combine into a 'C 6/9' chord,
using notes from the Pentatonic scale giving a drone-like sound:
* Red: Major third
* Green: Fifth
* Blue: Minor third.

Sonifier analyses the image pixels in a selected canvas element in the web page:
* Counts up the brightness levels of each channel (sampling one pixel in each 10x10 grid to improve real-time performance)
* Converts the channel average brightness value (0-255) to decibels (-30 to 0dB)
* Adjusts the volume of the notes playing for each channel to the new decibel level.

Sometimes the sound doesn't change much when the image is changed because the
averaging evens out the bright and dark areas. To help overcome this,
three algorithms are available to exaggerate the sound generated from
the visual brightness changes:
* Sinusoidal curve - low & high values are compressed (less pronounced change) and mid-range values are expanded (more pronounced change)
* Absolute - brightness values are translated directly to equivalent volume values (default)
* Volume tiers - the brightest, middle, and dimmest channels are set to three preset volume levels, so one channel will always be loud and another quiet (regardless of their actual brightness values).

## Documentation

* [Sonifier API documentation](https://staplegun.github.io/sonifier/)
* [Sonifier GitHub repository](https://github.com/staplegun/sonifier/)

## Requires

[Tone.js](https://tonejs.github.io/)

## Licence

This project is licensed under the MIT Licence - see the
[LICENSE](LICENSE) file for details
