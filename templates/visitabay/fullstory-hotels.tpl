<section id="story" class="container hotels-single"> 
	[not-group=5]
		<ul class="story_icons">
			<li class="edit_btn">
				[edit]<i title="Редактировать">Редактировать</i>[/edit]
			</li>
		</ul>
	[/not-group]

    <div class="story-hero">
      <div class="hotels-single-hero-img e-cover">
        [xfvalue_gallery image="1"]
      </div>
      <div class="hotel-hero-overlay">
        <span class="hotel-hero-tag">Гостиница в Семее</span>
        <h1 class="hero-title-fullstory">{title}</h1>
      </div>
    </div>

    <div class="hotels-single-main">
      <div class="hotels-single-description">
        <h2 class="contacts-title">Описание</h2>
        <p class="story-body">{full-story}</p>
      </div>
      <aside class="hotels-single-info">
        <h3>Основная информация</h3>
        <ul>
          <li><span>Расположение:</span> г. Семей</li>
          <li><span>Стоимость:</span> от [xfvalue_price]</li>
          <li><span>Телефон:</span> [xfvalue_tel]</li>
        </ul>
      </aside>
    </div>

    <div class="hotels-amenities">
      <h2>Самые популярные удобства и услуги</h2>
      <ul class="hotels-amenities-list">
        [xfgiven_amen_pool]<li>Крытый бассейн</li>[/xfgiven_amen_pool]
        [xfgiven_amen_wifi]<li>Бесплатный Wi‑Fi</li>[/xfgiven_amen_wifi]
        [xfgiven_amen_transfer]<li>Трансфер от/до аэропорта</li>[/xfgiven_amen_transfer]
        [xfgiven_amen_familyrooms]<li>Семейные номера</li>[/xfgiven_amen_familyrooms]
        [xfgiven_amen_spa]<li>Спа и оздоровительный центр</li>[/xfgiven_amen_spa]
        [xfgiven_amen_parking]<li>Бесплатная парковка</li>[/xfgiven_amen_parking]
        [xfgiven_amen_fitness]<li>Фитнес‑центр</li>[/xfgiven_amen_fitness]
        [xfgiven_amen_nonsmoking]<li>Номера для некурящих</li>[/xfgiven_amen_nonsmoking]
        [xfgiven_amen_bar]<li>Бар</li>[/xfgiven_amen_bar]
        [xfgiven_amen_breakfast]<li>Очень хороший завтрак</li>[/xfgiven_amen_breakfast]
        [xfgiven_amen_reception24]<li>Круглосуточная стойка регистрации</li>[/xfgiven_amen_reception24]
      </ul>
    </div>
</section>
    
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


