# Document Scanner #

Scan an image for a document outline, crop it, and translate it into a rectangle.

## Usage ##

The following assumes OpenCV.js is loaded and running in your environment and "mat" is a cv.Mat instance.

```javascript
// create a DocumentScanner instance and provide the OpenCV object
const scanner = new DocumentScanner(cv);

// scan an OpenCV Mat instance for a document
// returns a Mat of the cropped and translated document
const doc = scanner.scanImage(
    // source Mat
    mat,
    // whether an outline of the document should be drawn onto the source Mat
    true
);

```

## Example ##

Included in this repository is an example implemented with NodeJS which can be run within the `/example` directory via:

```bash
node index.js
```

By default a sample document is pre-loaded and scanned.  You may upload your own images to test.  Be sure that the image you upload had good contrast between the document and the background.

## Thanks ##

* [OpenCV](https://opencv.org/) for creating an amazing toolkit.
* [PyImageSearch](https://pyimagesearch.com/2014/09/01/build-kick-ass-mobile-document-scanner-just-5-minutes/) for a well documented and helpful tutorial to get things moving in the right direction.