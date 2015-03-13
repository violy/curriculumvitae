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
		DAYPX = 1/4,
		SCROLL_BASE_OFFSET = 200/DAYPX,
		RADIUS_QUARTER_PERIMETER = PI*RADIUS/2,
		STAGE_WIDTH = 480
		;

	var scrollDate = -SCROLL_BASE_OFFSET,
		defs = $('#defs'),
		stage = $('#stage'),
		debug = $('#debug'),
		json;

	function ClearDebug(){
		debug.html('');
	}
	function DebugPoint(x,y){
		var use = document.createElementNS(svgNS,'use');
		use.setAttributeNS(null,'x',x);
		use.setAttributeNS(null,'y',y);
		use.setAttributeNS(xlinkNS,'href','#c');
		debug.append(use);
	}

	function GetPath(item){

		function CurveFn(n, start) {
			var o = {
				x: n > 0 ? 0 : n * item.levelDirection,
				y: n > 0 ? n : 0,
				absn : Math.abs(n),
				inside : false
			}
			if(o.absn<RADIUS){
				var nR = n / RADIUS;
				o.y = (Math.cos((nR-3)*PI/4)+1)*RADIUS
				o.x = (Math.sin((nR+1)*PI/4)-1)*RADIUS;
				o.x*= item.levelDirection;
				o.inside = true;
			}
			if(start){
				if(n<-RADIUS && n>-d-RADIUS){
					o.cx = RADIUS* -item.levelDirection
					o.cy = 0;
					//DebugPoint(o.cx+item.tx, item.ty);
				}
			}else{
				if (n > RADIUS && n < d+RADIUS) {
					o.cx = 0
					o.cy = RADIUS;
					//DebugPoint(item.tx, o.cy + item.ty);
				}
			}
			return o;
		}

		var path = "",//"M "+ (item.level +.5) * 10+" "+ Math.abs((item.level + (item.level < 0 ? 1 : 0)) * 10),
			a = (item.toNowDay - scrollDate)*DAYPX,
			d = (Math.max(100, item.durationDay))*DAYPX,
			b = a+ d,
			aFn = CurveFn(a,true),
			bFn = CurveFn(b),
			abVect = {x:bFn.x-aFn.x,y:bFn.y-aFn.y};

		//DebugPoint(aFn.x+item.tx, aFn.y+item.ty);
		//DebugPoint(bFn.x+item.tx, bFn.y+item.ty);

		path += "M"+aFn.x+" "+aFn.y;
		if(aFn.cx && bFn.cy){
			path += "L " + aFn.cx + " 0"
			path += "A "+RADIUS+" "+RADIUS+" 0 0 "+(item.levelDirection>0 ? "1":"0") +" "+ bFn.cx+" " + bFn.cy
			path += "L " + bFn.x + " " + bFn.y;
		}else if (aFn.cx) {
			path += "L " + aFn.cx + " 0"
			path += "A " + RADIUS + " " + RADIUS + " 0 0 " + (item.levelDirection > 0 ? "1" : "0") + " " + bFn.x + " " + bFn.y
			path += "L " + bFn.x + " " + bFn.y;
		}
		else if (bFn.cy) {
			path += "A " + RADIUS + " " + RADIUS + " 0 0 " + (item.levelDirection > 0 ? "1" : "0") + " " + bFn.cx + " " + bFn.cy
			path += "L 0 " + bFn.cy
			path += "L " + bFn.x + " " + bFn.y;
		}else if(aFn.inside || bFn.inside){
			path += "A " + RADIUS + " " + RADIUS + " 0 0 " + (item.levelDirection > 0 ? "1" : "0") + " " + bFn.x + " " + bFn.y
		}else{
			path += "L " + bFn.x + " " + bFn.y;
		}

		return path;
	}

	function Setup(data){

		json = data;

		_(data.curriculum).each(function(item,i){
			//if (i > 1)return;
			item.levelDirection = item.level==0 ? -1 :-item.level/Math.abs(item.level);
			item.fromDate = new Date(item.from);
			item.toDate = new Date(item.to);
			item.toNow = Math.max(0,Date.now()-item.toDate.getTime());
			item.toNowDay = Math.floor(item.toNow/DAY_IN_MS);
			item.duration = Math.max(0,item.toDate.getTime()-item.fromDate.getTime());
			item.durationDay = Math.floor(item.duration/DAY_IN_MS),
			item.tx = (item.level + .5) * 10;
			item.ty = Math.abs((item.level + (item.level < 0 ? 1 : 0)) * 10);

			var path = item.path = document.createElementNS(svgNS, 'path');
			path.setAttributeNS(null, 'id', item.slug);
			path.setAttributeNS(null, 'class', item.classes);
			path.setAttributeNS(null, 'd', GetPath(item));
			path.setAttributeNS(null, 'transform', 'translate(' + item.tx + " " + item.ty + ')')
			stage.append(path);

		});

		$(window).mousewheel(MouseWheel)
	}
	function Update(){
		ClearDebug();
		_(json.curriculum).each(function (item,i) {
			//if(i>1)return;
			item.path.setAttributeNS(null,'d',GetPath(item));
		});
	}

	function MouseWheel(e,dx,dy,d){
		scrollDate=Math.max(-SCROLL_BASE_OFFSET, scrollDate-d);
		Update();
		return false;
	}

	$.ajax({
		url:'cv.json',
		dataType:'json'
	}).done(Setup);


});
