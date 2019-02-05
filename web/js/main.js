function InitWeb()
{
    //提供一个给子级对象访问父级的handle
    var app_self = this;

    //函数集合，为了方便调用就把它们封装在一个去全局对象内了
    //所有函数完全独立，已避免互相调用
    var functionGroup = {
        //获取用户的登录状态
        isOnline :function () {
            return app_self.constDom.menu.user.online;
        },
        //打开黑幕，关闭黑屋需要手动调用closeBlackCover，或者给黑幕绑定上点击黑幕就关闭的事件
        openBlackCover : function () {
            //首先把黑色幕布的z-index值调大，盖住整个屏幕
            var black_cover = document.getElementById('black-cover');
            black_cover.style.setProperty('z-index','1');
            //使用一个计时器逐渐调大opacity
            var timer = setInterval(function () {
                var opacity = functionGroup.getBlackCoverOpacity();
                functionGroup.setBlackCoverOpacity(opacity + 0.06);
                if(opacity >= static_data.userblock.m_MAX_BLACK_COVER_OPACITY - 0.06)
                {
                    clearInterval(timer);
                }
            },10);
        },
        //关掉黑幕，并移除黑幕的所有绑定事件
        closeBlackCover : function () {
            //获取黑色幕布的dom
            var black_cover = document.getElementById('black-cover');
            //使用一个计时器逐渐调小opacity
            var timer_cover = setInterval(function () {
                var opacity = functionGroup.getBlackCoverOpacity();
                functionGroup.setBlackCoverOpacity(opacity - 0.06);
                if(opacity <= static_data.userblock.m_MIN_BLACK_COVER_OPACITY + 0.06)
                {
                    //把黑色幕布的z-index调低，弄到屏幕下面去
                    black_cover.style.setProperty('z-index','-1');
                    clearInterval(timer_cover);
                }
            } , 10);
            //移除所有绑定在click上的事件
            $('#black-cover').unbind('click');
        },
        //打开侧边栏
        openSideMenu : function () {
            //获取右侧边栏dom
            var menu = document.getElementById('user-menu');
            //使用一个计时器逐渐移动侧边栏
            var timer = setInterval(function () {
                //获取左边界坐标
                var left = functionGroup.getMenuLeft();
                //设置左边界坐标
                functionGroup.setMenuLeft(left + 10);
                //向左移动到的最大值
                var left_max = static_data.userblock.m_MAX_MENU_LEFT - 20;
                if(left >= left_max)
                {
                    clearInterval(timer);
                    functionGroup.setMenuLeft(0);
                    menu.style.setProperty('box-shadow','2px 0px 1px rgb(173, 150, 150)');
                }
            },3);
        },
        //关掉侧边栏
        closeSideMenu : function () {
            var menu = document.getElementById('user-menu');
            menu.style.setProperty("box-shadow","0px 0px 0px rgb(173, 150, 150)");
            var menu_width = functionGroup.getMenuWidth();
            var timer_menu = setInterval(function () {
                var left = functionGroup.getMenuLeft();
                var right = left + menu_width;
                if(right <= 0)
                {
                    clearInterval(timer_menu);
                    return;
                }
                functionGroup.setMenuLeft(left - 10);
            } , 3);
        },
        //到自己的主页去
        goToMyIndex : function () {
            location.href = static_data.getUrlPath("msg.html",static_data.m_URL_DOMAIN_WEB_DIR);
        },
        //移动到更新日志
        goToUpdateLog : function () {
            location.href = static_data.getUrlPath('#updates-log-list',static_data.m_URL_DOMAIN_WEB_DIR);
        },
        //跳转页面到登录界面
        goToLogin : function () {
            location.href = static_data.getUrlPath('passport.html',static_data.m_URL_DOMAIN_WEB_DIR);
        },
        //注销
        logOff : function () {
            if(app_self.constDom.menu.user.online)
            {
                $.ajax({
                    url : static_data.getUrlPath("LogOff.php",static_data.m_URL_DOMAIN_API_DIR),
                    async : true,
                    type : "post",
                    dataType : "json",
                    contentType : "application/x-www-form-urlencoded",
                    xhrFields: {
                        withCredentials: true
                    },
                    success : function(data)
                    {
                        if(data['data']['res'] == true)
                        {
                            location.href = static_data.getUrlPath("",static_data.m_URL_DOMAIN_WEB_DIR);
                        }
                    }
                });
            }
        },
        //设置用户信息，键值与值相对应
        setUserInfo : function (key, val) {
            app_self.constDom.menu.user[key] = val;
        },
        //设置用户信息，传入值为一个数组，键值与值相对应
        setUserInfoArray : function (ary) {
            for(var key in ary){
                app_self.functionGroup.setUserInfo(key,ary[key]);
            }
        },
        //登录检测
        passJct : function() {
            var self = this;
            $.ajax({
                url : static_data.getUrlPath("User.php",static_data.m_URL_DOMAIN_API_DIR),
                async : true,
                type : "post",
                dataType : "json",
                contentType : "application/x-www-form-urlencoded",
                xhrFields: {
                    withCredentials: true
                },
                success : function(data)
                {
                    if(data['data']['res'] == static_data.response.passjct.success)
                    {
                        self.setUserInfoArray(data['data']['data']);
                        self.setUserInfo('online',true);
                        var handle_user_id_txt = $("#menu-user-block-id-txt");
                        handle_user_id_txt.css('cursor','default');
                    }
                }
            });
        },
        //获取用户信息
        getUserInfo : function () {
            return app_self.app.menu_user_block._data.user;
        },
        //
        isPC : function() {
            var userAgentInfo = navigator.userAgent;
            var Agents = ["Android", "iPhone","SymbianOS", "Windows Phone","iPad", "iPod"];
            var flag = true;
            for (var v = 0; v < Agents.length; v++)
            {
                if (userAgentInfo.indexOf(Agents[v]) > 0)
                {
                    flag = false;
                    break;
                }
            }
            return flag;
        },
        //mode为空，即只有一个确认按钮，mode为1时有确认和取消两个按钮
        //网上抄的消息框，自己修改了一下样式和弹出动画，删除了原本的遮罩层
        //原地址https://blog.csdn.net/java_goodstudy/article/details/51482324
        alertBox : function (msg, mode) {
            msg = msg || '';
            mode = mode || 0;
            var top = document.body.scrollTop || document.documentElement.scrollTop;
            var isIe = (document.all) ? true : false;
            var isIE6 = isIe && !window.XMLHttpRequest;
            var sTop = document.documentElement.scrollTop || document.body.scrollTop;
            var sLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
            var winSize = function(){
                var xScroll, yScroll, windowWidth, windowHeight, pageWidth, pageHeight;
                // innerHeight获取的是可视窗口的高度，IE不支持此属性
                if (window.innerHeight && window.scrollMaxY) {
                    xScroll = document.body.scrollWidth;
                    yScroll = window.innerHeight + window.scrollMaxY;
                } else if (document.body.scrollHeight > document.body.offsetHeight) { // all but Explorer Mac
                    xScroll = document.body.scrollWidth;
                    yScroll = document.body.scrollHeight;
                } else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
                    xScroll = document.body.offsetWidth;
                    yScroll = document.body.offsetHeight;
                }

                if (self.innerHeight) {    // all except Explorer
                    windowWidth = self.innerWidth;
                    windowHeight = self.innerHeight;
                } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
                    windowWidth = document.documentElement.clientWidth;
                    windowHeight = document.documentElement.clientHeight;
                } else if (document.body) { // other Explorers
                    windowWidth = document.body.clientWidth;
                    windowHeight = document.body.clientHeight;
                }

                // for small pages with total height less then height of the viewport
                if (yScroll < windowHeight) {
                    pageHeight = windowHeight;
                } else {
                    pageHeight = yScroll;
                }

                // for small pages with total width less then width of the viewport
                if (xScroll < windowWidth) {
                    pageWidth = windowWidth;
                } else {
                    pageWidth = xScroll;
                }

                return{
                    'pageWidth':pageWidth,
                    'pageHeight':pageHeight,
                    'windowWidth':windowWidth,
                    'windowHeight':windowHeight
                }
            }();
            //弹出框
            var styleStr1 = 'display:block;position:fixed;_position:absolute;left:' + (winSize.windowWidth / 2 - 200) + 'px;top:' + (winSize.windowHeight / 2 - 150) + 'px;_top:' + (winSize.windowHeight / 2 + top - 150)+ 'px;'; //弹出框的位置
            var alertBox = document.createElement('div');
            alertBox.id = 'alertMsg';
            alertBox.style.cssText = styleStr1;
            //创建弹出框里面的内容P标签
            var alertMsg_info = document.createElement('P');
            alertMsg_info.id = 'alertMsg_info';
            alertMsg_info.innerHTML = msg;
            alertBox.appendChild(alertMsg_info);
            //创建按钮
            var btn1 = document.createElement('a');
            btn1.id = 'alertMsg_btn1';
            btn1.href = 'javascript:void(0)';
            btn1.innerHTML = '<cite>确定</cite>';
            btn1.onclick = function () {
                closeAlertBox();
                return true;
            };
            alertBox.appendChild(btn1);
            if (mode === 1) {
                var btn2 = document.createElement('a');
                btn2.id = 'alertMsg_btn2';
                btn2.href = 'javascript:void(0)';
                btn2.innerHTML = '<cite>取消</cite>';
                btn2.onclick = function () {
                    closeAlertBox();
                    return false;
                };
                alertBox.appendChild(btn2);
            }
            document.body.appendChild(alertBox);
            app_self.functionGroup.openBlackCover();

            //逐渐消失的动画
            function closeAlertBox(){
                alertBox.style.opacity = 1;
                var timer = setInterval(function () {
                    var opacity = alertBox.style.opacity;
                    alertBox.style.opacity = opacity - 0.02;
                    if(opacity + 0.02 <= 1)
                    {
                        document.body.removeChild(alertBox);
                        clearInterval(timer);
                        app_self.functionGroup.closeBlackCover();
                        app_self.functionGroup.closeSideMenu();
                    }
                } , 2);
            }
        },
        //创建dom的方法
        cDom : function(type,className,id,innerHtml){
            var v = $("<" + type + ">");
            if(className != null)
                v.attr('class',className);
            if(id != null)
                v.attr('id',id);
            if(innerHtml != null)
                v.html(innerHtml);
            return v;
        },
        //修改css样式
        //设置左侧菜单栏左边界坐标
        setMenuLeft : function (value) {
            app_self.constDom.menu.css.left = value;
        },
        //设置黑色幕布透明度
        setBlackCoverOpacity : function (value) {
            app_self.constDom.black_cover.css.opacity = value;
        },
        //获取左侧菜单栏左边界坐标
        getMenuLeft : function () {
            return app_self.constDom.menu.css.left;
        },
        //设置黑色幕布透明度
        getBlackCoverOpacity : function () {
            return app_self.constDom.black_cover.css.opacity;
        },
        //获取左侧菜单栏宽度
        getMenuWidth : function () {
            return app_self.constDom.menu.css.width;
        },
        //获取指定cookie
        getDestinationCookie : function (cookieName) {
            var strCookie = document.cookie;
            var arrCookie = strCookie.split("; ");
            for(var i = 0; i < arrCookie.length; i++)
            {
                var arr = arrCookie[i].split("=");
                if(cookieName === arr[0])return arr[1];
            }
            return false;
        },
        //向black_cover中添加点击事件，传入值需要是一个函数，将会被绑定到black_cover的onlick事件中
        //需要注意的是，当触发了onclick事件之后所有的绑定都会被清理
        blackCoverBindClick : function(p) {
            app_self.constDom.black_cover.methods.bind(p);
        },
    };

    //给外部访问函数集合的接口
    this.functionGroup = functionGroup;

    //创建dom和Vue对象
    this.constDom = new createVue();

    //设置标题
    setTitle();

    //检测用户登录情况
    functionGroup.passJct();

    //创建侧边栏和顶层的dom对象，并赋予类名和id以及innerHtml
    //这是一个构造器
    function createVue() {
        //创建挂载节点
        var _header = document.createElement('div');
        _header.id = '_header';
        var _menu   = document.createElement('div');
        _menu.id = '_menu';
        var _black_cover = document.createElement('div');
        _black_cover.id = '_black_cover';
        var _footer = document.createElement('div');
        _footer.id = '_footer';

        //向html中添加挂载节点
        var app = document.getElementById('app');

        app.parentNode.insertBefore(_black_cover,app);
        app.parentNode.insertBefore(_menu,app);
        app.parentNode.insertBefore(_header,app);
        document.body.appendChild(_footer);

        //初始化css参数
        var menuWidth , menuLeft , menuUserBlockHeight , menuUserBlockTxtSize ,
            menuUserBlockAvatarSize;

        //修整PC与PE的侧边栏宽度
        if(!functionGroup.isPC())
        {
            menuWidth = innerWidth * 0.7;
            menuLeft = -menuWidth;
            menuUserBlockHeight = innerWidth * 0.12;
            menuUserBlockTxtSize = innerWidth * 0.03;
            menuUserBlockAvatarSize = innerWidth * 0.7 * 0.15;
        }else{
            menuUserBlockAvatarSize = 45;
            menuUserBlockHeight = innerWidth * 0.045;
            menuLeft = -300;
            menuWidth = 300;
            menuUserBlockTxtSize = 18;
        }

        //创建Vue构造器
        //头部固定栏
        var header = Vue.extend({
            template : '<div class="header" id="header">' +
                '           <div class="user-block-open" id="user-block-open">' +
                '               <div ' +
                '                   class="user-block-open-click" ' +
                '                   id="user-block-open-click"' +
                '                   @click="mouseClick"' +
                '               >' +
                '                   ≡≡' +
                '               </div>' +
                '           </div>' +
                '       </div>',
            data : function(){
                return {
                    //是否绑定标识
                    isBinded : false,
                }
            },
            methods : {
                mouseClick : function() {
                    functionGroup.openSideMenu();
                    functionGroup.openBlackCover();
                    $('#black-cover').bind('click',function() {
                        functionGroup.closeSideMenu();
                        functionGroup.closeBlackCover();
                    });
                },
                //函数绑定缓存，储存多组json格式的数据，对应法则为
                //{ func: 目标函数 , isConst: 是否在执行完一次函数之后清除本元素} 
                bindCache : [
                    {
                        func: function(){
                            console.log('Event : click #black_cover');
                        },
                        isConst : true
                    }
                ],
                //清理函数缓存
                unbind : function() {
                    for(var log in bindCache){
                        if(!log.isConst){
                            //remove this
                        }
                    }
                },
                //添加函数缓存
                bind : function(func) {
                    bindCache.push(func);
                }
            }
        });
        //侧边固定栏
        var menu = Vue.extend({
            template : '<div ' +
                '           class="user-menu" ' +
                '           id="user-menu"' +
                '           :style="{left: css.left + \'px\' , width: css.width + \'px\' }"' +
                '       >' +
                '           <div ' +
                '               class="menu-user-block" ' +
                '               id="menu-user-block"' +
                '               style="height:'+menuUserBlockHeight+'px;"' +
                '           >' +
                '               <div ' +
                '                   class="menu-user-block-avatar" ' +
                '                   id="menu-user-block-avatar"' +
                '                   style="width:'+menuUserBlockAvatarSize+'px;height:'+menuUserBlockAvatarSize+'px;"' +
                '               >' +
                '                   <img ' +
                '                       id="menu-user-block-avatar-img" ' +
                '                       class="menu-user-block-avatar-img" ' +
                '                       :src="user.avatar"' +
                '                       style="width: '+menuUserBlockAvatarSize+'px; height:'+menuUserBlockAvatarSize+'px;"' +
                '                   >' +
                '               </div>' +
                '               <div class="menu-user-block-uid" id="menu-user-block-uid">' +
                '                   <div class="menu-user-block-uid-txt" id="menu-user-block-uid-txt">' +
                '                       |uid : {{user.user_uid}}' +
                '                   </div>' +
                '               </div>' +
                '               <div class="menu-user-block-id" id="menu-user-block-id">' +
                '                   <div class="menu-user-block-id-txt" id="menu-user-block-id-txt" v-on="{click: !user.online && goToLogin}">' +
                '                       |id : {{user.user_id}}' +
                '                   </div>' +
                '               </div>' +
                '           </div>' +
                '           <hr class="menu-user-block-div-line">' +
                '           <div class="menu-func" id="menu-func">' +
                '               <ul class="menu-func-ul" id="menu-func-ul">' +
                '                   <li v-for="dep in func">' +
                '                       <div class="menu-func-li-btn-block" @click="dep.func">' +
                '                           <div class="menu-func-li-btn-block-txt">{{dep.name}}</div>' +
                '                           <div class="menu-func-li-btn-block-about">{{dep.about}}</div>' +
                '                       </div>' +
                '                   </li>' +
                '               </ul>' +
                '           </div>' +
                '       </div>',
            data : function() {
                return {
                    //侧边功能栏
                    func: [
                        {
                            name: '我的主页',
                            about: '字面意思呀，巴拉拉能量让你回到自己的主页！',
                            func: 'myIndex'
                        },
                        {
                            name: '更新日志',
                            about: '估计你对这个没啥兴趣',
                            func: 'updateLog'
                        },
                        {
                            name: '注销',
                            about: '嘤嘤嘤咱要溜了',
                            func: 'logOff'
                        }
                    ],
                    //用户数据
                    user: {
                        user_id: '未登录，点击登录',
                        user_uid: '-1',
                        user_email: 'example@google.com',
                        user_lv: '0',
                        user_exp: '0',
                        user_class: '',
                        avatar: 'http://hbimg.b0.upaiyun.com/a12f24e688c1cda3ff4cc453f3486a88adaf08cc2cdb-tQvJqX_fw658',
                        srm_jct: '',
                        login_time: '0',
                        online: false
                    },
                    //侧边菜单栏的css参数
                    css : {
                        left : menuLeft,
                        width : menuWidth
                    }
                }
            },
            methods : {
                goToLogin : function () {
                    functionGroup.goToLogin();
                },
                FunctionSwitch : function(key)
                {
                    switch(key)
                    {
                        case 'myIndex':
                            functionGroup.goToMyIndex();
                            break;
                        case 'updateLog':
                            functionGroup.closeBlackCover();
                            functionGroup.closeSideMenu();
                            functionGroup.goToUpdateLog();
                            break;
                        case 'logOff':
                            functionGroup.logOff();
                            break;
                    }
                }
            }
        });
        //黑色幕布固定栏
        //很蛋疼的是z-index中间的-号会被vue解析掉，所以绑定不了z-index元素
        var black_cover = Vue.extend({
            template : '<div ' +
                '           class="black-cover" ' +
                '           id="black-cover"' +
                '           :style="{opacity: css.opacity}"' +
                '       >' +
                '       </div>',
            data : function () {
                return {
                    css:{
                        opacity : 0
                    }
                }
            }
        });
        //底部固定栏
        var footer = Vue.extend({
            template : '<div class="footer" id="footer">'+static_data.baseinfo.m_COPYRIGHT+'</div>',
            data : function(){
                return {

                }
            },
            methods : {

            }
        });

        //实例化Vue对象
        this.header = new header();
        this.menu = new menu();
        this.black_cover = new black_cover();
        this.footer = new footer();

        //挂载Vue对象
        this.header.$mount('#_header');
        this.menu.$mount('#_menu');
        this.black_cover.$mount('#_black_cover');
        this.footer.$mount('#_footer');
    }

    //设置标题
    function setTitle(){
        document.title = static_data.getWebTitle();
    }
}

function pisert()
{
    return [
        Date.parse(new Date()) ,
        Math.floor(Math.random()*Math.pow(10,5))
    ];
}
