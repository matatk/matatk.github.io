'use strict';
/* global window document marked */
(function(win, doc) {
	const slides = doc.getElementsByClassName('slide')
	const progress = doc.querySelector('#progress > div')
	let current = null

	function hasBoolean(element, attrName) {
		return element.dataset[attrName] === ''
	}


	//
	// Moving between slides; fullscreen; toggle styles
	//

	function previousSlideNumber() {
		return current > 0 ? current - 1 : slides.length - 1
	}

	function nextSlideNumber() {
		return (current + 1) % slides.length
	}

	function updateProgressBar() {
		if (progress) {
			const percent = ((current + 1) / slides.length) * 100
			progress.style.width = percent + '%'
		}
	}

	function updateLocation() {
		win.location = `#slide-${current + 1}`
	}

	function setActiveSlide(number) {
		for (let i = 0; i < slides.length; i++) {
			const slide = slides[i]
			if (i !== number) {
				slide.classList.remove('active')
			} else {
				slide.classList.add('active')
			}
		}
		current = number
		updateProgressBar()
		updateLocation()
	}

	function toggleStyles() {
		for (const sheet of doc.styleSheets) {
			sheet.disabled = !sheet.disabled
		}
	}

	// If there are steps on the slide that are to be gradually revealed (more
	// info on this at the bottom) then go through those steps before advancing
	// to the next slide. Returns true to say "go to next slide" or false
	// otherwise.
	function revealStepsOrNextSlide() {
		const slide = slides[current]
		if (slide.dataset.pauseSteps) {
			const totalSteps = Number(slide.dataset.pauseSteps)
			const currentStep = Number(slide.dataset.pauseCurrentStep)
			if (currentStep === totalSteps) {
				return true
			}
			const nextStep = currentStep + 1
			const nextStepElement =
				slide.querySelector(`[data-pause-step="${nextStep}"]`)
			nextStepElement.style.visibility = 'visible'
			slide.dataset.pauseCurrentStep = nextStep
			return false
		}
		return true
	}

	function moveToPreviousSlide() {
		setActiveSlide(previousSlideNumber())
	}

	function moveToNextRevealOrSlide() {
		if (revealStepsOrNextSlide()) {
			setActiveSlide(nextSlideNumber())
		}
	}

	doc.addEventListener('keydown', function(event) {
		if (event.isComposing || event.keyCode === 229) return

		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'PageUp':
				moveToPreviousSlide()
				break
			case 'ArrowRight':
			case 'ArrowDown':
			case 'PageDown':
			case 'Space':  // FIXME doesn't work!
			case 'Enter':
			case 'Return':
				moveToNextRevealOrSlide()
				break
			case 'f':
				if (!doc.fullscreenElement) {
					doc.body.requestFullscreen()
				} else {
					doc.exitFullscreen()
				}
				break
			case 's':
				toggleStyles()
		}
	})

	doc.getElementById('previous').onclick = moveToPreviousSlide
	doc.getElementById('next').onclick = moveToNextRevealOrSlide


	//
	// Moving a specific slide if the URL requires it
	//

	function reflectLocation() {
		if (win.location.hash) {
			const match = win.location.hash.match(/^#slide-(\d+)$/)
			if (match) {
				const desired = Number(match[1]) - 1
				if (desired < slides.length) {
					setActiveSlide(desired)
					return true
				}
				return false
			}
		}
		return false
	}


	//
	// Rendering Markdown within slides
	//

	// The 'markdown' custom attribute flags an element as containing markdown.
	// In order for it to appear correctly in the editor and not invalidate
	// the HTML, the markdown is placed within a commend within the container.

	function getMarkdownFromComment(element) {
		for (const child of element.childNodes) {
			if (child.nodeType === win.Node.COMMENT_NODE) {
				return child.textContent
			}
		}
	}

	function filterMarkdown(text) {
		const leadingSpace = text.match(/^\n(\s*)\S/)[1]
		const breakAndLeadingSpace = RegExp('\n(' + leadingSpace + ')', 'g')
		return text.replace(breakAndLeadingSpace, '\n').trim()
	}

	function renderMarkdown() {
		for (const container of doc.querySelectorAll('[data-markdown]')) {
			const markdown = filterMarkdown(getMarkdownFromComment(container))
			container.innerHTML = marked(markdown)
		}
	}


	//
	// Split slide layouts
	//

	// TODO doc
	// If the user doesn't want the default behaviour of putting all the
	// slide's content into one <div>, but instead wants to treat each element
	// as a direct child of the flexbox, they can suppress it using the custom
	// 'split' attribute.
	//
	// If the attribute has a value, it should be a space-separated list of
	// percetntages (with percent sign) to apply to the flex children.

	function doSplits() {
		const promolgate = ['top', 'middle', 'bottom']
		const containers = doc.querySelectorAll('[data-split]')

		for (const container of containers) {
			const elements = Array.from(container.children)
			const percentages = hasBoolean(container, 'split')
				? []
				: container.dataset.split.split(' ')
			let splitCounter = 1

			if (percentages.length > 0) {
				if (elements.length !== percentages.length) {
					console.error('Mismatched percentages for split container', container)
				}

				const sum = percentages.reduce((accumulator, currentValue) => {
					const number = Number(currentValue.slice(0, -1))
					return accumulator += number
				}, 0)

				if (sum !== 100) {
					console.error(`Percentages add up to ${sum} for split container`, container)
				}
			}

			for (let i = 0; i < elements.length; i++) {
				const child = elements[i]
				const box = doc.createElement('div')
				box.classList.add(`part-${splitCounter}`)
				const parity = splitCounter % 2 ? 'odd' : 'even'
				box.classList.add('part-' + parity)
				splitCounter += 1
				box.appendChild(child)
				if (percentages.length > 0) {
					box.style.flexBasis = percentages[i]
				}
				for (const property of promolgate) {
					if (container.classList.contains(property)) {
						box.classList.add(property)
					}
				}
				container.appendChild(box)
			}
		}
	}


	//
	// Prepare slide pauses
	//

	// When the user wants things to be revealed gradually, they set the
	// 'data-pause' attribute on the parent of the things. This function goes
	// through and assigns each one a step number, tots up the total number of
	// steps for the slide and renders each step hidden.
	//
	// When the user presses the right arrow key, the steps are gradually
	// revealed before moving to the next slide (handled above).

	function preparePauses() {
		for (const slide of slides) {
			const pauseyThings = hasBoolean(slide, 'pause')
				? [slide]  // if the slide itself has the attribute
				: slide.querySelectorAll('[data-pause]')
			let steps = 0
			for (const thing of pauseyThings) {
				steps += thing.children.length
				for (let i = 0; i < thing.children.length; i++) {
					const step = thing.children[i]
					step.dataset.pauseStep = i + 1
					step.style.visibility = 'hidden'
				}
			}
			if (steps > 0) {
				slide.dataset.pauseSteps = steps
				slide.dataset.pauseCurrentStep = 0
			}
		}
	}


	//
	// Start-up
	//

	renderMarkdown()
	doSplits()
	preparePauses()

	// Thanks https://davidwalsh.name/css-variables-javascript :-)
	function viewSizing() {
		const viewWidth = doc.documentElement.clientWidth
		const viewHeight = doc.documentElement.clientHeight
		const viewAspect = viewWidth / viewHeight
		const slideAspectRaw = win.getComputedStyle(doc.documentElement)
			.getPropertyValue('--author-aspect-ratio')
		const matches = slideAspectRaw.match(/calc\(\s*(\d+)\s*\/\s*(\d+)\s*\)/)
		const slideAspect = matches[1] / matches[2]

		let slideHeight = null
		let slideWidth = null

		if (viewAspect >= slideAspect) {
			// View is wider than slide
			// Slide height should be 100vh
			slideHeight = viewHeight
			slideWidth = viewHeight * slideAspect
		} else {
			// View is narrower than slide
			// slide width should be 100vw
			slideWidth = viewWidth
			slideHeight = viewWidth / slideAspect
		}

		doc.documentElement.style
			.setProperty('--computed-slide-height', slideHeight + 'px')
		doc.documentElement.style
			.setProperty('--computed-slide-width', slideWidth + 'px')

		const rootFontSizePercent = win.getComputedStyle(doc.documentElement)
			.getPropertyValue('--author-font-height-percent-of-slide')
		const realRootFontSize = slideHeight * (rootFontSizePercent / 100)
		doc.documentElement.style
			.setProperty('--computed-base-font-size', realRootFontSize + 'px')
	}

	if (!reflectLocation()) {
		setActiveSlide(0)
	}

	viewSizing()
	win.onresize = viewSizing
})(window, document)
