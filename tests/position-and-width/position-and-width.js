'use strict';
function putBorderOverBox() {
	const box = document.getElementById('centre');
	const border = document.getElementById('border');
	const bounds = box.getBoundingClientRect();

	for (const key of ['left', 'width']) {
		document.getElementById(key).innerText = bounds[key].toFixed(0);
	}

	document.getElementById('inner-width').innerText = window.innerWidth;
	document.getElementById('client-width').innerText = document.documentElement.clientWidth;

	border.style.top = window.scrollY + bounds.top + 'px';
	border.style.left = window.scrollX + bounds.left + 'px';
	border.style.width = bounds.width + 'px';
	border.style.height = bounds.height + 'px';
}

window.addEventListener('load', putBorderOverBox);
window.addEventListener('resize', putBorderOverBox);
