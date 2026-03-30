<section id="story" class="container"> 
	[not-group=5]
		<ul class="story_icons">
			<li class="edit_btn">
				[edit]<i title="Редактировать">Редактировать</i>[/edit]
			</li>
		</ul>
	[/not-group]
    <div class="story-hero">
        [xfgiven_poster]<div class="hero-img e-cover">[xfvalue_poster]</div>[/xfgiven_poster]
        <h1 class="hero-title-fullstory">{title}</h1>
    </div>
    <div class="fullstory-content">
        <p class="fullstory-body">Цена: [xfvalue_price]</p>
        <h2 class="contacts-title">О СОБЫТИИ</h2>
        <p class="story-body">{full-story}</p>
    </div>
    </section>
    
    <section id="contacts" class="container">
        <div class="contacts-container">
            <div class="contacts-info">
                <h2 class="contacts-title">КОНТАКТЫ</h2>
                <address class="contacts-details">[xfvalue_contactfullstory]
                </address>
            </div>
            <div class="contacts-map">
                <div class="contacts-map iframe">[xfvalue_mapfull]</div>
            </div>
        </div>
    </section>

        

    <div class="vis-blog">
      <h2>Рекомендуем посетить</h2>
      <div class="vis-blog_items">
        <div class="swiper-wrapper">{related-news}</div>
        <i class="fa-regular fa-chevron-left"></i>
        <i class="fa-regular fa-chevron-right"></i>
      </div>
    </div>

   

    <script>
    var iframe = document.getElementsByTagName('iframe')[0];
    if (iframe.getAttribute('src').includes('youtube.com')) {
        iframe.setAttribute('style', 'width: 100%; height: 400px');

        var youtube_wrapper = document.createElement('div');
        youtube_wrapper.classList.add('youtube_wrapper');
        youtube_wrapper.setAttribute('style', 'width: 100%;');
        youtube_wrapper.innerHTML = iframe.outerHTML;
        iframe.parentNode.replaceChild(youtube_wrapper, iframe);

        var iframe_width = iframe.getAttribute('width'); // 356
        var iframe_height = iframe.getAttribute('height'); // 200
        // 100%/356*200
        function youtube_wrapperHeight() {
            var youtube_wrapperWidth = parseInt(getComputedStyle(document.querySelector('.youtube_wrapper')).width);
            youtube_wrapper.setAttribute('style', 'height: ' + youtube_wrapperWidth / iframe_width * iframe_height + 'px;');
        }
        youtube_wrapperHeight();
        window.addEventListener("resize", youtube_wrapperHeight);
    };
    </script>


