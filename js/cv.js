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
		STAGE_WIDTH = 480
		;

	var scrollDate = -SCROLL_BASE_OFFSET,
		datesLines = [],
		defs = $('#defs'),
		stage = $('#stage'),
		debug = $('#debug'),
		json;


	function CreateSVGElement(nodeName,attributes){
		var el = document.createElementNS(svgNS, nodeName);
		_(attributes).each(function(v,a){
			var ns;
			switch(a){
				case 'href':
					el.setAttributeNS(xlinkNS, a, v);
					break;
				default :
					el.setAttributeNS(null, a, v);
			}
		});
		return el;
	}
	function ClearDebug(){
		debug.html('');
	}
	function DebugPoint(x,y){
		var use = CreateSVGElement('use',{x:x,y:y,href:'#c'});
		debug.append(use);
		return use;
	}

	function GetPath(item){

		function CurveFn(n, start) {
			var o = {
				x: n > 0 ? 0 : n * item.direction,
				y: n > 0 ? n : 0,
				absn : Math.abs(n),
				inside : false
			}
			if(o.absn<RADIUS){
				var nR = n / RADIUS;
				o.y = (Math.cos((nR-3)*PI/4)+1)*RADIUS
				o.x = (Math.sin((nR+1)*PI/4)-1)*RADIUS;
				o.x*= item.direction;
				o.inside = true;
			}
			if(start){
				if(n<-RADIUS && n>-d-RADIUS){
					o.cx = RADIUS* -item.direction
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

		var path = "",
			a = (item.toNowDay - scrollDate)*DAYPX,
			d = (Math.max(50, item.durationDay))*DAYPX,
			b = a+ d,
			aFn = CurveFn(a,true),
			bFn = CurveFn(b),
			abVect = {x:bFn.x-aFn.x,y:bFn.y-aFn.y};

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

	function Setup(data){

		json = data;

		_(data.curriculum).each(function(item,i){
			item.fromDate = new Date(item.from);
			item.toDate = new Date(item.to);
			item.toNow = Math.max(0,Date.now()-item.toDate.getTime());
			item.toNowDay = Math.floor(item.toNow/DAY_IN_MS);
			item.duration = Math.max(0,item.toDate.getTime()-item.fromDate.getTime());
			item.durationDay = Math.floor(item.duration/DAY_IN_MS),
			item.tx = item.dx * 5;
			item.ty = item.dy * 5;

			var path = item.path = CreateSVGElement('path',{
				id:item.slug,
				class: item.classes,
				d: GetPath(item),
				stroke: item.color,
				transform: 'translate(' + item.tx + " " + item.ty + ')'
			});
			stage.find('#items').append(path);
		});

		for(var year=0; year<10; year++){
			var yearpx = year * YEARPX,
				yearGroup = CreateSVGElement('g',{transform:'translate(0,'+(yearpx)+')'}),

				yearText = CreateSVGElement('text', {class: 'year', x: -100, y: 0, fill: '#000'});
			yearGroup.appendChild(
				CreateSVGElement('line', {class: 'year', x1: -100, x2: 100, y1: 0, y2: 0})
			);
			yearGroup.appendChild(
				yearText
			);
			yearGroup.appendChild(DebugPoint(0,0));
			yearGroup.year = new Date().getFullYear() - year;
			yearGroup.yearpx = yearpx;
			yearText.textContent = yearGroup.year;


			_(datesLines).push(yearGroup);
			$('#dates-lines').append(yearGroup);
		}

		$(window).mousewheel(MouseWheel)
		Update();
	}
	function Update(){
		ClearDebug();
		_(json.curriculum).each(function (item,i) {
			item.path.setAttributeNS(null,'d',GetPath(item));
		});
		_(datesLines).each(function(yearGroup,i){
			var transform = 'translate(0,' + (yearGroup.yearpx-scrollDate) + ')',
				d = (i % 2 == 0 ? 1 : -1),
				diff = yearGroup.yearpx - scrollDate;

			if(diff<-RADIUS){
				transform = 'translate(' + (yearGroup.yearpx - scrollDate)*-d + ', 0) rotate('+90*d+')';
			}else if(diff<RADIUS){
				console.log(d);
				var r = .5-Math.max(-1, diff/RADIUS)/ 2,
					x = RADIUS*(1-Math.cos(r*PI/2)),
					y = RADIUS *(1-Math.sin(r*PI/2));
				transform = 'translate(' + x * d + ', '+y+') rotate(' + d*90 * r + ')';
			}
			yearGroup.setAttributeNS(null,'transform', transform);
		})
	}

	function MouseWheel(e,dx,dy,d){
		scrollDate=Math.max(-SCROLL_BASE_OFFSET, scrollDate-d/4);
		Update();
		return false;
	}

	$.ajax({
		url:'cv.json',
		dataType:'json'
	}).done(Setup);


});
