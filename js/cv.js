/**
 * Created by Arthur Violy
 */
jQuery(document).ready(function($){
	//

	var svgNS = "http://www.w3.org/2000/svg",
		xlinkNS = "http://www.w3.org/1999/xlink",
		PI = Math.PI,
		DAY_IN_MS = 1000 * 60 * 60 * 24,
		RADIUS = 50,
		DAYPX = 1,
		YEARPX = 365*DAYPX,
		SCROLL_BASE_OFFSET = 200/DAYPX,
		RADIUS_QUARTER_PERIMETER = PI*RADIUS/2,
		STAGE_WIDTH = 480,
		DATE_WRAPPER_BG_PATH = "M100,14.5c0,1.378-1.122,2.5-2.5,2.5h-73c-1.378,0-2.5-1.122-2.5-2.5v-29c0-1.378,1.122-2.5,2.5-2.5h73 c1.378,0,2.5,1.122,2.5,2.5V14.5z",
		DATE_WRAPPER_SHAPE_PATH = "M97.5-22h-73c-4.136,0-7.5,3.364-7.5,7.5V-4H9.163C7.619-7.53,4.1-10,0-10c-5.523,0-10,4.477-10,10s4.477,10,10,10	c4.1,0,7.619-2.47,9.163-6H17v10.5c0,4.136,3.364,7.5,7.5,7.5h73c4.136,0,7.5-3.364,7.5-7.5v-29C105-18.636,101.636-22,97.5-22zM100,14.5c0,1.378-1.122,2.5-2.5,2.5h-73c-1.378,0-2.5-1.122-2.5-2.5v-29c0-1.378,1.122-2.5,2.5-2.5h73c1.378,0,2.5,1.122,2.5,2.5V14.5z"
		;

	var scrollDate = -SCROLL_BASE_OFFSET,
		datesLines = [],
		snap = new Snap('#svg'),
		json;


	function DisplayDialog(item){
		var handler = $(_.template('<div class="dialog-handler"><div class="dialog <%= slug %>" style="background: <%= color %>"><h2><%= title %><i class="icon-cv icon-<%= boxIcon %>"></i></h2><h3><%= subtitle %></h3><div class="description" style="color:<%= darkenColor %>; border-color:<%= darkenColor %>;"><%= description %></div></div></div>')(item));
		var dialog = handler.find('.dialog');
		handler.click(function(){
			handler.addClass('fadeout');
			$('header').removeClass('up');
			setTimeout(function(){
				handler.remove();
			},2000);
		});
		$('header').addClass('up');
		$('body').append(handler);
		dialog.css({marginTop: -dialog.height() / 2})
	}

	function ApplyDefaults(obj,defaults){
		var ignore = /(el)|(path)/
		_(defaults).each(function(val,key){
			if(key.match(ignore)){return}
			if(!obj[key]){
				obj[key]=val;
			}
		})
	}

	function Icon(name){
		var o = {
			dy: json.icons[name].dy,
			code: String.fromCharCode(parseInt(json.icons[name].code, 16))
		}
		return o;
	}

	function CurveFn(item, n, start) {
		var o = {
			x: n > 0 ? 0 : n * item.direction,
			y: n > 0 ? n : 0,
			absn: Math.abs(n),
			inside: false
		};
		if (o.absn < RADIUS) {
			var nR = n / RADIUS;
			o.y = (Math.cos((nR - 3) * PI / 4) + 1) * RADIUS
			o.x = (Math.sin((nR + 1) * PI / 4) - 1) * RADIUS;
			o.x *= item.direction;
			o.inside = true;
		}
		if (start) {
			if (n < -RADIUS && n > -item.durationPx - RADIUS) {
				o.cx = RADIUS * -item.direction
				o.cy = 0;
				//DebugPoint(o.cx+item.tx, item.ty);
			}
		} else {
			if (n > RADIUS && n < item.durationPx + RADIUS) {
				o.cx = 0
				o.cy = RADIUS;
				//DebugPoint(item.tx, o.cy + item.ty);
			}
		}
		return o;
	}

	function GetPath(item){

		var path = "",
			a = (item.toNowDay - scrollDate)*DAYPX,
			b = a+ item.durationPx,
			aFn = CurveFn(item, a,true),
			bFn = CurveFn(item, b);

		//DebugPoint(aFn.x+item.tx, aFn.y+item.ty);
		//DebugPoint(bFn.x+item.tx, bFn.y+item.ty);

		path += "M"+aFn.x+" "+aFn.y;
		if(aFn.cx && bFn.cy){
			path += "L " + aFn.cx + " 0"
			path += "A "+RADIUS+" "+RADIUS+" 0 0 "+(item.direction>0 ? "1":"0") +" "+ bFn.cx+" " + bFn.cy
		}else if (aFn.cx) {
			path += "L " + aFn.cx + " 0"
			path += "A " + RADIUS + " " + RADIUS + " 0 0 " + (item.direction > 0 ? "1" : "0") + " " + bFn.x + " " + bFn.y
		}
		else if (bFn.cy) {
			path += "A " + RADIUS + " " + RADIUS + " 0 0 " + (item.direction > 0 ? "1" : "0") + " " + bFn.cx + " " + bFn.cy
			path += "L 0 " + bFn.cy
		}else if(aFn.inside || bFn.inside){
			path += "A " + RADIUS + " " + RADIUS + " 0 0 " + (item.direction > 0 ? "1" : "0") + " " + bFn.x + " " + bFn.y
		}
		if (bFn.x*bFn.y == 0){
			path += "L " + bFn.x + " " + bFn.y;
		}

		return path;
	}

	function UpdateItem(item) {

		if (item.icon) {
			UpdateIconItem(item);
		} else if(item.path) {
			item.path.attr({d:GetPath(item)});
		}
	}

	function UpdateIconItem(item){
		var a = (item.toNowDay - scrollDate) * DAYPX,
			aFn = CurveFn(item, a, true);
		item.el.transform('translate('+(aFn.x+item.tx)+' '+(aFn.y+item.ty)+')');

	}

	function UpdateYearGroup(year){
		var diff = (year.yearpx - scrollDate) * DAYPX,
			d = year.direction,
			dx = year.dx * 5,
			dy = year.dy * 5,
			transform = 'translate(' + dx + ',' + (diff + dy) + ') ';

		if (diff < -RADIUS) {
			transform = 'translate(' + (diff * -d + dx) + ',' + (dy) + ')  scale(.5)';// rotate(' + 90 * d + ') scale(.5)';
			//year.el.addClass('horizontal');
		} else if (diff < RADIUS) {
			var r = .5 - Math.max(-1, diff / RADIUS) / 2,
				x = RADIUS * (1 - Math.cos(r * PI / 2)),
				y = RADIUS * (1 - Math.sin(r * PI / 2));
			transform = 'translate(' + (x * d + dx) + ',' + (y + dy) + ')  scale(.5)';// rotate(' + d * 90 * r + ') scale(.5)';
			year.el.addClass('horizontal');
		}else{
			year.el.removeClass('horizontal');
		}
		transform += "scale(.5)";
		year.el.transform(transform);
	}

	function Resize(){
		var baseVal = $('#svg').get(0).viewBox.baseVal;

		if($(window).width() < 960){
				baseVal.x = -120,
				baseVal.width = 240;
		}else{
				baseVal.x = -240,
				baseVal.width = 480;
		}
	}

	function Setup(data){

		json = data;

		var itemsGroup = snap.group().attr({'id':'items'});

		_(data.curriculum).each(function(item,i){

			if (item.alias) {
				ApplyDefaults(item, _(data.curriculum).findWhere({slug: item.alias}))
				item.tx = item.ty = null;
				item.slug += "-alias";
			}
			ApplyDefaults(item,{
				fromDate : new Date(item.from),
				toDate : new Date(item.to),
				tx : item.dx * 5,
				ty : item.dy * 5,
				fontSize : 20
			})
			item.toNow = Math.max(0, Date.now() - item.toDate.getTime());
			item.toNowDay = Math.floor(item.toNow / DAY_IN_MS);
			item.duration = Math.max(0, item.toDate.getTime() - item.fromDate.getTime());
			item.durationDay = Math.floor(item.duration / DAY_IN_MS);
			item.durationPx = (Math.max(20, item.durationDay)) * DAYPX;
			item.darkenColor = tinycolor(item.color).darken(30).toString();


			if(item.icon){
				var circle = snap.circle(0,0,15),
					icon = Icon(item.icon),
					text = snap.text(0, 0, icon.code),
					group = snap.g(circle,text);
				circle.attr({fill:'transparent',stroke:item.color,'stroke-opacity':.5,'stroke-width':2})
				text.attr({textpath:"M0 "+(7.5+icon.dy)+" L15 "+(7.5+icon.dy)})
				text.attr({fill:item.color,'fill-opacity':.8,'font-size':item.fontSize,'font-family':'cv','text-anchor':'middle','alignment-baseline':'central'})
				item.el = group.attr({class: 'icon'});
			}else{
				var path = snap.path(GetPath(item)).attr({
						fill:'none',
						stroke:item.color
					}),
					group = snap.g(path).transform('translate('+item.tx+' '+item.ty+')');
				item.el = group.attr({class: 'item'});
				item.path = path;
			}


			item.el.click(function(){
				DisplayDialog(item);
			});

		});

		_(json.years).each(function(year,key){

			ApplyDefaults(year,{dx:0,dy:0,d:year.direction,value:parseInt(key),iconSize:24});
			var dateWrapperBg = snap.path(DATE_WRAPPER_BG_PATH),
				dateWrapperShape = snap.path(DATE_WRAPPER_SHAPE_PATH),
				dateText = snap.text(year.direction*61, 7.5, [year.value]),
				dateWrapper = snap.group(dateWrapperBg, dateWrapperShape).addClass("dateWrapper"),
				dateWrapperGroup = snap.group(dateWrapper, dateText).addClass('dateWrapperGroup '+(year.direction > 0 ? "left" : "right")),
				dateGroup = snap.group(dateWrapperGroup).addClass('dateGroup');

			//
			dateText.attr({"text-anchor": "middle","font-size":"28px","font-weight":"700"})
			dateWrapperBg.attr({fill: '#fff'});

			year.el = dateGroup;
			year.yearpx = (new Date().getFullYear() - year.value + (new Date().getMonth() + 1) / 12) * YEARPX;

		});

		$('#svg').mousewheel(MouseWheel)
		$(document).on('drag',FingerDrag);

		Resize();
		$(window).resize(Resize);
		Update();

	}
	function Update(){
		_(json.curriculum).each(UpdateItem);
		_(json.years).each(UpdateYearGroup);
	}

	function MouseWheel(e,dx,dy,d){
		scrollDate=Math.max(-SCROLL_BASE_OFFSET, scrollDate-d/4);
		Update();
		return false;
	}
	function FingerDrag(e){
		scrollDate=Math.max(-SCROLL_BASE_OFFSET, scrollDate - e.dy / 40);
		Update();
		return false;
	}

	$.ajax({
		url:'cv.json',
		dataType:'json'
	}).done(Setup);


});
