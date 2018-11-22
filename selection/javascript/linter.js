define(['helpers'], function(helpers) {
	var addClass = helpers.addClass,
		removeClass = helpers.removeClass,
		hasClass = helpers.hasClass,
		addEvent = helpers.addEvent,
		annotationMarkingBox = {
			element: document.getElementById('annotation-marking-box'),
			elementStyle: document.getElementById('annotation-marking-box').style,
			target: null,
			elementX: null,
			elementY: null,
			elementW: null,
			elementH: null
		},
		ZOOM_LEVEL = [50, 75, 100, 125, 150, 175, 200],
		documentInnerContainer = document.getElementById('creation'),
		annotationMarkingArea = document.getElementById('annotation-marking-area'),
		zoomLevelIndex = 2,
		isSelectingStarted;
		
	function annotationSelectStart(event) {
		var selectionAreaStyle = annotationMarkingArea.style, 
			targetOffsetLeft, targetOffsetTop, targetParentStyle;
		
		event.preventDefault ? event.preventDefault() : (event.returnValue = false);
		console.log(event.target.tagName);
		
		if (event.target.tagName === 'DIV') {
			annotationMarkingBox.target = event.target;
			
			targetParentStyle = getComputedStyle(event.target.parentElement);
			targetOffsetLeft = parseInt(targetParentStyle.getPropertyValue('border-left-width')) + annotationMarkingBox.target.parentElement.offsetLeft;
			targetOffsetTop = parseInt(targetParentStyle.getPropertyValue('border-top-width')) + annotationMarkingBox.target.parentElement.offsetTop;
			
			annotationMarkingBox.targetOffsetLeft = targetOffsetLeft;
			annotationMarkingBox.targetOffsetTop = targetOffsetTop;
			
			annotationMarkingBox.elementX = event.offsetX + targetOffsetLeft - documentInnerContainer.scrollLeft;
			annotationMarkingBox.elementY = event.offsetY + targetOffsetTop - documentInnerContainer.scrollTop;
						
			selectionAreaStyle.top = targetOffsetTop - documentInnerContainer.scrollTop + 'px';
			selectionAreaStyle.left = targetOffsetLeft - documentInnerContainer.scrollLeft + 'px';
			selectionAreaStyle.width = annotationMarkingBox.target.offsetWidth + 'px';
			selectionAreaStyle.height = annotationMarkingBox.target.offsetHeight + 'px';
			
			addClass(annotationMarkingArea, 'visible');
			
			this.isSelectingStarted = true;
			addEvent(annotationMarkingArea, 'mousemove', annotationSelect.bind(this));
		}
	}
	
	function createAnnotation(data) {
		var zoomLevel = ZOOM_LEVEL[zoomLevelIndex],
			pageContainer = document.getElementById('document-inner-container'),
			annotationBox = document.createElement('div'),
			annotationBoxCSS = annotationBox.style;
			
		addClass(annotationBox, 'annotation-box');
		
		annotationBox.setAttribute('data-page', data.page);
		
		annotationBoxCSS.top = calculateZoomSize(zoomLevel, data.ury) + 'px';
		annotationBoxCSS.left = calculateZoomSize(zoomLevel, data.llx) + 'px';
		annotationBoxCSS.width = calculateZoomSize(zoomLevel, (data.urx - data.llx)) + 'px';
		annotationBoxCSS.height = calculateZoomSize(zoomLevel, (data.lly - data.ury)) + 'px';
		
		pageContainer.appendChild(annotationBox);
	}
	
	function calculateZoomSize(zoomLevel, value) {
		var zoomMultiplier = zoomLevel / 100;
		
		return (value * zoomMultiplier);
	}
	
	
	/*
	private String id;
	private String title;
	private String description;
	private Selection source;
	private Selection target;
	*/
	
	function annotationSelectEnd() {
		var annotation,
			createAnnotationButton = document.getElementById('new-annotation-button');
		
		if (this.isSelectingStarted) {
			//annotationMarkingArea.remove();
			
			removeClass(annotationMarkingArea, 'visible');
			
			annotationMarkingBox.elementX = parseInt(annotationMarkingBox.elementStyle.left);
			annotationMarkingBox.elementY = parseInt(annotationMarkingBox.elementStyle.top);
			
			annotation = {
				page: parseInt(annotationMarkingBox.target.getAttribute('data-page')),
				llx: calculateDefaultZoomSize(annotationMarkingBox.elementX + documentInnerContainer.scrollLeft),
				lly: calculateDefaultZoomSize(annotationMarkingBox.elementY + documentInnerContainer.scrollTop + annotationMarkingBox.elementH),
				urx: calculateDefaultZoomSize(annotationMarkingBox.elementX + documentInnerContainer.scrollLeft + annotationMarkingBox.elementW),
				ury: calculateDefaultZoomSize(annotationMarkingBox.elementY + documentInnerContainer.scrollTop)
			};
			
			annotationMarkingBox.element.style = '';
			removeClass(annotationMarkingBox.element, 'visible');
			
			createAnnotation(annotation);
			
			if (createAnnotationButton && hasClass(createAnnotationButton, 'selected')) {
				removeClass(createAnnotationButton, 'selected');
			}
		}
	}
	
	function annotationSelect(event) {
		var posX, posY;
		
		event.preventDefault ? event.preventDefault() : (event.returnValue = false);
		
		if (this.isSelectingStarted) {
			posX = event.offsetX + annotationMarkingBox.targetOffsetLeft - documentInnerContainer.scrollLeft;
			posY = event.offsetY + annotationMarkingBox.targetOffsetTop - documentInnerContainer.scrollTop;
			
			annotationMarkingBox.elementW = Math.abs(posX - annotationMarkingBox.elementX);
			annotationMarkingBox.elementH = Math.abs(posY - annotationMarkingBox.elementY);
			
			addClass(annotationMarkingBox.element, 'visible');
			
			annotationMarkingBox.elementStyle.left = (posX - annotationMarkingBox.elementX < 0) ? posX + 'px' : annotationMarkingBox.elementX + 'px';
			annotationMarkingBox.elementStyle.top = (posY - annotationMarkingBox.elementY < 0) ? posY + 'px' : annotationMarkingBox.elementY + 'px';
			annotationMarkingBox.elementStyle.width = annotationMarkingBox.elementW + 'px';
			annotationMarkingBox.elementStyle.height = annotationMarkingBox.elementH + 'px';	
		}
	}
	
	function calculateDefaultZoomSize(value) {
		return 100 * value / ZOOM_LEVEL[zoomLevelIndex];
	}
	
	return {
		init: function() {
			addEvent(documentInnerContainer, 'mousedown', annotationSelectStart.bind(this));
			addEvent(documentInnerContainer, 'mouseup', annotationSelectEnd.bind(this));
		}
	};
});