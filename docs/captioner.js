const id = x => document.getElementById(x);
const sizeIn  = id('size-in');
const sizeOut = id('size-out');
const titleIn = id('title-in');
const urlIn   = id('url-in');
const canvas  = id('canvas');
const errOut  = id('err');
const ctx = canvas.getContext('2d', { alpha: false });

let currImgUrl = null;
let currImg = null;
let currImgLoad = null;
let currImgAbort = null;

sizeIn.oninput = () => {
	updateFontSizeOut();
	renderFromIn();
};
titleIn.oninput = () => renderFromIn();
urlIn.oninput = () => {
	currImgUrl = '';
	renderFromIn();
};

function updateFontSizeOut() {
	sizeOut.innerText = sizeIn.value.padStart(2, '0');
}

function loadImg(url, abortSignal) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onerror = () => {
			clearListeners();
			reject(new Error('Failed to load image from '+url));
		};
		img.onload = () => {
			clearListeners();
			resolve(img);
		};
		const onAbort = () => {
			clearListeners();
			img.src = '';
			reject(new Error('Image load aborted'));
		};
		const clearListeners = () => {
			if (abortSignal) {
				abortSignal.removeEventListener('abort', onAbort);
			}
			img.onerror = null;
			img.onload = null;
		};
		if (abortSignal) {
			abortSignal.addEventListener('abort', onAbort);
		}
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
	errOut.hidden = true;
	canvas.hidden = true;
	if (urlIn.value) {
		try {
			const url = urlIn.value;
			if (url !== currImgUrl) {
				if (currImgAbort) {
					currImgAbort.abort();
				}
				currImgUrl = url;
				currImgAbort = new AbortController();
				currImgLoad = loadImg(url, currImgAbort.signal);
				currImg = null;
			}
			if (currImgLoad) {
				currImg = await currImgLoad;
			} else if (!currImg) {
				return;
			}
			currImg = currImg || await currImgLoad;
		} catch (e) {
			currImgLoad = null;
			errOut.hidden = false;
			errOut.innerText = 'Failed to load URL';
			throw e;
		}
		const fontSize = parseInt(sizeIn.value, 10) || 20;
		try {
			render(currImg, titleIn.value, fontSize);
			canvas.hidden = false;
		} catch (e) {
			errOut.hidden = false;
			errOut.innerText = 'Failed to render: ' + e;
			throw e;
		}
	}
}

function render(img, title, fontSize) {
	ctx.font = fontSize + 'px arial';
	const textMarginH = 1 * fontSize;
	const textMarginTop = 1 * fontSize;
	const textMarginBot = 0.9 * fontSize;
	const lineHeight = 1.2 * fontSize;
	const titleWidth = img.naturalWidth - 2 * textMarginH;
	const lines = wrapLine(ctx, title, titleWidth);
	const titleHeight = (lines.length > 0) ? fontSize + lineHeight * (lines.length - 1) : 0;
	const titleBoxHeight = Math.ceil(titleHeight + textMarginTop + textMarginBot);
	canvas.width = img.naturalWidth;
	canvas.height = img.naturalHeight + titleBoxHeight;
	ctx.font = fontSize + 'px arial';
	ctx.textBaseline = 'top';
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, canvas.width, titleBoxHeight);
	ctx.drawImage(img, 0, titleBoxHeight);
	ctx.fillStyle = '#000';
	let titleY = textMarginTop;
	for (const line of lines) {
		ctx.fillText(line, textMarginH, titleY);
		titleY += lineHeight;
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
	renderFromIn();
}

loadFromQuery(location.search);
