import DocumentScanner from "../DocumentScanner.js";

let scanner = null;
let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');
let outline = document.getElementById('outline');
let output = document.getElementsByClassName('output');
let outputText = document.getElementById('outputText');

// run after openCV is ready
const openCvReady = () => {
	scanner = new DocumentScanner(cv);

	// load the image when one is selected
	inputElement.addEventListener('change', (e) => {
		imgElement.src = URL.createObjectURL(e.target.files[0]);
	}, false);

	// scan the image when loaded
	imgElement.onload = scanImage;

	//validate the default image
	scanImage();
};

// here's where the magic happens. =D
const scanImage = async () => {
	for(let i = 0 ; i < output.length; i ++) {
		const context = output[i].getContext('2d');
		context.clearRect(0, 0, output[i].width, output[i].height);
	}
	const start = Date.now();
	let mat = cv.imread(imgElement);
	const out = scanner.scanImage(mat, true);
	outputText.textContent = `Completed in ${Date.now() - start} milliseconds.`;
	cv.imshow(outline, mat);
	for(let i = 0 ; i < out.length; i +=2) {

		cv.imshow(output[i], out[i]);
		out[i].delete();
	}
	mat.delete();
};

// https://emscripten.org/docs/api_reference/module.html#Module.onRuntimeInitialized
window.Module = {
	onRuntimeInitialized: openCvReady
};
// load openCv
const script = document.createElement('script');
script.src = 'https://docs.opencv.org/4.7.0/opencv.js';
document.body.appendChild(script);