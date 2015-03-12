/**
 * Created by Arthur Violy
 */
jQuery(document).ready(function($){
	//

	var svgNS = "http://www.w3.org/2000/svg",
		xlinkNS = "http://www.w3.org/1999/xlink",
		DAY_IN_MS = 1000 * 60 * 60 * 24,
		RADIUS = 50,
		DAYPX = 1/10,
		RADIUS_QUARTER_PERIMETER = Math.PI*RADIUS/2,
		STAGE_WIDTH = 480;

	var scrollDate = 0,
		defs = $('#defs'),
		stage = $('#stage'),
		json;

	function GetPath(item){
		console.log(item.toNowDay)
		var path = "M "+ (item.level +.5) * 10+" "+ Math.abs((item.level + (item.level < 0 ? 1 : 0)) * 10),
			offset = item.toNowDay - scrollDate,
			minD = Math.max(100, item.durationDay),
			offsetX = offset<0 ? offset : 0,
			offsetY = offset+minD>0 ? offset+minD : 0; // base offset
		offsetX*=DAYPX;
		offsetY*=DAYPX;
		offset*=DAYPX;
		minD*=DAYPX;


		if(offsetX<0){
			path += "m " + (item.levelDirection * offsetX) + " 0 ";
			path += "l " + (item.levelDirection * -Math.max(-minD, offsetX ) ) + " 0 ";
			if(offsetY>0){
				path += "l 0 " + (offsetY );
			}
		}else{
			path += "m 0 " + (offset );
			path += "l 0 " + (minD );
		}

		//path+= "l 0 "+ minD*DAYPX;
		return path;
	}

	function Setup(data){

		json = data;

		_(data.curriculum).each(function(item){
			item.levelDirection = item.level==0 ? -1 :-item.level/Math.abs(item.level);
			item.fromDate = new Date(item.from);
			item.toDate = new Date(item.to);
			item.toNow = Math.max(0,Date.now()-item.toDate.getTime());
			item.toNowDay = Math.floor(item.toNow/DAY_IN_MS);
			item.duration = Math.max(0,item.toDate.getTime()-item.fromDate.getTime());
			item.durationDay = Math.floor(item.duration/DAY_IN_MS);

			var path = item.path = document.createElementNS(svgNS, 'path');
			path.setAttributeNS(null, 'id', item.slug);
			path.setAttributeNS(null, 'class', item.classes);
			path.setAttributeNS(null, 'd', GetPath(item));
			stage.append(path);

		});

		$(window).mousewheel(MouseWheel)
	}
	function Update(){
		_(json.curriculum).each(function (item) {
			item.path.setAttributeNS(null,'d',GetPath(item));
		});
	}

	function MouseWheel(e,dx,dy,d){
		scrollDate=Math.max(0, scrollDate-d);
		Update();
		return false;
	}

	$.ajax({
		url:'cv.json',
		dataType:'json'
	}).done(Setup);


});
