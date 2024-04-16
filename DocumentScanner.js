export const MAX_WIDTH = 480;

export default class DocumentScanner {
	#cv = null;
	constructor(cv) {
		if(cv === null || typeof cv !== 'object')
			throw new TypeError('cv must be an object.');

		this.#cv = cv;
	}
	get cv() {
		return this.#cv;
	}
	scanImage(src, addOutline = false) {
		if(!(src instanceof this.cv.Mat))
			throw new TypeError('src must be an OpenCV Mat object.');
		if(typeof addOutline !== 'boolean')
			throw new TypeError('addOutline must be a boolean.');

		// make sure the image is scaled to an appropriate size
		const dst = new this.cv.Mat();

		// calculate scale scale targeting 480 pixel width
		const scale = MAX_WIDTH / src.cols;
		this.cv.resize(src, dst, new this.cv.Size(Math.round(src.cols * scale), Math.round(src.rows * scale)), 0, 0, this.cv.INTER_AREA);

		// Remove alpha channel from image
		this.cv.cvtColor(dst, dst, this.cv.COLOR_RGBA2RGB, 0);
		
		// Convert to grayscale
		this.cv.cvtColor(dst, dst, this.cv.COLOR_RGB2GRAY);
		
		// Apply a Gaussian blur
		this.cv.GaussianBlur(dst, dst, new this.cv.Size(5, 5), 0);
		
		// Canny edge detection
		this.cv.Canny(dst, dst, 75, 200);
		
		// Find contours
		const contours = new this.cv.MatVector();
		const hierarchy = new this.cv.Mat();
		this.cv.findContours(dst, contours, hierarchy, this.cv.RETR_LIST, this.cv.CHAIN_APPROX_SIMPLE);
		
		// Identify the largest contour representing a page
		const contour = this.getPageContours(
			this.getLargestContours(
				this.matVectorToArray(contours),
				9
			)
		) || null;

		let imgArr = [];
		// reverse-scale the contour
		for(let i = 0 ; i < contour.length; i ++) {
			if(contour[i])
				this.scaleContour(contour[i], 1/scale);
			// crop and transform the detected document
			const img = contour[i] ? this.fourPointTransform(src, contour[i]) : null;
	
			// draw the contour
			if(addOutline && contour[i])
				this.cv.drawContours(src, this.arrayToMatVector([contour[i]]), -1, new this.cv.Scalar(0, 255, 0, 255), 3, this.cv.LINE_8, hierarchy, 0);
			
			// clean up
			// contour?.delete();
			// hierarchy.delete();
			// contours.delete();
			// dst.delete();
	
			imgArr.push(img);
		}
		return imgArr;
	}
	scaleContour(contour, scale) {
		for(let i = 0; i < contour.data32S.length; i++)
			contour.data32S[i] *= scale;
	}
	matVectorToArray(matVector) {
		if(!(matVector instanceof this.cv.MatVector))
			throw new TypeError('matVector must be an OpenCV MatVector object.');
		
		const out = [];
		for(let i = 0; i < matVector.size(); i++)
			out.push(matVector.get(i));
		return out;
	}
	arrayToMatVector(array) {
		const out = new this.cv.MatVector();
		for(const item of array)
			out.push_back(item);

		return out;
	}
	getLargestContours(contours, count) {

		return [...contours]
			// sort by area
			.sort((a, b) =>
				this.cv.contourArea(b, false) - this.cv.contourArea(a, false)
			)
			// return the requested count
			.slice(0, count);
	}
	getPageContours(contours) {
		if(!Array.isArray(contours))
			throw new TypeError('contours must be an Array.');
		if(contours.filter(contour => !(contour instanceof this.cv.Mat)).length > 0)
			throw new TypeError('contours array must only contain OpenCV Mat objects.');

		return contours
			.map(contour => {
				// determine the perimeter of the contour
				const perimeter = this.cv.arcLength(contour, true);

				// approximate the contour with fewer vertices
				const corners = new this.cv.Mat();
				this.cv.approxPolyDP(contour, corners, 0.02 * perimeter, true);

				return corners;
			})
			.filter(contour => {
				// does this contour have 4 points like a document would?
				const match = contour.rows === 4;

				// if not, clean it up
				if(!match)
					contour.delete();
				
				return match;
			});
	}
	fourPointTransform(src, contour) {
		if(!(src instanceof this.cv.Mat))
			throw new TypeError('src must be an OpenCV Mat object.');
		if(!(contour instanceof this.cv.Mat))
			throw new TypeError('contour must be an OpenCV Mat object.');
		
		// find the corners
		const cornerArray = [
			new this.cv.Point(Math.round(contour.data32S[0]), Math.round(contour.data32S[1])),
			new this.cv.Point(Math.round(contour.data32S[2]), Math.round(contour.data32S[3])),
			new this.cv.Point(Math.round(contour.data32S[4]), Math.round(contour.data32S[5])),
			new this.cv.Point(Math.round(contour.data32S[6]), Math.round(contour.data32S[7]))
		];
		// sort by Y position (to get top-down)
		cornerArray.sort((a, b) =>
			(a.y < b.y) ? -1 : (a.y > b.y) ? 1 : 0
		);

		// determine left/right based on x position of top and bottom 2
		const tl = cornerArray[0].x < cornerArray[1].x ? cornerArray[0] : cornerArray[1];
		const tr = cornerArray[0].x > cornerArray[1].x ? cornerArray[0] : cornerArray[1];
		const bl = cornerArray[2].x < cornerArray[3].x ? cornerArray[2] : cornerArray[3];
		const br = cornerArray[2].x > cornerArray[3].x ? cornerArray[2] : cornerArray[3];

		// calculate the max width/height
		const maxWidth = Math.max(
			Math.hypot(br.x - bl.x, br.y - bl.y), //top width
			Math.hypot(tr.x - tl.x, tr.y - tl.y) //bottom width
		);
		const maxHeight = Math.max(
			Math.hypot(tr.x - br.x, tr.y - br.y), //right height
			Math.hypot(tl.x - bl.x, tr.y - bl.y) //left height
		);

		// get the 3x3 perspective transformation matrix for the source coordinates and destination coordinates
		const srcCoords = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
		const dstCoords = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, [0, 0, maxWidth - 1, 0, maxWidth - 1, maxHeight - 1, 0, maxHeight - 1]);
		const M = this.cv.getPerspectiveTransform(srcCoords, dstCoords);
		
		// warp the source coordinates into destiniation coordinates and write to a new matrix
		let dsize = new this.cv.Size(maxWidth, maxHeight);
		const dst = new this.cv.Mat();
		this.cv.warpPerspective(src, dst, M, dsize, this.cv.INTER_LINEAR, this.cv.BORDER_CONSTANT, new this.cv.Scalar());

		// clean up
		M.delete();
		srcCoords.delete();
		dstCoords.delete();

		return dst;
	}
}