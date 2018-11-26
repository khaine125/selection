define(function() {
  return {
    init: function() {
      var par = document.getElementById('parent'),
        nesto = document.body,
        pageWidth = nesto.clientWidth,
        pageHeight = nesto.clientHeight;
        debugger;

      par.addEventListener('mousedown', function(ev) {
      	var target = ev.target;

        if (target.tagName === 'SPAN') {
        	nesto.addEventListener('mousemove', changeSize);

          nesto.addEventListener('mouseup', function() {
          	nesto.removeEventListener('mousemove', changeSize);
            nesto.removeEventListener('mouseup', this);
          })
        }

      });
    },

    getDirection: function(className) {

    },

    changeSize: function(ev) {
      var temp = par.style.right;
      par.style.right = getRightSpacing(ev.clientX) + 'px';
    },

    getRightSpacing: function(xCoordinate) {
      return pageWidth - xCoordinate - 10;
    },

    getLeftSpacing: function() {

    },

    getBottomSpacing: function() {

    },

    getTopSpacing: function() {

    }

    //TODO: resize
  }
});
