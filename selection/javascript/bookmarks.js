define(function() {
	//var eventEmitter = helpers.eventEmitter;

	function createSpan(className, title, bookmarkId) {
		var span = document.createElement('span');

		span.className = className;
		span.innerHTML = title;
		span.setAttribute('bookmarkId', bookmarkId);

		return span;
	}

	return {
		itemCounter: 0,
		bookmarksCounter: 0,
		allBookmarks: {},

		init: function(bookmarksData) {
			var configData = bookmarksData.configData,
				destination = bookmarksData.destination,
				fragment = document.createDocumentFragment(),
				ul = document.createElement('ul'),
				self = this,
				bookmarksArray = configData.bookmarks,
				structure;

			//eventEmitter(this);

			destination.addEventListener('click', this._clickHandler.bind(this));

			bookmarksArray.forEach(function(bookmark) {
				var bookmarkChildren = bookmark.children;
				if (bookmarkChildren) {
					structure = self._createChildrenParentBookmark(bookmark);
				} else {
					structure = self._createSingleParentBookmark(bookmark);
				}

				ul.appendChild(structure);
			});

			fragment.appendChild(ul);

			destination.className = 'tree';
			destination.appendChild(fragment);
		},

		_constructChildBookmark: function(bookmarkChildren) {
			var self = this,
				childUl = document.createElement('ul');

			bookmarkChildren.forEach(function(currentBookmark) {
				var li,
					bookmarkId = self._getBookmarkId(),
					containsChildren = currentBookmark.children && currentBookmark.children.length > 0;

				if (containsChildren) {
					childUl.appendChild(self._createChildrenParentBookmark(currentBookmark));
				} else {
					li = document.createElement('li');
					li.appendChild(createSpan('tree_label', currentBookmark.title, bookmarkId));

					childUl.appendChild(li);

					self.allBookmarks[bookmarkId] = currentBookmark.destination;
				}
			});

			return childUl;
		},

		_getBookmarkId: function() {
			return 'bookmark' + this.bookmarksCounter++;
		},

		_createSingleParentBookmark: function(bookmark) {
			var li,
				ul = document.createElement('ul'),
				bookmarkId = this._getBookmarkId();

			li = document.createElement('li');
			li.appendChild(createSpan('tree_label', bookmark.title, bookmarkId));

			ul.appendChild(li);

			this.allBookmarks[bookmarkId] = bookmark.destination;

			return ul;
		},

		_createChildrenParentBookmark: function(bookmark) {
			var bookmarkChildren = bookmark.children,
				currentItemId = 'item' + (this.itemCounter++),
				childUl = document.createElement('ul'),
				li = document.createElement('li'),
				label = document.createElement('label'),
				input = document.createElement('input'),
				bookmarkId = this._getBookmarkId();

			label.setAttribute('for', currentItemId);
			label.className = 'tree_label';
			label.appendChild(createSpan('', bookmark.title, bookmarkId));

			input.type = 'checkbox';
			input.id = currentItemId;

			this.allBookmarks[bookmarkId] = bookmark.destination;

			li.appendChild(input);
			li.appendChild(label);

			if (bookmarkChildren) {
				childUl = this._constructChildBookmark(bookmarkChildren);
			}

			li.appendChild(childUl);

			return li;
		},

		_clickHandler: function() {
			var item,
				selectedElement = event.target,
				bookmarkId = selectedElement.getAttribute('bookmarkId');

			if (bookmarkId) {
				item = this.allBookmarks[bookmarkId];
				console.log(item);
				//this.emit('select-bookmark', item, this);
				event.preventDefault();
				event.stopPropagation();
			}
		}
	};
});
