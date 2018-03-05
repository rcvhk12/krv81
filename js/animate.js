(function($){
  $(document).ready(function(){
    var s, maxWidth;

    var mobileSwipe = function(currentSkrollPos){

      var currSwipe = null, inertiaSpeed = 0,

      Swipe = function(e){
        this.startX = e.originalEvent.touches[0].clientX;
        this.startY = e.originalEvent.touches[0].clientY;
        this.currX = this.startX;
        this.currY = this.startY;
        this.xDist = 0;
        this.yDist = 0;
        this.lastXDist = 0;
        this.lastYDist = 0;
        this.dir = null;
        this.lastDelta = 0;
      };
      Swipe.prototype.update = function(e){
        this.lastXDist = this.currX;
        this.lastYDist = this.currY;
        this.currX = e.originalEvent.touches[0].clientX;
        this.currY = e.originalEvent.touches[0].clientY;
        this.xDist = this.startX - this.currX;
        this.yDist = this.startY - this.currY;
        this.setDirection();
      };
      Swipe.prototype.destroy = function(e){};
      Swipe.prototype.setDirection = function(){
        if(Math.abs(this.xDist) > Math.abs(this.yDist)){
          if(this.xDist < 0){
            this.dir = 'left'; // left
          }else{
            this.dir = 'right'; // right
          }
        }else{
          if(this.yDist < 0){
            this.dir = 'up'; // up
          }else{
            this.dir = 'down'; // down
          }
        }
      };
      Swipe.prototype.getDistDelta = function(){
        var dist = 0;
        switch(this.dir){
          case 'up': // up
          case 'down': // down
            dist = this.lastYDist - this.currY;
          break;

          case 'right': // right
          case 'left': // left
            dist = this.lastXDist - this.currX;
          break;
        }
        return dist;
      };
      Swipe.prototype.getDist = function(){
        var dist = 0;
        switch(this.dir){
          case 'up': // up
          case 'down': // down
            dist = this.yDist;
          break;

          case 'right': // right
          case 'left': // left
            dist = this.xDist;
          break;
        }
        return dist;
      };

      var moveSkrollr = function(dist){
        s.setScrollTop(currentSkrollPos + dist, true);
        currentSkrollPos += dist;
      },
      moveSkrollrInertia = function(dist){
        inertiaSpeed = dist;
        var animating = true;
        currentSkrollPos += dist;

        inertiaInterval = setInterval(function(){
          inertiaSpeed = parseInt(inertiaSpeed);
          if(inertiaSpeed !== 0 && ((currentSkrollPos > 0) && (currentSkrollPos < maxWidth))){
            inertiaSpeed *= 0.15;
            s.setScrollTop(currentSkrollPos + (-inertiaSpeed));
          }else{
            if(currentSkrollPos < 0){
              currentSkrollPos = 0;
            }else if(currentSkrollPos > maxWidth){
              currentSkrollPos = maxWidth;
              s.setScrollTop(currentSkrollPos);
            }
            animating = false;
            clearInterval(inertiaInterval);
          }
          //$('.position').text(currentSkrollPos + ' -- ' + currSwipe.dir + ' :: ' + currSwipe.getDistDelta() + ' :: ' + currSwipe.getDist() + ' >> '+inertiaSpeed + (animating ? ' !!' : ''));
        }, 20);
      }

      $('body')
        .off('touchstart touchend touchmove')
        .on('touchstart', function(e){
          inertiaSpeed = 0;
          currSwipe = new Swipe(e);
        })
        .on('touchend', function(e){
          currSwipe.destroy(e);
          moveSkrollrInertia(currSwipe.getDistDelta());
          e.preventDefault();
          e.stopPropagation();
          if(window.sessionStorage){
            window.sessionStorage.setItem('currentSkrollPos', s.getScrollTop());
          }
          return;
        })
        .on('touchmove', function(e){
          currSwipe.update(e);
          //$('.position').text(currentSkrollPos + ' -- ' + currSwipe.dir + ' :: ' + currSwipe.getDistDelta() + ' :: ' + currSwipe.getDist())
          moveSkrollr(currSwipe.getDistDelta());
          e.preventDefault();
          e.stopPropagation();
          return;
        });

      window.lookForShare = setInterval(function(){
        if($('.addthis_sharing_toolbox a').length > 0){
          clearInterval(window.lookForShare);
          $('.addthis_sharing_toolbox a')
            .off('touchstart')
            .on('touchstart', function(){
              var click = new MouseEvent('click', {
                view: window,
                bubbles: true,
                canceleable: true
              });
              $(this).get(0).dispatchEvent(click);
            });
        }
      }, 500);

    };

  	var initSkrollr = function(){
  		// check out the device orientation
  		if(s && typeof s.destroy !== undefined) s.destroy();
  		if(window.orientation !== undefined && (window.orientation === 0 || window.orientation === 180)){
  			// is portrait mode
  			$('.portrait').show();
  			$('.landscape').hide();
  		}else{
  			$('.portrait').hide();
  			$('.landscape').show();
  	  	s = skrollr.init({
  	  		scale: window.orientation !== undefined ? 0.3 : 1
  	  	});
        maxWidth = s.getMaxScrollTop();

        skrollr.menu.init(s, {
        animate: true,
        easing: 'linear',
        scale: 2,
        duration: function(currentTop, targetTop) {
            return 2000;
        },
            updateUrl: false
        });
        // listen for session storage
        if(window.sessionStorage && window.sessionStorage.getItem('currentSkrollPos')){
          s.setScrollTop( parseInt(window.sessionStorage.getItem('currentSkrollPos')) );
          mobileSwipe(parseInt(window.sessionStorage.getItem('currentSkrollPos')));
        }else{
          mobileSwipe(0);
        }
  		}
  	}

    if(typeof window.orientation !== 'undefined'){
      $(window)
        .on('resize', function(){
          initSkrollr();
        });
    	window.addEventListener('orientationchange', function() {
    		initSkrollr();
    	}, false);

    }

  	initSkrollr();
  	

    var toggleItem = function(e){
      e.preventDefault()
      var href = $(this).attr('href'),
          target = $(href),
          parent = $(this).parents('.hotspot:first'),
          posBottom = 0;

      var offset = parent.position(),
          tHeight = $(this).outerHeight(),
          maxHeight = parent.parent().outerHeight(),
          gutter = 20,
          left = parseInt(parent.css('left'), 10),
          elemHeight = target.outerHeight(),
          forceBottom = $(this).attr('data-position'),
          windowWidth = $(window).width();

      if(!target.hasClass('no-move')){
        // get position of parent
        if((offset.top - elemHeight) < 0 || forceBottom === 'bottom'){ // needs to sit below it!
          posBottom = maxHeight - offset.top - elemHeight - tHeight;
        }else{
          posBottom = (maxHeight - offset.top);
        }
      }

      if(!target.hasClass('pos-set')){
        target
          .css({
            bottom: target.hasClass('no-move') ? 'auto' : posBottom,
            left:left,
            marginBottom: gutter
          })
          .addClass('pos-set');
      }

      $('.is-visible:not('+href+')').removeClass('is-visible');
      $('.hover').removeClass('hover');

      target
        .toggleClass('is-visible');

      if(target.hasClass('is-visible')){
        $(this).parent().addClass('hover');
      }
    }
    
    $('a[data-trigger="popup"]').each(function(){
      var target = $($(this).attr('href')),
          parent = $(this).parents('.hotspot:first');
      if(!target.hasClass('no-move')){
        parent.after(target);
      }else{
        $('a.close', target).on('click', function (e) {
          e.preventDefault();
          $(this).parents('.popup:first').removeClass('is-visible');
        });
      }
    });

    var msieversion = function() {
      var ua = window.navigator.userAgent;
      var msie = ua.indexOf("MSIE ");

      if (msie > 0)      // If Internet Explorer, return version number
        $('body').addClass('browser-ie').addClass('ie-'+parseInt(ua.substring(msie + 5, ua.indexOf(".", msie))));
    }
    msieversion();


    var mobileDetect = function(){
      if('ontouchstart' in document){
        $('body').addClass('mobile');
        $('a')
          .off('touchstart')
          .on('touchstart', function(){
            if(!$(this).hasClass('at-share-btn')){
              // detect if it has a link
              var link = $(this).attr('href'),
                  target = $(this).attr('target');
              if($(this).hasClass('close')){
                $(this).parents('.popup:first').removeClass('is-visible');
              }else{
                if(link && (link.indexOf('#') === -1 || link.indexOf('#') > 0)){
                  window.open(link, target);
                }
              }
            }
          });
        $('a[data-trigger="popup"]').on('touchstart', function(e){
          e.preventDefault();
          toggleItem.call(this, e);
        });
      }else{
        $('body').addClass('desktop');
        $('a[data-trigger="popup"]').on('click', function(e){
          e.preventDefault();
          toggleItem.call(this, e);
        });
      }
    };
    mobileDetect();

  })

})(jQuery);