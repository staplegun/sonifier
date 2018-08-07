/********************************************************************
* Copyright (c) 2018, Douglas Campbell
* Licensed under the MIT License
********************************************************************/

/**
__Image Sonifier__

Generation of audio that represents an image.

Plays and holds notes on a synthesizer, then adjusts the volume of those
notes depending on the brightness of red, green, and blue channels in each
pixel in an image. By regularly re-sampling the image as it is changed,
the sound heard will adjust as the relative colour brightnesses change
within the currently visible image.

Source: [GitHub repository](https://github.com/staplegun/sonifier)

Requires [Tone.js](https://tonejs.github.io/) -
`<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/13.1.4/Tone.js"></script>`

_Implementation notes_

The default tones combine into a 'C 6/9' chord (which uses notes from the
Pentatonic scale giving a drone-like sound):
- Red: Major third
- Green: Fifth
- Blue: Minor third
*/
class Sonifier {

  /**
  * Constructs a Sonifier.
  * @param {Object}
  */
  constructor(config) {
    // set defaults
    this._synthConfig = Sonifier.defaultSynthConfig
    this._synthRedNotes = Sonifier.defaultRedNotes
    this._synthGreenNotes = Sonifier.defaultGreenNotes
    this._synthBlueNotes = Sonifier.defaultBlueNotes
    this._dynamicRange = Sonifier.defaultDynamicRange
    this._imagePixelSampling = Sonifier.defaultImagePixelSamplingDistance
    this._imageAnalysisStrategy = Sonifier.defaultImageAnalysisStrategy

    // NB: panning each to give wider soundscape
    this._volRed = new Tone.PanVol(0, -10)
    this._volGreen = new Tone.PanVol(-0.5, -10)
    this._volBlue = new Tone.PanVol(0.5, -10)

    this._masterVolume = new Tone.Volume(0)

    //let effect = new Tone.Vibrato(1, 0.5)
    //let effect = new Tone.Chorus(1, 2.5, 0.2)
    //let effect = new Tone.LowpassCombFilter()
    let effect = new Tone.Compressor()

    // apply supplied config parameters
    if (config) {
      if (config.synthConfig) this._synthConfig = config.synthConfig
      if (config.synthRedNotes) this._synthRedNotes = config.synthRedNotes
      if (config.synthGreenNotes) this._synthGreenNotes = config.synthGreenNotes
      if (config.synthBlueNotes) this._synthBlueNotes = config.synthBlueNotes
      if (config.dynamicRange && config.dynamicRange >= 1) this._dynamicRange = config.dynamicRange
      if (config.imagePixelSampling && config.imagePixelSampling >= 1) this._imagePixelSampling = config.imagePixelSampling
      if (config.imageAnalysisStrategy) this._imageAnalysisStrategy = config.imageAnalysisStrategy
    }

    // create synths
    this._synthRed = new Tone.PolySynth(3, Tone.Synth, this._synthConfig)
    this._synthGreen = new Tone.PolySynth(3, Tone.Synth, this._synthConfig)
    this._synthBlue = new Tone.PolySynth(3, Tone.Synth, this._synthConfig)
    this._synthRed.chain(this._volRed, effect, this._masterVolume, Tone.Master)
    this._synthGreen.chain(this._volGreen, effect, this._masterVolume, Tone.Master)
    this._synthBlue.chain(this._volBlue, effect, this._masterVolume, Tone.Master)
  }

  /**
  * Starts playing the synthesizer notes for the red channel.
  */
  playRed() {
    this._synthRed.triggerAttack(this._synthRedNotes)
  }

  /**
  * Starts playing the synthesizer notes for the green channel.
  */
  playGreen() {
    this._synthGreen.triggerAttack(this._synthGreenNotes)
  }

  /**
  * Starts playing the synthesizer notes for the blue channel.
  */
  playBlue() {
    this._synthBlue.triggerAttack(this._synthBlueNotes)
  }

  /**
  * Starts playing the synthesizer notes for all (red/green/blue) channels.
  */
  play() {
    console.log("Playing sonifier")
    this.playRed()
    this.playGreen()
    this.playBlue()
  }

  /**
  * Stops playing the synthesizer notes for the red channel.
  */
  releaseRed() {
    this._synthRed.triggerRelease(this._synthRedNotes)
  }

  /**
  * Stops playing the synthesizer notes for the green channel.
  */
  releaseGreen() {
    this._synthGreen.triggerRelease(this._synthGreenNotes)
  }

  /**
  * Stops playing the synthesizer notes for the blue channel.
  */
  releaseBlue() {
    this._synthBlue.triggerRelease(this._synthBlueNotes)
  }

  /**
  * Stops playing the synthesizer notes for all (red/green/blue) channels.
  */
  release() {
    console.log("Silencing sonifier")
    this.releaseRed()
    this.releaseGreen()
    this.releaseBlue()
  }

  /**
  * Changes the red channel synthesizer to the specified volume.
  * @param {Number} - New volume: 0 (silence) - 255 (max)
  */
  volumeRed(vol = 100) {
    this._volRed.volume.rampTo(Sonifier.toDecibelSine(vol, this._dynamicRange), 0.5)
  }

  /**
  * Changes the green channel synthesizer to the specified volume.
  * @param {Number} - New volume: 0 (silence) - 255 (max)
  */
  volumeGreen(vol = 100) {
    this._volGreen.volume.rampTo(Sonifier.toDecibelSine(vol, this._dynamicRange), 0.5)
  }

  /**
  * Changes the blue channel synthesizer to the specified volume.
  * @param {Number} - New volume: 0 (silence) - 255 (max)
  */
  volumeBlue(vol = 100) {
    this._volBlue.volume.rampTo(Sonifier.toDecibelSine(vol, this._dynamicRange), 0.5)
  }

  /**
  * Changes the master volume to the specified volume.
  * @param {Number} - New volume: -60 (silence) - 0 (max)
  */
  volumeMaster(vol = -10) {
    this._masterVolume.volume.rampTo(vol, 0.5)
  }

  /**
  * Calculates an appropriate decibel volume for the supplied value.
  * Converts from pixel brightness (0 to 255) to decibel (-dynamicRange to 0).
  *
  * Applies a sinusoidal curve so low & high values are compressed
  * (less pronounced change) and mid-range values are expanded
  * (more pronounced change).  Rationale: brightness changes nearer very
  * bright or very dark are less noticeable, so we want to reflect
  * that in the resulting volume.
  *
  * The default dynamic range is -30 to 0 dB. NB: -60 dB is absolute silence
  * in Tone.js, we use -30 dB as the minimum so there is always some sound.
  *
  * @param {Number} - Range: 0 (silence) - 255 (max)
  * @param {Integer} - Range of values to return to represent from silence to maximum volume: 0 - 60
  * @return {Number} - Range: -30 (silence) - 0 (max)
  */
  static toDecibelSine(value, dynamicRange = Sonifier.defaultDynamicRange) {
    // convert vol (range 0-255) into sinusoidal -1 - +1, then adjust to desired dynamic range
    // we only want a half cycle of the sine wave (from min to max)
    // see: http://mathonweb.com/help_ebook/html/trigonometry.htm#sinusoidal
    // a. phase length: divide value by 255 so in range 0-1,
    //    multiply by pi so half cycle is in range 0-1
    // b. phase shift: subtract half pi (so we start at min value)
    // c. calculate sine, giving range -1 to +1
    // d. amplitude: multply by half dynamic range (giving range e.g. -15 to +15),
    //    subtract half dynamic range so final range is e.g. -30 to 0
    return ((dynamicRange / 2) * Math.sin( (3.141 * value / 255) - (3.141 / 2) )) - (dynamicRange / 2)
  }

  /**
  * Analyses once the image data in the HTML canvas in the specified HTML
  * element and adjusts the appropriate sonifier volumes.
  * NB: The sonifier must already be playing for any sound to be heard.
  *
  * Supported image analysis strategies:
  * - `absolute` = translate each channel brightness value to an equivalent volume value (default)
  * - `tiers` = set the min/mid/max channel brightnesses to pre-defined volume tiers
  *
  * @param {Object} - HTML Canvas Element
  * @param {String}
  */
  analyseCanvas(canvasElement, imageAnalysisStrategy = this._imageAnalysisStrategy) {
    if (canvasElement === undefined || canvasElement == null) {
      return
    }
    switch (imageAnalysisStrategy) {
      case 'tiers':
      this.analyseImageTiers(
        canvasElement.getContext("2d")
        .getImageData(0, 0, canvasElement.width, canvasElement.height)
      )
      break;
      default:
      this.analyseImageAbsolutes(
        canvasElement.getContext("2d")
        .getImageData(0, 0, canvasElement.width, canvasElement.height)
      )
    }
  }

  // TODO possible new strategy: divide image into 9 zones and analyse independently
  // e.g. if 2/3 grass and 1/3 sky, the overall averages just see a lot of blue

  /**
  * Analyses once the supplied image data and adjusts the appropriate
  * sonifier volumes.
  * NB: The sonifier must already be playing for any sound to be heard.
  *
  * Sets each channel volume based on its absolute average brightness.
  *
  * This strategy is accurate, but many images contain such a range of
  * colours that the channel averages end up in a similar range (50-180).
  * We use a sinusoidal compression to expand this mid-range, but often
  * the volume changes still don't seem very pronounced.
  *
  * @param {ImageData} - See: https://developer.mozilla.org/en-US/docs/Web/API/ImageData
  */
  analyseImageAbsolutes(imagePixelData) {
    if (imagePixelData.height <= 1 || imagePixelData.width <= 1) {
      return
    }

    let brightness = Sonifier.calculateBrightnessAverages(imagePixelData, this._imagePixelSampling)

    console.log('Sonifying brightness: R=' + brightness['red'].toFixed(0) + ' G=' + brightness['green'].toFixed(0) + ' B=' + brightness['blue'].toFixed(0))
    console.log('Sonifying decibels: R=' + Sonifier.toDecibelSine(brightness['red']).toFixed(0) + ' G=' + Sonifier.toDecibelSine(brightness['green']).toFixed(0) + ' B=' + Sonifier.toDecibelSine(brightness['blue']).toFixed(0))

    this.volumeRed(brightness['red'])
    this.volumeGreen(brightness['green'])
    this.volumeBlue(brightness['blue'])
  }

  /**
  * Analyses once the supplied image data and adjusts the appropriate sonifier volumes.
  * NB: The sonifier must already be playing for any sound to be heard.
  *
  * Has three set volume tiers (defined in Sonifier.tierVolumes) and uses
  * only those volume levels for the RGB channel volumes based on which is
  * brightest, middle, and dimmest. In addition, an overall volume is set
  * based on the absolute brightness of the brightest channel - this provides
  * some variation for black & white images (which have the same brightness
  * for all three RGB channels).
  *
  * This strategy gives more obvious volume changes, but is fairly
  * artificial (e.g. all three may be similar brightness but the one
  * slightly brighter gets a very high volume).
  *
  * @param {ImageData} - See: https://developer.mozilla.org/en-US/docs/Web/API/ImageData
  */
  analyseImageTiers(imagePixelData) {
    if (imagePixelData.height <= 1 || imagePixelData.width <= 1) {
      return
    }

    let brightness = Sonifier.calculateBrightnessAverages(imagePixelData, this._imagePixelSampling)

    let min = Math.min(brightness['red'], brightness['green'], brightness['blue'])
    let max = Math.max(brightness['red'], brightness['green'], brightness['blue'])

    // multiplier for overall brightness (0-1)
    let multiplier = max / 255

    // set the volume for each channel using the predefined volume tiers
    let red, green, blue
    switch (brightness['red']) {
      case min:
        red = Sonifier.tierVolumes[0] * multiplier
        break;
      case max:
        red = Sonifier.tierVolumes[2] * multiplier
        break;
      default:
        red = Sonifier.tierVolumes[1] * multiplier
    }
    switch (brightness['green']) {
      case min:
        green = Sonifier.tierVolumes[0] * multiplier
        break;
      case max:
        green = Sonifier.tierVolumes[2] * multiplier
        break;
      default:
        green = Sonifier.tierVolumes[1] * multiplier
    }
    switch (brightness['blue']) {
      case min:
        blue = Sonifier.tierVolumes[0] * multiplier
        break;
      case max:
        blue = Sonifier.tierVolumes[2] * multiplier
        break;
      default:
        blue = Sonifier.tierVolumes[1] * multiplier
    }

    console.log('Sonifying brightness: R=' + brightness['red'].toFixed(0) + ' G=' + brightness['green'].toFixed(0) + ' B=' + brightness['blue'].toFixed(0))
    console.log('Sonifying tiered: R=' + red.toFixed(0) + ' G=' + green.toFixed(0) + ' B=' + blue.toFixed(0))
    console.log('Sonifying decibels: R=' + Sonifier.toDecibelSine(red).toFixed(0) + ' G=' + Sonifier.toDecibelSine(green).toFixed(0) + ' B=' + Sonifier.toDecibelSine(blue).toFixed(0))

    this.volumeRed(red)
    this.volumeGreen(green)
    this.volumeBlue(blue)
  }

  /**
  * Calculates the average brightness of pixels in the supplied image data.
  * Only samples every Nth pixel (in a grid across the whole image)
  * to improve performance.
  *
  * @param {ImageData} - See: https://developer.mozilla.org/en-US/docs/Web/API/ImageData
  * @param {Integer} - How many pixels to sample, i.e. every Nth pixel
  * @return {Object} - properties for each channel (range 0-255): 'red', 'green', 'blue'
  */
  static calculateBrightnessAverages(imagePixelData, imagePixelSamplingDistance = Sonifier.defaultImagePixelSamplingDistance) {
    let width = imagePixelData.width
    let height = imagePixelData.height
    let red = 0, green = 0, blue = 0
    // let alpha, grey

    // NB: use less variable memory by adding up all values for each channel, then extrapolate
    for (let col = 0; col < width; col += imagePixelSamplingDistance) {
      for (let row = 0; row < height; row += imagePixelSamplingDistance) {
        red += imagePixelData.data[Sonifier.getColorIndicesForCoord(col, row, width)[0]]
        green += imagePixelData.data[Sonifier.getColorIndicesForCoord(col, row, width)[1]]
        blue += imagePixelData.data[Sonifier.getColorIndicesForCoord(col, row, width)[2]]
        // alpha += imagePixelData.data[ Sonifier.getColorIndicesForCoord(col, row, width)[3] ]
        // grey += (red + green + blue) / 3
        // console.log(col + 'x' + row + ': ' + red + ',' + green + ',' + blue + ',' + alpha )
      }
    }

    // extrapolate total sampled channel values across the whole image to get average
    // - assume every pixel in the sampled square has the same value
    // - then divide by total pixels in the image
    red = red * (imagePixelSamplingDistance * imagePixelSamplingDistance) / (width * height)
    green = green * (imagePixelSamplingDistance * imagePixelSamplingDistance) / (width * height)
    blue = blue * (imagePixelSamplingDistance * imagePixelSamplingDistance) / (width * height)

    return {
      "red": red,
      "green": green,
      "blue": blue
    }
  }

  /**
  * Starts regular analysis of the specified HTML canvas element at the
  * specified time interval.
  * NB: The sonifier must already be playing for any sound to be heard.
  *
  * @param {Object}
  * @param {Number} - How often to analyse the canvas in seconds
  */
  pollCanvasStart(canvasElement, intervalSecs = 2) {
    this._pollTimer = setInterval(function() {
      sonifier.analyseCanvas(canvasElement)
    }, intervalSecs * 1000)
  }

  /**
  * Stops the regular analysis of the specified HTML canvas element.
  * NB: The sonifier will continue to play the existing notes until stopped.
  */
  pollCanvasStop() {
    clearInterval(this._pollTimer)
  }

  /**
  * Calculates the offset inside an ImageData array that the specified pixel
  * data is. Returns an array of four offsets for the four bytes describing
  * the single pixel (RGBA), e.g. `getColorIndicesForCoord(x,y,w)[2]`
  * returns the pixel's blue value
  *
  * See: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
  *
  * @param {Integer}
  * @param {Integer}
  * @param {Integer}
  * @return {Array} - Absolute array offsets for the four bytes describing the single pixel (RGBA)
  */
  static getColorIndicesForCoord(x, y, imageWidth) {
    let redOffset = y * (imageWidth * 4) + x * 4
    return [redOffset, redOffset + 1, redOffset + 2, redOffset + 3]
  }

}

Sonifier.defaultSynthConfig = {
  "oscillator": {
    "type": "fatsine",
    "count": 3,
    "spread": 30
  },
  "envelope": {
    "attack": 0.01,
    "decay": 0.1,
    "sustain": 0.5,
    "release": 5.0,
    "attackCurve": "exponential"
  }
}
Sonifier.defaultRedNotes = ['C2', 'E2']
Sonifier.defaultGreenNotes = ['G3', 'D4']
Sonifier.defaultBlueNotes = ['A3', 'C4']
Sonifier.defaultDynamicRange = 30
Sonifier.defaultImagePixelSamplingDistance = 10
Sonifier.defaultImageAnalysisStrategy = 'absolute'
Sonifier.tierVolumes = [80, 180, 255]
