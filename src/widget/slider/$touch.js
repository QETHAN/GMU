/**
 * @file 图片轮播手指跟随插件
 * @import widget/slider/slider.js
 */
(function( gmu, $, undefined ) {
    
    var map = {
            touchstart: '_onStart',
            touchmove: '_onMove',
            touchend: '_onEnd',
            touchcancel: '_onEnd'
        },

        $doc = $( document ),

        isScrolling,
        start,
        delta,
        moved;


    gmu.Slider.register( 'touch', {
        _init: function() {
            this._handler = $.proxy( this._handler, this );
            this.on( 'ready', function() {

                // 绑定手势
                this.getEl().on( 'touchstart.slider', this._handler );
                
                // 阻止误点击
                this._container.on( 'click.slider', function() {
                    return !moved;
                } );
            } );

            this.on( 'destroy', function() {
                this._container.off( '.slider' );
            } );
        },

        _handler: function( e ) {
            map[ e.type ] && this[ map[ e.type ] ].call( this, e );
            this._options.stopPropagation && e.stopPropagation();
        },

        _onStart: function( e ) {
                
            // 不处理多指
            if ( e.touches.length > 1 ) {
                return false;
            }

            var me = this,
                touche = e.touches[ 0 ],
                opts = this._options,
                num;

            start = {
                x: touche.pageX,
                y: touche.pageY,
                time: +new Date()
            };

            delta = {};
            moved = false;
            isScrolling = undefined;

            num = opts.viewNum || 1;
            me._move( opts.loop ? me._circle( me.index - num ) :
                    me.index - num, -me.width, 0, true );
            me._move( opts.loop ? me._circle( me.index + num ) :
                    me.index + num, me.width, 0, true );

            $doc.on( 'touchmove.slider touchend.slider touchcancel.slider',
                    me._handler );
        },

        _onMove: function( e ) {

            // 多指或缩放不处理
            if ( e.touches.length > 1 || e.scale &&
                    e.scale !== 1 ) {
                return false;
            }

            var opts = this._options,
                viewNum = opts.viewNum || 1,
                touche = e.touches[ 0 ],
                index = this.index,
                i,
                len,
                pos,
                slidePos;

            opts.disableScroll && e.preventDefault();

            delta.x = touche.pageX - start.x;
            delta.y = touche.pageY - start.y;

            if ( typeof isScrolling === 'undefined' ) {
                isScrolling = Math.abs( delta.x ) <
                        Math.abs( delta.y );
            }

            if ( !isScrolling ) {
                e.preventDefault();

                if ( !opts.loop ) {

                    // 如果左边已经到头
                    delta.x /= (!index && delta.x > 0 ||

                            // 如果右边到头
                            index === this._items.length - 1 && 
                            delta.x < 0) ?

                            // 则来一定的减速
                            (Math.abs( delta.x ) / this.width + 1) : 1;
                }

                slidePos = this._slidePos;

                for ( i = index - viewNum, len = index + 2 * viewNum;
                        i < len; i++ ) {

                    pos = opts.loop ? this._circle( i ) : i;
                    this._translate( pos, delta.x + slidePos[ pos ], 0 );
                }

                moved = true;
            }
        },

        _onEnd: function() {
            var me = this,
                opts = me._options,
                viewNum = opts.viewNum || 1,
                index = me.index,
                slidePos = me._slidePos,
                duration = +new Date() - start.time,
                absDeltaX = Math.abs( delta.x ),

                // 是否滑出边界
                isPastBounds = !opts.loop && (!index && delta.x > 0 ||
                    index === slidePos.length - viewNum && delta.x < 0),

                // -1 向右 1 向左
                dir = delta.x > 0 ? 1 : -1,
                speed,
                diff,
                i,
                len,
                pos;

            if ( moved ) {

                if ( duration < 250 ) {

                    // 如果滑动速度比较快，偏移量跟根据速度来算
                    speed = absDeltaX / duration;
                    diff = Math.min( Math.round( speed * viewNum * 1.2 ),
                            viewNum );
                } else {
                    diff = Math.round( absDeltaX / (me.perWidth || me.width) );
                }
                
                if ( diff && !isPastBounds ) {
                    me._slide( index, diff, dir, me.width, opts.speed,
                            opts, true );
                    
                    // 在以下情况，需要多移动一张
                    if ( viewNum > 1 && duration >= 250 &&
                            Math.ceil( absDeltaX / (me.perWidth ||
                            me.width) ) !== diff ) {

                        me.index < index ? me._move( me.index - 1, -me.perWidth,
                                opts.speed ) : me._move( me.index + viewNum,
                                me.width, opts.speed );
                    }
                } else {
                    
                    // 滑回去
                    for ( i = index - viewNum, len = index + 2 * viewNum;
                        i < len; i++ ) {

                        pos = opts.loop ? me._circle( i ) : i;
                        me._translate( pos, slidePos[ pos ], 
                                opts.speed );
                    }
                }
            }

            $doc.off( 'touchmove.slider touchend.slider touchcancel.slider',
                    me._handler );
        }
    } );
})( gmu, gmu.$ );