    <section id="story" class="container"> 
    	[not-group=5]
    		<ul class="story_icons">
    			<li class="edit_btn">
    				[edit]<i title="Редактировать">Редактировать</i>[/edit]
    			</li>
    		</ul>
    	[/not-group]
    <div class="slider">
      <div class="slides">
          <div class="swiper-slide e-cover slide active">[xfvalue_gallery image="1"]</div>
          <div class="swiper-slide e-cover slide">[xfvalue_gallery image="2"]</div>
          <div class="swiper-slide e-cover slide">[xfvalue_gallery image="3"]</div>
      </div>
    
      <div class="bottom-center">
        <h3 class="luxury-heading">{title}</h3>
        <div class="indicators">
          <span class="dot active" onclick="showSlide(0)"></span>
          <span class="dot" onclick="showSlide(1)"></span>
          <span class="dot" onclick="showSlide(2)"></span>
        </div>
      </div>
    </div>
    
    <br><br><br>
    
    <div class="story-content">
        <p class="">{short-story}</p>
        <p class="story-body">{full-story}</p>
    </div>
    </section>

    <br><br><br>
    
    <div class="vis-gall">
      <h2>Галерея</h2>
      <div class="vis-gall_items">
        <div class="swiper-wrapper">
          <div class="swiper-slide e-cover">[xfvalue_gallery image="1"]</div>
          <div class="swiper-slide e-cover">[xfvalue_gallery image="2"]</div>
          <div class="swiper-slide e-cover">[xfvalue_gallery image="3"]</div>
          <div class="swiper-slide e-cover">[xfvalue_gallery image="4"]</div>
        </div>
        <i class="fa-regular fa-chevron-left"></i>
        <i class="fa-regular fa-chevron-right"></i>
      </div>
    </div>
    
    <br><br><br>
    <div class="vis-blog">
      <h2>Где остановиться</h2>
      <div class="vis-blog_items">
        <div class="swiper-wrapper">{custom category="24" template="shortstory-hotels" limit="6" order="date"}</div>
        <i class="fa-regular fa-chevron-left"></i>
        <i class="fa-regular fa-chevron-right"></i>
      </div>
    </div>
    
    <br><br><br>

    <div class="vis-blog">
      <h2>Ближайшие объекты</h2>
      <div class="vis-blog_items">
        <div class="swiper-wrapper">{related-news}</div>
        <i class="fa-regular fa-chevron-left"></i>
        <i class="fa-regular fa-chevron-right"></i>
      </div>
    </div>
    
    <br><br><br>

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


