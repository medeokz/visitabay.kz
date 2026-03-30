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
    
    <div class="contacts-info_item">
      <div class="contacts-info_content">
          <h2 class="contacts-title">Как добраться</h2>
          <address class="contacts-details">[xfvalue_contactfullstory]</address>
          <a href="[xfvalue_linkmap]" class="promo-button">
            <span>ПОСТРОИТЬ МАРШРУТ</span>
            <img src="{THEME}/images/18128_319.svg" alt="arrow right">
          </a>
      </div>
      <div class="contacts-info_bg e-cover">
        [xfvalue_mapfull]
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
    
    
    
    
    
    <section id="section-hotels" class="hotels">
  <div class="container">
    <h2 class="hotels__title">ГДЕ ОСТАНОВИТЬСЯ</h2>
      <div class="hotels__layout">
          <div class="hotels__column-left">
          <div class="hotel-card-v">
            <img src="{THEME}/images/25a5c8f0e90caa45af1ca3c988ef1a13549c4c91.png" alt="Phi Phi Island" class="hotel-card-v__bg">
            <div class="hotel-card-v__content">
              <div class="hotel-card-v__info">
                <h3>Phi Phi Island</h3>
                <div class="location">
                  <img src="{THEME}/images/18128_295.svg" alt="location icon">
                  <span>Krabi, Thailand</span>
                </div>
              </div>
              <div class="hotel-card-v__price">
                <strong>380$</strong>
                <span>/Person</span>
              </div>
            </div>
          </div>
          <div class="hotel-card-v">
            <img src="{THEME}/images/5a2ebcc60242b31a00967104d84202b484b8da9b.png" alt="Koh Samui Island" class="hotel-card-v__bg">
            <div class="hotel-card-v__content">
              <div class="hotel-card-v__info">
                <h3>Koh Samui Island</h3>
                <div class="location">
                  <img src="{THEME}/images/18128_306.svg" alt="location icon">
                  <span>Krabi, Thailand</span>
                </div>
              </div>
              <div class="hotel-card-v__price">
                <strong>285$</strong>
                <span>/Person</span>
              </div>
            </div>
          </div>
        </div>
        <div class="hotels__column-right">
          <div class="hotels__promo">
            <div class="hotels__promo-stats">
              <span class="promo-number">100+</span>
              <span class="promo-text">Лучшие рекомендуемые гостиницы Семея</span>
            </div>
            <a href="#" class="promo-button">
              <span>ПОСМОТРЕТЬ ВСЕ</span>
              <img src="{THEME}/images/18128_319.svg" alt="arrow right">
            </a>
          </div>
          <div class="hotels__cards-horizontal">
            <div class="hotel-card-h">
              <img src="{THEME}/images/bf5f1c6de63ce60e4d91ce333b32739892b9cd13.png" alt="Sirithan Island" class="hotel-card-h__bg">
              <div class="hotel-card-h__content">
                <div class="hotel-card-h__info">
                  <h3>Sirithan Island</h3>
                  <div class="location">
                    <img src="{THEME}/images/18128_327.svg" alt="location icon">
                    <span>Krabi, Thailand</span>
                  </div>
                </div>
                <div class="hotel-card-h__price">
                  <strong>310$</strong>
                  <span>/Person</span>
                </div>
              </div>
            </div>
            <div class="hotel-card-h">
              <img src="{THEME}/images/4a97ecd8dd7f51dc39f80e1faa8dc42ae1f8a48b.png" alt="Koh Tao Island" class="hotel-card-h__bg">
              <div class="hotel-card-h__content">
                <div class="hotel-card-h__info">
                  <h3>Koh Tao Island</h3>
                  <div class="location">
                    <img src="{THEME}/images/18128_338.svg" alt="location icon">
                    <span>Krabi, Thailand</span>
                  </div>
                </div>
                <div class="hotel-card-h__price">
                  <strong>420$</strong>
                  <span>/Person</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <br><br>
    <br><br><br>
    
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


