<!DOCTYPE html>
<html lang="{html-lang}">
    <head>
        {headers}
        <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0, user-scalable=0" />
        <link rel="shortcut icon" href="{THEME}/images/favicon.png" />
        <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v6.4.0/css/all.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
		    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		    <link href="https://fonts.googleapis.com/css2?family=Literata:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">        
        <link href="{THEME}/css/swiper.min.css" type="text/css" rel="stylesheet" />
        <link href="{THEME}/css/eassistant.css" type="text/css" rel="stylesheet" />
        <link href="{THEME}/css/engine.css" type="text/css" rel="stylesheet" />
        <link href="{THEME}/css/styles.css" type="text/css" rel="stylesheet" />
        <link href="{THEME}/css/animation.css" type="text/css" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Geologica:wght@100..900&display=swap" rel="stylesheet">
        
        <!-- Yandex.Metrika counter -->
        <script type="text/javascript">
            (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=105090254', 'ym');
        
            ym(105090254, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
        </script>
        <noscript><div><img src="https://mc.yandex.ru/watch/105090254" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
        <!-- /Yandex.Metrika counter -->
        
	</head>
    <body>
        <div id="loader">
          <div class="logo">VISITABAY</div>
          <div class="progress"></div>
        </div>

        {AJAX}
        <div class="wrapper">

          {include file="main-header.tpl"} 
          [available=main]<div class="container">{include file="main-page.tpl"}</div>[/available]
          [not-available=main|cat|lastnews|xfsearch|favorites|tags|newposts|search]<div class="content container">{info}{content}</div>[/not-available]
          [available=cat|lastnews|xfsearch|favorites|tags|newposts|search]
          <div class="content container">
              [aviable=cat][not-category=24,31,32]<h1>{category-title}</h1><p>{category-description}</p>[/not-category][/aviable]
              [aviable=favorites]<h1>Закладки</h1>[/aviable]
          	[aviable=lastnews]<h1>Новое на сайте</h1>[/aviable]
          	[aviable=xfsearch][xfnme]<h1>{xfnme}</h1>[/xfnme]<p>{page-description}</p>[/aviable]

              [aviable=cat][category=24]{include file="hotels-page.tpl"}[/category][/aviable]
              [aviable=cat][category=31]{include file="alakol-north-page.tpl"}[/category][/aviable]
              [aviable=cat][category=32]{include file="alakol-south-page.tpl"}[/category][/aviable]
              [aviable=cat][not-category=24,31,32]<div class="e-grid3">{info}{content}</div>[/not-category][/aviable]
              [not-aviable=cat]<div class="e-grid3">{info}{content}</div>[/not-aviable]
          </div>
          [/available]
          {include file="main-footer.tpl"} 
        </div>
        <script src="{THEME}/js/swiper.min.js"></script>
        <script src="{THEME}/js/libs.js"></script>
        <script src="{THEME}/js/slider.js"></script>
        <script src="{THEME}/js/oldslider.js"></script>
        <script src="{THEME}/js/script.js"></script>
        <script async defer src="//platform.instagram.com/en_US/embeds.js"></script>
    </body>
</html>