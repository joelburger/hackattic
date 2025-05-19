const axios = require('axios');
const fs = require('fs');
const path = require('path');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');

async function fetchAndSaveImage(imageUrl, outputFilePath) {
	try {
		const response = await axios({
			url: imageUrl,
			method: 'GET',
			responseType: 'stream',
		});

		const writer = fs.createWriteStream(outputFilePath);

		response.data.pipe(writer);

		return new Promise((resolve, reject) => {
			writer.on('finish', resolve);
			writer.on('error', reject);
		});
	} catch (error) {
		console.error('Error fetching the image:', error);
		throw error;
	}
}

async function fetchImageUrl(challengeUrl) {
	try {
		const response = await axios.get(challengeUrl);
		const { image_url } = response.data;

		return image_url;
	} catch (error) {
		console.error('Error fetching the image URL:', error);
		throw error;
	}
}

async function decodeQr(imageFilePath) {
	return new Promise((resolve, reject) => {
		fs.createReadStream(imageFilePath)
			.pipe(new PNG())
			.on('parsed', function () {
				const code = jsQR(new Uint8ClampedArray(this.data), this.width, this.height);

				if (code) {
					console.log('Found QR code:', code.data);
					resolve(code.data);
				} else {
					console.log('No QR code found.');
					reject(new Error('No QR code found.'));
				}
			})
			.on('error', (err) => {
				console.error('Error decoding the QR code:', err);
				reject(err);
			});
	});
}

async function sendAnswer(answerUrl, answer) {
	try {
		const response = await axios.post(answerUrl, {
			code: answer,
		});
		return response.data;
	} catch (error) {
		console.error('Error sending the answer:', error);
		throw error;
	}
}

(async () => {
	try {
		const challengeUrl = 'https://hackattic.com/challenges/reading_qr/problem?access_token=bb15151e26c87e22';
		const imageUrl = await fetchImageUrl(challengeUrl);
		console.log(`Image URL: ${imageUrl}`);

		const imageFilePath = path.join(__dirname, 'downloaded_image.png');

		await fetchAndSaveImage(imageUrl, imageFilePath);
		console.log('Image downloaded successfully!');

		const code = await decodeQr(imageFilePath);
		const answerUrl = 'https://hackattic.com/challenges/reading_qr/solve?access_token=bb15151e26c87e22';

		const response = await sendAnswer(answerUrl, code);
		console.log('Answer response:', response);
	} catch (err) {
		console.error('An error occurred:', err);
	}
})();