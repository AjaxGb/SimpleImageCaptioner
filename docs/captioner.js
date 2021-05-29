const id = x => document.getElementById(x);
const sizeIn  = id('size-in');
const sizeOut = id('size-out');
const titleIn = id('title-in');
const urlIn   = id('url-in');
const canvas  = id('canvas');
const errOut  = id('err');
const ctx = canvas.getContext('2d', { alpha: false });

sizeIn.oninput = () => {
	updateFontSizeOut();
	renderFromIn();
};
titleIn.oninput = () => renderFromIn();
urlIn.onchange = () => renderFromIn();

function updateFontSizeOut() {
	sizeOut.innerText = sizeIn.value.padStart(2, '0');
}

function filterImgUrl(inUrl) {
	const url = new URL(inUrl);
	if (url.host === 'preview.redd.it') {
		url.host = 'i.redd.it';
		url.search = '';
	}
	return url;
}

function loadImg(url) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onerror = () => reject(
			new Error('Failed to load image from '+url));
		img.onload = () => resolve(img);
		img.src = url;
	});
}

function wrapLine(ctx, text, maxWidth) {
	const words = text.split(' ');
  	const lines = [];
	let currLine = words.shift();
	for (const word of words) {
		const newLine = currLine + ' ' + word;
		const newMeasure = ctx.measureText(newLine);
		if (newMeasure.width > maxWidth) {
			lines.push(currLine);
			currLine = word;
		} else {
			currLine = newLine;
		}
	}
	if (currLine) {
		lines.push(currLine);
	}
	return lines;
}

async function renderFromIn() {
	const url = filterImgUrl(urlIn.value).href;
	const fontSize = parseInt(sizeIn.value, 10);
	await render(url, titleIn.value, fontSize);
}

async function render(imgUrl, title, fontSize) {
	try {
		const img = await loadImg(imgUrl);
		ctx.font = fontSize + 'px arial';
		const textMarginH = 1 * fontSize;
		const textMarginV = 1 * fontSize;
		const lineHeight = 1.2 * fontSize;
		const titleWidth = img.naturalWidth - 2 * textMarginH;
		const lines = wrapLine(ctx, title, titleWidth);
		const titleHeight = (lines.length > 0) ? fontSize + lineHeight * (lines.length - 1) : 0;
		const titleBoxHeight = Math.ceil(titleHeight + 2 * textMarginV);
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight + titleBoxHeight;
		ctx.font = fontSize + 'px arial';
		ctx.textBaseline = 'top';
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, canvas.width, titleBoxHeight);
		ctx.drawImage(img, 0, titleBoxHeight);
		ctx.fillStyle = '#000';
		let titleY = textMarginV;
		for (const line of lines) {
			ctx.fillText(line, textMarginH, titleY);
			titleY += lineHeight;
		}
	} catch (e) {
		errOut.innerText = e;
		throw e;
	}
}

function loadFromQuery(queryString) {
	const params = new URLSearchParams(queryString);
	const title = params.get('caption') || '';
	const imgUrl = params.get('img') || '';
	const fontSize = parseInt(params.get('fontsz'), 10);
	if (fontSize) {
		sizeIn.value = fontSize;
		updateFontSizeOut();
	}
	titleIn.value = title;
	urlIn.value = imgUrl;
	if (title || imgUrl) {
		renderFromIn();
	}
}

loadFromQuery(location.search);
