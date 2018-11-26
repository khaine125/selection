define(['helpers', 'interact'], function(helpers, interact) {
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
		isSelectingStarted, eventResult, cacheHyperlink;
	
	return {
		init: function() {
			addEvent(documentInnerContainer, 'mousedown', this._annotationSelectStart.bind(this));
			addEvent(documentInnerContainer, 'mouseup', this._annotationSelectEnd.bind(this));
			
			this._createInteractControl();
		},
		
		getElement: function() {
			return cacheHyperlink;
		},
		
		_annotationSelectStart: function(event) {
			var selectionAreaStyle = annotationMarkingArea.style, 
				targetOffsetLeft, targetOffsetTop, targetParentStyle;
			
			event.preventDefault ? event.preventDefault() : (event.returnValue = false);
			//debugger;
			if (event.target.tagName === 'DIV' && event.target.className.trim() !== 'annotation-box') {
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
				this.eventResult = addEvent(annotationMarkingArea, 'mousemove', this._annotationSelect.bind(this));
			}
		},
		
		_createAnnotation: function(data) {
			var zoomLevel = ZOOM_LEVEL[zoomLevelIndex],
				pageContainer = document.getElementById('document-inner-container'),
				annotationBox = document.createElement('div'),
				annotationBoxCSS = annotationBox.style;
				
			addClass(annotationBox, 'annotation-box');
			
			annotationBox.setAttribute('data-page', data.page);
			
			annotationBoxCSS.top = this._calculateZoomSize(zoomLevel, data.ury) + 'px';
			annotationBoxCSS.left = this._calculateZoomSize(zoomLevel, data.llx) + 'px';
			annotationBoxCSS.width = this._calculateZoomSize(zoomLevel, (data.urx - data.llx)) + 'px';
			annotationBoxCSS.height = this._calculateZoomSize(zoomLevel, (data.lly - data.ury)) + 'px';
			
			pageContainer.appendChild(annotationBox);
			
			cacheHyperlink = {
				x: 0,
				y: 0
			};
		},
		
		_calculateZoomSize: function(zoomLevel, value) {
			var zoomMultiplier = zoomLevel / 100;
			
			return (value * zoomMultiplier);
		},
		
		_annotationSelectEnd: function(event) {
			var hyperlink;
			
			if (this.isSelectingStarted && event.target.className.trim() !== 'annotation-box') {
				this.eventResult.remove();
				
				removeClass(annotationMarkingArea, 'visible');
				
				annotationMarkingBox.elementX = parseInt(annotationMarkingBox.elementStyle.left);
				annotationMarkingBox.elementY = parseInt(annotationMarkingBox.elementStyle.top);
				
				hyperlink = {
					page: parseInt(annotationMarkingBox.target.getAttribute('data-page')),
					llx: this._calculateDefaultZoomSize(annotationMarkingBox.elementX + documentInnerContainer.scrollLeft),
					lly: this._calculateDefaultZoomSize(annotationMarkingBox.elementY + documentInnerContainer.scrollTop + annotationMarkingBox.elementH),
					urx: this._calculateDefaultZoomSize(annotationMarkingBox.elementX + documentInnerContainer.scrollLeft + annotationMarkingBox.elementW),
					ury: this._calculateDefaultZoomSize(annotationMarkingBox.elementY + documentInnerContainer.scrollTop)
				};
				
				annotationMarkingBox.element.style = '';
				removeClass(annotationMarkingBox.element, 'visible');
				
				this._createAnnotation(hyperlink);
			}
		},
		
		_annotationSelect: function(event) {
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
		},
		
		_calculateDefaultZoomSize: function(value) {
			return 100 * value / ZOOM_LEVEL[zoomLevelIndex];
		},
		
		_createInteractControl: function() {
			interact('.annotation-box')
			.draggable({
				// keep the element within the area of it's parent
				restrict: {
					restriction: 'parent',
					endOnly: true,
					elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
				},
				// enable autoScroll
				autoScroll: true,

				// call this function on every dragmove event
				onmove: dragMoveListener
			})
			.resizable({
				// resize from all edges and corners
				edges: { left: true, right: true, bottom: true, top: true },

				// keep the edges inside the parent
				restrictEdges: {
					outer: 'parent',
					endOnly: true,
				},

				// minimum size
				restrictSize: {
					min: { width: 100, height: 50 },
				}
			})
			.on('resizemove', function (event) {
				var target = event.target,
					x = (parseFloat(target.getAttribute('data-x')) || 0),
					y = (parseFloat(target.getAttribute('data-y')) || 0);
				
				// update the element's style
				target.style.width  = event.rect.width + 'px';
				target.style.height = event.rect.height + 'px';

				// translate when resizing from top or left edges
				x += event.deltaRect.left;
				y += event.deltaRect.top;

				target.style.webkitTransform = target.style.transform =
				'translate(' + x + 'px,' + y + 'px)';

				target.setAttribute('data-x', x);
				target.setAttribute('data-y', y);
			});

			function dragMoveListener (event) {
				var target = event.target,
					// keep the dragged position in the data-x/data-y attributes
					x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
					y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy,
					tempX = parseFloat(target.style.left) + x,
					tempY = parseFloat(target.style.top) + y;
				
				// translate the element
				target.style.webkitTransform =
				target.style.transform =
				'translate(' + x + 'px, ' + y + 'px)';

				// update the posiion attributes
				target.setAttribute('data-x', x);
				target.setAttribute('data-y', y);
				
				target.setAttribute('data-left', tempX);
				target.setAttribute('data-top', tempY);
			}
		}
	};
});