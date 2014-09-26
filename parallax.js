(function ($) {
    "use strict";
    var ParallaxScroll,
    parallaxSetup,
    defaults = {
        imageAttribute: 'data-image',
        container: $('body'),
        speed: 0.3,
        coverRatio: 0.85,
        mediaWidth: 1600,
        mediaHeight: 900,
        parallax: true
    },
    $win = $(window),
        lastTickTime = 0;
    ParallaxScroll = function (imageContainer, options) {
        return {
            init: function () {
                this.$imageContainer = $(imageContainer);
                this.settings = $.extend({}, defaults, options);
                this.image = this.$imageContainer.attr(this.settings.imageAttribute);
                this.mediaWidth = this.$imageContainer.data('width') || this.settings.mediaWidth;
                this.mediaHeight = this.$imageContainer.data('height') || this.settings.mediaHeight;
                this.coverRatio = this.$imageContainer.data('cover-ratio') || this.settings.coverRatio;
                this.ticking = false;

                if (this.image) {
                    this.$scrollingElement = $('<img/>').css({
                        opacity: 0
                    }).attr('src', this.image).load(function () {
                        $(this).animate({
                            opacity: 1
                        }, 200);
                    });
                } else {
                    throw new Error('ReferenceError: data-image attribute is not defined');
                }

                if (this.settings.parallax === true) {
                    this.$scrollerHolder = $('<div/>', {
                        html: this.$imageContainer.html()
                    }).css({
                        top: 0,
                        visibility: 'hidden',
                        position: 'fixed',
                        overflow: 'hidden'
                    }).addClass('scroller-container').prependTo(this.settings.container);
                    this.$imageContainer.css('visibility', 'hidden').empty();
                    this.$scrollingElement.css({
                        position: 'absolute',
                        visibility: 'hidden',
                        maxWidth: 'none'
                    }).prependTo(this.$scrollerHolder);
                } else {
                    this.$imageContainer.css({
                        position: 'relative'
                    });
                    this.$scrollerHolder = this.$imageContainer.css({
                        overflow: 'hidden'
                    });
                    this.$scrollingElement.css({
                        position: 'relative',
                        overflow: 'hidden'
                    }).prependTo(this.$imageContainer);
                }

                /*Todo Aditya set parallax as false if transforms are not supported*/

                if (this.settings.parallax === true) {
                    this._adjustImgHolderHeights();
                    this._updatePositions();
                } else {
                    this._updateFallbackPositions();
                }
                this._bindEvents();
            },
            _adjustImgHolderHeights: function () {

                var winHeight = $win.height(),
                    winWidth = $win.width(),
                    imgHolderHeight = this.coverRatio * winHeight,
                    imgTopPos,
                    fromY,
                    toY,
                    imgScrollingDistance,
                    travelDistance,
                    imgWidth,
                    imgHeight,
                    idealImgHeight,
                    imageDiff,
                    adjustedYDiff,
                    holderToWinDiff;
                imgHolderHeight = Math.floor(imgHolderHeight);
                //if((imgHolderHeight + 2) >= winHeight) {imgHolderHeight = winHeight - 2; }
                idealImgHeight = Math.floor(winHeight - (winHeight - imgHolderHeight) * this.settings.speed);
                imgWidth = Math.round(this.mediaWidth * (idealImgHeight / this.mediaHeight));

                if (imgWidth >= winWidth) {
                    imgHeight = idealImgHeight;
                } else {
                    imgWidth = winWidth;
                    imgHeight = Math.round(this.mediaHeight * (imgWidth / this.mediaWidth));
                }

                imageDiff = (idealImgHeight - imgHolderHeight) / 2;
                adjustedYDiff = (imgHeight - idealImgHeight) / 2;
                holderToWinDiff = (winHeight - imgHolderHeight) / 2;
                fromY = -((winHeight / holderToWinDiff) * imageDiff) - adjustedYDiff;
                toY = ((imgHolderHeight / holderToWinDiff) * imageDiff) - adjustedYDiff;
                imgScrollingDistance = toY - fromY;
                travelDistance = winHeight + imgHolderHeight;
                imgTopPos = -Math.round((imgHeight - imgHolderHeight) / 2);

                this.$scrollingElement.css({
                    height: imgHeight,
                    width: imgWidth
                });
                this.$imageContainer.height(imgHolderHeight);

                this.$scrollerHolder.css({
                    height: imgHolderHeight,
                    width: imgWidth
                });

                this.scrollingState = {
                    winHeight: winHeight,
                    fromY: fromY,
                    imgTopPos: imgTopPos,
                    imgHolderHeight: imgHolderHeight,
                    imgScrollingDistance: imgScrollingDistance,
                    travelDistance: travelDistance,
                    holderDistanceFromTop: this.$imageContainer.offset().top - $win.scrollTop()
                };
            },
            _bindEvents: function () {
                var self = this;
                $win.on('resize', function (evt) {
                    self._adjustImgHolderHeights();
                    if (self.settings.parallax === true) {
                        self._requestTick();
                    } else {
                        self._updateFallbackPositions();
                    }
                });
                if (this.settings.parallax === true) {
                    $win.on('scroll', function (evt) {
                        self._requestTick();
                    });
                }
            },
            _requestTick: function () {
                var self = this;
                if (!this.ticking) {
                    this.ticking = true;
                    requestAnimationFrame(function () {
                        self._updatePositions();
                    });
                }
            },
            _updatePositions: function () {

                /*This function is called on every scroll. Optimize Optimize Optimize */

                this.scrollingState.holderDistanceFromTop = this.$imageContainer.offset().top - $win.scrollTop();
                if (this.scrollingState.holderDistanceFromTop <= (this.scrollingState.winHeight) && this.scrollingState.holderDistanceFromTop >= -this.scrollingState.imgHolderHeight) {
                    var distanceFromTopAddedWinHeight = this.scrollingState.holderDistanceFromTop + this.scrollingState.imgHolderHeight,
                        distanceInPercent = distanceFromTopAddedWinHeight / this.scrollingState.travelDistance,
                        currentImgYPosition = Math.round(this.scrollingState.fromY + (this.scrollingState.imgScrollingDistance * (1 - distanceInPercent)));

                    /* Using javascript style for better perf  http://jsperf.com/css-vs-style-parallax */

                    /* Move -webkit-transform to property and support other vendors/browsers*/

                    this.$scrollerHolder[0].style[this.settings.transformType] = 'translate3d(0,' + Math.round(this.scrollingState.holderDistanceFromTop) + 'px, 0)';
                    this.$scrollerHolder[0].style.visibility = 'visible';


                    this.$scrollingElement[0].style[this.settings.transformType] = 'translate3d(0,' + currentImgYPosition + 'px, 0)';
                    this.$scrollingElement[0].style.visibility = 'visible';

                } else {
                    this.$scrollerHolder[0].style.visibility = 'hidden';
                    this.$scrollingElement[0].style.visibility = 'hidden';
                }

                this.ticking = false;
            },
            _updateFallbackPositions: function () {
                this.$scrollingElement.css({
                    width: '100%',
                    display: 'block'
                });
                // this.$scrollingElement.css({
                //     top: this.scrollingState.imgTopPos
                // });
            }
        };
    };
    parallaxSetup = function (options) {
        if (document.body.style.MozTransform !== undefined) {

            options.transformType = "-moz-transform";

        }
        if (document.body.style.webkitTransform !== undefined) {

            options.transformType = "-webkit-transform";

        }
        if (document.body.style.msTransform !== undefined) {

            options.transformType = "-ms-transform";

        }
        if (document.body.style.transform !== undefined) {

            options.transformType = "transform";

        }
        if (options.transformType == undefined) {
            options.parallax = false;
        }
        //return options;
    };
    ParallaxScroll.defaults = defaults;
    $.fn.parallaxScroll = function (options) {
        parallaxSetup(options);
        return this.each(function () {
            new ParallaxScroll(this, options).init();
        });
    };
}(jQuery));