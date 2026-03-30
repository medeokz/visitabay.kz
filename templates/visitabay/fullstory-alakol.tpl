<section id="story" class="container hotels-single"> 
	[not-group=5]
		<ul class="story_icons">
			<li class="edit_btn">
				[edit]<i title="Редактировать">Редактировать</i>[/edit]
			</li>
		</ul>
	[/not-group]

    <div class="fullstory-alakol-hero-split">
      <div class="fullstory-alakol-hero-split__image">
        <div class="hotels-single-hero-img e-cover">
          [xfvalue_gallery image="1"]
        </div>
        <div class="fullstory-alakol-hero-split__overlay">
          <h1 class="fullstory-alakol-hero-split__title">{title}</h1>
        </div>
      </div>
      <div class="fullstory-alakol-hero-split__info">
        <h2 class="fullstory-alakol-hero-split__info-title">Основная информация</h2>
        <ul class="fullstory-alakol-info-list">
          [xfgiven_location]<li><span>Расположение:</span> [xfvalue_location]</li>[/xfgiven_location]
          [xfgiven_price]<li><span>Стоимость:</span> от [xfvalue_price]</li>[/xfgiven_price]
          [xfgiven_tel]<li><span>Телефон:</span> [xfvalue_tel]</li>[/xfgiven_tel]
          [xfgiven_address]<li><span>Адрес:</span> [xfvalue_address]</li>[/xfgiven_address]
          [xfgiven_site]<li><span>Сайт:</span> <a href="[xfvalue_site]" target="_blank" rel="noopener">[xfvalue_site]</a></li>[/xfgiven_site]
        </ul>
      </div>
    </div>

    <div class="hotels-single-main">
      <div class="hotels-single-description">
        <h2 class="contacts-title">Описание</h2>
        <p class="story-body">{full-story}</p>
      </div>
    </div>

    <div class="hotels-amenities">
      <h2>Самые популярные удобства и услуги</h2>
      <ul class="hotels-amenities-list">
        [xfgiven_amen_pool]<li>Бассейн</li>[/xfgiven_amen_pool]
        [xfgiven_amen_wifi]<li>Бесплатный Wi‑Fi на территории базы</li>[/xfgiven_amen_wifi]
        [xfgiven_amen_beach]<li>Собственный пляж или первая линия</li>[/xfgiven_amen_beach]
        [xfgiven_amen_familyrooms]<li>Семейные номера и домики</li>[/xfgiven_amen_familyrooms]
        [xfgiven_amen_spa]<li>Спа, баня или сауна</li>[/xfgiven_amen_spa]
        [xfgiven_amen_parking]<li>Бесплатная парковка</li>[/xfgiven_amen_parking]
        [xfgiven_amen_meals]<li>Питание включено или столовая на территории</li>[/xfgiven_amen_meals]
        [xfgiven_amen_nonsmoking]<li>Номера для некурящих</li>[/xfgiven_amen_nonsmoking]
        [xfgiven_amen_playground]<li>Детская площадка</li>[/xfgiven_amen_playground]
        [xfgiven_amen_animation]<li>Анимация и досуг для детей</li>[/xfgiven_amen_animation]
        [xfgiven_amen_parents]<li>Спокойная семейная зона отдыха</li>[/xfgiven_amen_parents]
      </ul>
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

