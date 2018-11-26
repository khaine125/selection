define(['helpers'], function(helpers) {
	var createDropDownElement,
		addEvent = helpers.addEvent,
		eventEmitter = helpers.eventEmitter;
	
	createDropDownElement = function(elementConfig, inputValuesKeys) {
		var defaultValue = elementConfig.defaultValue,
			inputValues = elementConfig.inputValues,
			dropDownElement = document.createElement('select');
		
		inputValuesKeys.map(function(value) {
			var option = document.createElement('option');
			option.value = value;
			option.text = inputValues[value];
			dropDownElement.appendChild(option);
		});
		
		dropDownElement.value = defaultValue;
		
		return dropDownElement;
	};
	
	
	
	return {
		emitter: eventEmitter(this),
		
		init: function(data) {
			var tempElementsContainer,
				elementsContainer = data.destinationElement;
			
			this.listItems = [];
			this.elementsData = data.elementsData;
			tempElementsContainer = this._buildElements(data.elementsData);
			
			elementsContainer.appendChild(tempElementsContainer);
			addEvent(elementsContainer, 'click', this._clickHandler.bind(this));
			addEvent(elementsContainer, 'change', this._changeHandler.bind(this));
			addEvent(elementsContainer, 'keypress', this._keyPressHandler.bind(this));
		},
		
		destroy: function() {
			//ocistit, event emitter, event listener
		},
		
		_buildElements: function(elementsData) {
			var tempElementsContainer = document.createDocumentFragment();
				unorderedListElements = {},
				self = this;
			
			elementsData.map(function(element) {
				var itemContainerId = element.itemContainerId,
					listContainer = unorderedListElements[itemContainerId], 
					listItemContainer, itemEvent;
				
				if (listContainer === undefined) {
					listContainer = document.createElement('ul');
					listContainer.id = itemContainerId;
					unorderedListElements[itemContainerId] = listContainer;
				}
				
				listItemContainer = self._createListItem(element);
				listItemContainer.setAttribute('controlEventName', element.controlEventName);
				
				if (element.useToggle) {
					listItemContainer.setAttribute('useToggle', element.useToggle);
				}
				
				listContainer.appendChild(listItemContainer);
			});
			
			Object.keys(unorderedListElements).map(function(list) {
				var unorderedListElement = unorderedListElements[list];
				tempElementsContainer.appendChild(unorderedListElement);
			});
			
			return tempElementsContainer;
		},
		
		_createListItem: function(elementConfig) {
			var labelElement, imageElement, inputElement,
				inputValues = elementConfig.inputValues,
				inputValuesKeys = inputValues ? Object.keys(inputValues) : {},
				listItemContainer = document.createElement('li'),
				imageSource = elementConfig.source,
				textLabel = elementConfig.textLabel,
				type = elementConfig.type;
			
			if (imageSource) {
				imageElement = document.createElement('img');
				imageElement.src = imageSource;
				
				listItemContainer.appendChild(imageElement);
			}
			
			if (textLabel) {
				labelElement = document.createElement('span');
				labelElement.innerHTML = textLabel;
				
				listItemContainer.appendChild(labelElement);
			}
			
			if (type) {
				inputElement = document.createElement('input');
				inputElement.type = type;
				
				listItemContainer.appendChild(inputElement);
			}
			
			if (inputValues && inputValuesKeys.length > 0) {
				listItemContainer.appendChild(createDropDownElement(elementConfig, inputValuesKeys));
			}
			
			return listItemContainer;
		},
		
		_getListItem: function(element) {
			var tempElement = element;
			
			while (tempElement && tempElement.tagName.toLowerCase() !== 'li') {
				tempElement = tempElement.parentElement;
			}
			
			if (!tempElement) {
				tempElement = element;
			}
			
			return tempElement;
		},
		
		_canUseKeyPress: function(element) {
			return !(element.tagName.toLowerCase() === 'input' && element.type === 'text');
		},
		
		_keyPressHandler: function(evt) {
			var controlEventName = '',
				useToggle = '',
				tempElement = evt.target,
				value = tempElement.value;
			
			if (evt.keyCode !== 13 || this._canUseKeyPress(tempElement)) {
				return;
			}
			
			if (isNaN(value)) {
				return;
			}
			
			tempElement = this._getListItem(tempElement);
				
			controlEventName = tempElement.getAttribute('controlEventName');
			controlEventName && this.emitter.emit(controlEventName, value);
		},
		
		_changeHandler: function(evt) {
			var controlEventName = '',
				useToggle = '',
				tempElement = evt.target;
			
			if (this._canUseChange(tempElement)) {
				return;
			}
			
			tempElement = this._getListItem(tempElement);
				
			controlEventName = tempElement.getAttribute('controlEventName');
			controlEventName && this.emitter.emit(controlEventName);
		},
		
		_canUseChange: function(element) {
			return element.tagName.toLowerCase() !== 'select';
		},
		
		_clickHandler: function(evt) {
			var controlEventName = '',
				useToggle = '',
				tempElement = evt.target;
				
			if (this._preventClick(tempElement)) {
				return;
			}
			
			tempElement = this._getListItem(tempElement);
			
			useToggle = tempElement.getAttribute('useToggle');
			
			if (useToggle && tempElement.className === '') {
				tempElement.className = 'selected';
			} else if (useToggle && tempElement.className === 'selected') {
				tempElement.className = '';
			}
			
			controlEventName = tempElement.getAttribute('controlEventName');
			controlEventName && this.emitter.emit(controlEventName);
		},
		
		_preventClick: function(element) {
			var elementName = element.tagName;
			return (elementName.toLowerCase() === 'input' && element.type === 'text') || elementName.toLowerCase() === 'select';
		}
	};
});