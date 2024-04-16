const http = require('http');
const fs = require('fs/promises');

const server = http.createServer(async (req, res) => {
	switch(req.url) {
		case '/': {
			res.end(`
				<!DOCTYPE html>
				<html>
					<head>
						<meta charset="utf-8">
						<title>Document Scanner Example</title>
					</head>
					<body>
						<h1>Document Scanner Example</h1>
						<fieldset>
							<legend>Upload an image</legend>
							<img id="imageSrc" alt="No Image" src="/example_image.png" />
							<div class="caption"><input type="file" id="fileInput" name="file" /></div>
						</fieldset>
						<fieldset>
							<legend>Detected document</legend>
							<canvas id="outline"></canvas>
						</fieldset>
						<fieldset>
							<legend>Cropped &amp; transfomed document</legend>
							<canvas class="output"></canvas>
							<canvas class="output"></canvas>
							<canvas class="output"></canvas>
							<canvas class="output"></canvas>
							<canvas class="output"></canvas>
							<canvas class="output"></canvas>
							<canvas class="output"></canvas>
							<canvas class="output"></canvas>
							<pre id="outputText"></pre>
						</fieldset>
						<script type="module" src="/app.js"></script>
					</body>
				</html>
			`);
			break;
		}
		case '/example_image.png': {
			res.setHeader('Content-Type', 'image/webp');
			res.end(await fs.readFile('./example_image.png'));
			break;
		}
		case '/app.js': {
			res.setHeader('Content-Type', 'text/javascript');
			res.end(await fs.readFile('./app.js'));
			break;
		}
		case '/DocumentScanner.js': {
			res.setHeader('Content-Type', 'text/javascript');
			res.end(await fs.readFile('../DocumentScanner.js'));
			break;
		}
		default:
			res.end('');
	}
	
	
});

server.listen(12345, () => console.log(`Server running at: http://localhost:${server.address().port}/`));