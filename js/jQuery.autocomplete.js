(function($){
	$.fn.extend({
		autoComplete:function(option){
			return new Creator(this,option);
		}
	});
	//构造函数
	function Creator(input,option){
		var defaults={
			//本地数据
			lookup:[],
			
			//ajax请求参数
			data:{},
			
			//请求延迟时间
			delayms:0,
			
			//数据展示处理(创建布局)
			zLayout:null,
			
			//最大高度
			maxH:200,
			
			//宽度
			dWidth:0,
			
			//选择后要执行的函数
			callBack:null,
			
			//是否开启模糊查询
			fuzzyQuery:true,
			
			//模糊查询的关键词
			searchArr:[],
			
			//存放请求到或传入的数据 ajax|lookup
			dataStorage:[],
			
			//模糊查询数据
			fuzzyArr:[]
		};
		this.id=$(input).attr('id');
		this.settings=$.extend(defaults,option);
		
		
		_upInputView.apply(this,[input]);
		_InputView.apply(this,[input]);
		this.div=$('#auto_div_'+this.id);
		var oDiv=this.div;
		//根据窗口大小设置位置
		$(window).resize(function(){
			method.setPos(input);
		});
		$(document).on("click",function(){
			oDiv.hide();
		});
		
	}
	
	function _upInputView(input){
		var oDiv=document.getElementById('auto_div_'+this.id);
		if(oDiv){
			//已创建框架
			$(oDiv).remove();
		}
		var that=$(input);
		var _this=this;
		that.attr("autocomplete","off");
		var option=this.settings;
		that.on("focus",function(){
			var val=$(this).val();
			method.ikeyUp(val,_this.id,_this.div,option);
		}).on("keyup",function(){
			_this.div.show();
			//进行模糊查询
			if(option.fuzzyQuery)
			{
				var val=$.trim($(this).val());
				method.ikeyUp(val,_this.id,_this.div,option);
			}
			
		}).on("keydown",function(ev){
			var code=ev.keyCode;
			//上下方向键、回车选择
			method.ikeyDown(code,_this.id,option);
			
		}).on("dblclick",function(){
			//双击input显示下拉框
			_this.div.show();
			method.setPos(input);
		}).on("click",function(ev){
			ev.stopPropagation();
		});
	}
	
	/**
	 * 创建框架
	 * 请求数据
	 * */
	function _InputView(input){
		var _this=this;
		var option=this.settings;
		var oDiv=document.getElementById('auto_div_'+this.id);
		if(oDiv){
			//已创建框架
			$(oDiv).remove();
			method.creatDiv(input,option);
		}else{
			method.creatDiv(input,option);   //创建框架
		}
		method.setPos(input)             //设置框架位置
		
		//判断是否使用本地数据
		if(option.lookup.length > 0)
		{
			var html=option.zLayout?option.zLayout(option.lookup):(function(){
					alert('请传入result');
				})();
				option.dataStorage=option.lookup;
				option.fuzzyArr=option.lookup;
			//把返回的布局填充到框架中
			method.fillContent(_this.id,html,option.lookup,option);
			return false;
		}
		
		//ajax请求数据
		setTimeout(function(){
			method.ajaxData(_this.id,option);
		},option.delayms)
	}
	/**
	 * 方法
	 * */
	var method={
		creatDiv:function (input,option){
			//创建框架
			var oDiv=document.createElement('div');
			$(oDiv).attr({
				'id':'auto_div_'+$(input).attr('id'),
				'class':'framework_div'
			});
			var oUl=document.createElement('ul');
			oDiv.appendChild(oUl);
			$(oDiv).find("ul").css('position','relative');
			var left=$(input).offset().left;
			var top=$(input).offset().top;
			var H=$(input).outerHeight();
			var W=$(input).outerWidth();
			$(oDiv).css({
				'position':'absolute',
				'left':left,
				'top':top+H,
				'max-height':option.maxH,
				'width':option.dWidth == 0?W:option.dWidth,
				'overflow':'hidden',
				'overflow-y':'auto',
				'display':'none',
				'zIndex':'9999999'
			});
			$('body').append(oDiv);
		},
		setPos:function(input){
			//设置div位置
			var _input=$(input);
			var oDiv=$('#auto_div_'+$(input).attr('id'));
			var _w=$(window).width();//当前可视区宽度
			var _h=$(window).height();//当前可视区高度
			var oW=oDiv.outerWidth();//框架宽度
			var oH=oDiv.outerHeight();//框架高度
			var l=oDiv.offset().left;//框架距页面左侧距离
			var oInpW=_input.outerWidth();//当前input宽度
			var oInpH=_input.outerHeight();//当前input高度
			var L=_input.offset().left;//input距页面左侧距离
			var T=_input.offset().top;//input 距页面顶部距离
			var scroTop=$(document).scrollTop();//页面滚动距离
			if((T+oInpH+oH-scroTop) < _h){
				oDiv.css({'top':T+oInpH});
			}else if((T+oInpH+oH-scroTop) > _h && T > oH){
				//定位在input上方
				oDiv.css({'top':T-oH});
			}else if((T+oInpH+oH) > _h && T < oH){
				//定位在input下方
				oDiv.css({'top':T+oInpH});
			}
			if((L+oW) > _w && (L+oInpW) < _w){
				//div右边与input右边对其
				oDiv.css({'left':L+oInpW-oW});
			}else{
				//div左边与input左边对其
				oDiv.css({'left':L});
			}
		},
		ajaxData:function (id,option){
			//请求数据
			if(!option.url)return;
			$.ajax({
				url:option.url,
				data:option.data,
				type:'POST',
				dataType:'json',
				success:function(msg){
					var data=msg;
					var html=option.zLayout?option.zLayout(data):(function(){
						alert('请传入zLayout参数');
					})();
					option.dataStorage=data;
					option.fuzzyArr=data;
					method.fillContent(id,html,data,option);
				},
				error:function(msg){
					alert('请求数据失败，请检查网络！')
				}
			});
		},
		fillContent:function(id,html,data,option){
			//填充内容
			$('#auto_div_'+id+' ul').html(html);
			method.setPos($('#'+id));
			$('#auto_div_'+id+' ul li').eq(0).attr('sect','iNow').addClass('active');
			var oDiv=$('#auto_div_'+id);
			oDiv.scrollTop(0);
			this.lclick(oDiv,id,data,option);
			this.lmouseover(oDiv);
		},
		lclick:function(div,id,data,option){
			//给内容加点击事件
			var dataArr=data;
			var aLi=$(div).find('ul li');
			aLi.off("click",a);
			aLi.on("click",a);
			function a(ev){
				//执行callback函数
				var index=$(this).index('#auto_div_'+id+' ul li');//获取当前下标
				var item=dataArr[index];//获取点击的相对内容（json）
				option.callBack && option.callBack(item);
				$(div).hide();
				ev.stopPropagation();
			}
		},
		lmouseover:function(oDiv){
			//li鼠标移入效果
			var aLi=$(oDiv).find('ul li');
			aLi.off("mouseover",a);
			aLi.on("mouseover",a);
			function a(){
				//执行callback函数
				aLi.removeAttr('sect');
				aLi.removeClass('active');
				$(this).attr('sect','iNow');
				$(this).addClass('active');
			}
		},
		ikeyUp:function(val,id,div,option){
			/**
			 * 处理模糊查询
			 * val 当前输入的值
			 * id  当前输入框id
			 * div 外层框架
			 * */
			if(this.keyCode.DOWN)
			{
				return false;
			}
			var str=val;
			this.sBoolean=false;
			if(str == '')
			{
				var html=option.zLayout?option.zLayout(option.dataStorage):(function(){
						alert('请传入zLayout参数');
					})();
				option.fuzzyArr=option.dataStorage;
				method.fillContent(id,html,option.dataStorage,option);
				return false;
			}
			var aLi=div.find('ul li');
			var reg=new RegExp(str,'gi');
			var arr=option.searchArr;  //模糊查询的参考值
			var dataArr=option.dataStorage;  //完整数据
			var fuzzArr=[];    //匹配的数据
			var flag=true;
			for(var i=0;i<dataArr.length;i++)
			{
				for(var j=0;j<arr.length;j++)
				{
					if(reg.test(dataArr[i][arr[j]]))
					{
						fuzzArr.push(dataArr[i]);
						flag=false;
						break;
					}
				}
			}
			if(flag){
				var str='<li>未搜索到相关内容</li>';
				div.find('ul').html(str);
				this.sBoolean=true;
				return false;
			}
			option.fuzzyArr=fuzzArr;
			var html=option.zLayout?option.zLayout(option.fuzzyArr):(function(){
						alert('请传入zLayout参数');
					})();
			method.fillContent(id,html,option.fuzzyArr,option);
		},
		ikeyDown:function(code,id,option){
			if(this.sBoolean){return false;}
			//上下方向键与回车选中功能
			var oDiv=$('#auto_div_'+id);
			var aLi=$(oDiv).find('ul li');
			var oLi=$(oDiv).find('ul li[sect="iNow"]');
			var ulH=oDiv.find('ul').height();
			var dH=oDiv.height();
			var T=0;
			switch(code)
			{
				case 40:
					this.keyCode.DOWN=true;//阻止keyup执行
					//下
					aLi.removeAttr('sect');
					aLi.removeClass('active');
					if(!oLi.next().text())
					{
						$(oDiv).find('ul li:first').attr('sect','iNow');
						$(oDiv).find('ul li:first').addClass('active');
						oDiv.scrollTop(0);
					}else{
						oLi.next().attr('sect','iNow');
						oLi.next().addClass('active');
					}
					T=$(oDiv).find('ul li[sect="iNow"]').position().top;
					var h=oLi.next().height();
					if((T+h) > dH && (T+h-oDiv.scrollTop())>= dH)
					{
						oDiv.scrollTop(T+h-dH);
					}
					break;
				case 38:
					this.keyCode.DOWN=true;//阻止keyup执行
					//上
					aLi.removeAttr('sect');
					aLi.removeClass('active');
					if(!oLi.prev().text())
					{
						$(oDiv).find('ul li:last').attr('sect','iNow');
						$(oDiv).find('ul li:last').addClass('active');
						var top=$(oDiv).find('ul li[sect="iNow"]').position().top;
						var height=$(oDiv).find('ul li[sect="iNow"]').height();
						oDiv.scrollTop(top+height-dH);
					}else{
						oLi.prev().attr('sect','iNow');
						oLi.prev().addClass('active');
					}
					T=$(oDiv).find('ul li[sect="iNow"]').position().top;
					var h=oLi.prev().height();
					
					if(T < oDiv.scrollTop()){
						oDiv.scrollTop(T);
					}
					break;
				case 13:
					this.keyCode.DOWN=false;
					//回车选中
					var index=$(oLi).index('#auto_div_'+id+' ul li');//获取当前下标
					var dataArr=option.fuzzyArr;
					var item=dataArr[index];//获取点击的相对内容（json）
					option.callBack && option.callBack(item);
					oDiv.hide();
					$('#'+id).blur();
					break;
				default:
					this.keyCode.DOWN=false;
					break;
			}
		},
		keyCode:{
			DOWN:false
		},
		sBoolean:false
	}
})(jQuery)

















