define(['helpers'], function(helpers) {
	var addClass = helpers.addClass,
		removeClass = helpers.removeClass,
		hasClass = helpers.hasClass,
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
		isCreateAnnotationEnabled = true,
		documentInnerContainer = document.getElementById('creation'),
		annotationMarkingArea = document.getElementById('annotation-marking-area'),
		zoomLevelIndex = 100,
		ANNOTATION_STATE = {
			create: 'create',
			edit: 'edit',
			load: 'load'
		},
		annotationState = ANNOTATION_STATE.load;
		
	function annotationSelectStart(event) {
		var selectionAreaStyle, targetOffsetLeft, targetOffsetTop, targetParentStyle;
		
		event.preventDefault ? event.preventDefault() : (event.returnValue = false);
		console.log(event.target.tagName);
		//if (event.target.tagName === 'DIV' && isCreateAnnotationEnabled && annotationState === ANNOTATION_STATE.load) {
		if (event.target.tagName === 'DIV' && isCreateAnnotationEnabled) {
			annotationMarkingBox.target = event.target;
			
			targetParentStyle = getComputedStyle(event.target.parentElement);
			targetOffsetLeft = parseInt(targetParentStyle.getPropertyValue('border-left-width')) + annotationMarkingBox.target.parentElement.offsetLeft;
			targetOffsetTop = parseInt(targetParentStyle.getPropertyValue('border-top-width')) + annotationMarkingBox.target.parentElement.offsetTop;
			
			annotationMarkingBox.targetOffsetLeft = targetOffsetLeft;
			annotationMarkingBox.targetOffsetTop = targetOffsetTop;
			
			annotationMarkingBox.elementX = event.offsetX + targetOffsetLeft - documentInnerContainer.scrollLeft;
			annotationMarkingBox.elementY = event.offsetY + targetOffsetTop - documentInnerContainer.scrollTop;
			
			selectionAreaStyle = annotationMarkingArea.style;				
			selectionAreaStyle.top = targetOffsetTop - documentInnerContainer.scrollTop + 'px';
			selectionAreaStyle.left = targetOffsetLeft - documentInnerContainer.scrollLeft + 'px';
			selectionAreaStyle.width = annotationMarkingBox.target.offsetWidth + 'px';
			selectionAreaStyle.height = annotationMarkingBox.target.offsetHeight + 'px';
			
			addClass(annotationMarkingArea, 'visible');
			addClass(annotationMarkingArea, 'crosshair-cursor');
			removeClass(documentInnerContainer, 'crosshair-cursor');
			
			this._isSelectingStarted = true;
			
			this._mousemoveEventFunc = annotationSelect.bind(this);
			annotationMarkingArea.addEventListener('mousemove', this._mousemoveEventFunc);
		}
	}
	
	function createAnnotation(data) {
		var self = this,
			zoomLevel = ZOOM_LEVEL[2],
			pageContainer = document.getElementById('document-inner-container'),
			annotationBox = document.createElement('div'),
			annotationBoxCSS = annotationBox.style,
			annotation, textEdit;
			
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

	function annotationSelectEnd() {
		var annotation,
			createAnnotationButton = document.getElementById('new-annotation-button');
		
		if (this._isSelectingStarted && isCreateAnnotationEnabled) {
			annotationMarkingArea.removeEventListener('mousemove', this._mousemoveEventFunc);
			
			removeClass(annotationMarkingArea, 'visible');
			removeClass(annotationMarkingArea, 'crosshair-cursor');
			
			annotationMarkingBox.elementX = parseInt(annotationMarkingBox.elementStyle.left);
			annotationMarkingBox.elementY = parseInt(annotationMarkingBox.elementStyle.top);
			
			annotation = {
				type: (this._isStrikethrough) ? 1 : 0,
				creator: this._authorName,
				isEditable: true,
				documentId: this._documentId,
				page: parseInt(annotationMarkingBox.target.getAttribute('data-page')),
				/*llx: calculateDefaultZoomSize(annotationMarkingBox.elementX - annotationMarkingBox.targetOffsetLeft + documentInnerContainer.scrollLeft),
				lly: calculateDefaultZoomSize(annotationMarkingBox.elementY - annotationMarkingBox.targetOffsetTop + documentInnerContainer.scrollTop + annotationMarkingBox.elementH),
				urx: calculateDefaultZoomSize(annotationMarkingBox.elementX - annotationMarkingBox.targetOffsetLeft + documentInnerContainer.scrollLeft + annotationMarkingBox.elementW),
				ury: calculateDefaultZoomSize(annotationMarkingBox.elementY - annotationMarkingBox.targetOffsetTop + documentInnerContainer.scrollTop),*/
				llx: calculateDefaultZoomSize(annotationMarkingBox.elementX + documentInnerContainer.scrollLeft),
				lly: calculateDefaultZoomSize(annotationMarkingBox.elementY + documentInnerContainer.scrollTop + annotationMarkingBox.elementH),
				urx: calculateDefaultZoomSize(annotationMarkingBox.elementX + documentInnerContainer.scrollLeft + annotationMarkingBox.elementW),
				ury: calculateDefaultZoomSize(annotationMarkingBox.elementY + documentInnerContainer.scrollTop),
				text: '',
				replies: []
			};
			
			//console.log('llx: ' + annotation.llx + ' lly: ' + annotation.lly + ' urx: ' + annotation.urx + ' ury: ' + annotation.ury);
			console.log('annotationMarkingBox.elementX: ' + annotationMarkingBox.elementX + ' annotationMarkingBox.targetOffsetLeft: ' + annotationMarkingBox.targetOffsetLeft + ' documentInnerContainer.scrollLeft: ' + documentInnerContainer.scrollLeft);
			
			annotationState = ANNOTATION_STATE.create;
			
			annotationMarkingBox.element.style = '';
			removeClass(annotationMarkingBox.element, 'visible');
			
			createAnnotation(annotation);
			
			if (createAnnotationButton && hasClass(createAnnotationButton, 'selected')) {
				removeClass(createAnnotationButton, 'selected');
			}
			
			//isCreateAnnotationEnabled = false;
		}
	}
	
	function annotationSelect(event) {
		var posX, posY;
		
		event.preventDefault ? event.preventDefault() : (event.returnValue = false);
		
		if (this._isSelectingStarted && isCreateAnnotationEnabled) {
			posX = event.offsetX + annotationMarkingBox.targetOffsetLeft - documentInnerContainer.scrollLeft;
			posY = event.offsetY + annotationMarkingBox.targetOffsetTop - documentInnerContainer.scrollTop;
			
			annotationMarkingBox.elementW = Math.abs(posX - annotationMarkingBox.elementX);
			annotationMarkingBox.elementH = Math.abs(posY - annotationMarkingBox.elementY);
			
			addClass(annotationMarkingBox.element, 'visible');
			
			
			annotationMarkingBox.elementStyle.left = (posX - annotationMarkingBox.elementX < 0) ? posX + 'px' : annotationMarkingBox.elementX + 'px';
			console.log('left: ' + annotationMarkingBox.elementStyle.left + ' posX: ' + posX + ' annotationMarkingBox.elementX: ' + annotationMarkingBox.elementX);
			annotationMarkingBox.elementStyle.top = (posY - annotationMarkingBox.elementY < 0) ? posY + 'px' : annotationMarkingBox.elementY + 'px';
			console.log('top: ' + annotationMarkingBox.elementStyle.top + ' posY: ' + posY + ' annotationMarkingBox.elementY: ' + annotationMarkingBox.elementY);
			annotationMarkingBox.elementStyle.width = annotationMarkingBox.elementW + 'px';
			annotationMarkingBox.elementStyle.height = annotationMarkingBox.elementH + 'px';	
		}
	}
	
	function calculateDefaultZoomSize(value) {
		return 100 * value / ZOOM_LEVEL[2];
	}
	
	return {
		init: function() {
			documentInnerContainer.addEventListener('mousedown', annotationSelectStart.bind(this));
			window.document.addEventListener('mouseup', annotationSelectEnd.bind(this));
		}
	};
});