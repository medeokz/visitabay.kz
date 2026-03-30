<div class="vis-hero">
	<div class="swiper-wrapper">{include file="shortstory-hero.tpl"} </div>
    <div class="swiper-pagination"></div>
</div>

<br><br><br>

<script type="text/javascript" src="https://unpkg.com/youtube-background/jquery.youtube-background.min.js"></script>
<script type="text/javascript">
	const videoBackgrounds = new VideoBackgrounds('[data-vbg]');
</script>

<div class="vis-info">
  <div class="swiper-wrapper">{include file="shortstory-info.tpl"}</div>
  <i class="fa-regular fa-chevron-left"></i>
  <i class="fa-regular fa-chevron-right"></i>
</div>

<br><br><br>

<div class="vis-popular">
  <div class="vis-popular_head">
    <h2>{ui-popular-places}</h2>
    <span>{ui-popular-places-sub}</span>
  </div>
  <div class="vis-popular_items">{custom category="9" template="populer-mest" limit="6" order="date"}</div>
</div>

<br><br><br>

<div class="vis-blog">
  <h2>{ui-legends}</h2>
  <div class="vis-blog_items">
    <div class="swiper-wrapper">{custom category="9" template="shortstory-blog" limit="6" order="date"}</div>
    <i class="fa-regular fa-chevron-left"></i>
    <i class="fa-regular fa-chevron-right"></i>
  </div>
</div>

<br><br><br>

<div  id="beach" class="vis-sak_title">
  <h1>{ui-beach-tourism}</h1>
  <a href="#">{ui-see-all}<i class="fa-regular fa-chevron-right"></i></a>
</div>

<div class="vis-pla_items">
  {custom category="9" template="shortstory-beach" limit="6" order="date"}  
</div>

<br><br><br>

<div id="jekoturizm" class="vis-heri">
  <div class="swiper-wrapper">
    {custom category="17" template="shortstory-jekoturism" limit="2" order="date"}
  </div>
</div>

<br><br><br>

<div id="sakralnyi" class="vis-sak_title">
  <h1>{ui-sacred-tourism}</h1>
  <a href="#">{ui-see-all}<i class="fa-regular fa-chevron-right"></i></a>
</div>

<div class="vis-sak_items">
  <ul>
    <li><a href="https://visitabay.kz/sakralnyi-turizm/64-er-zhanibek.html">Ер Жанибек<i class="fa-light fa-circle-arrow-up-right"></i></a></li>
    <li><a href="https://visitabay.kz/sakralnyi-turizm/63-mavzolej-yrgyzbaj-ata.html">Мавзолей Ыргызбай – ата<i class="fa-light fa-circle-arrow-up-right"></i></a></li>
    <li><a href="https://visitabay.kz/sakralnyi-turizm/62-kozy-korpesha-i-bajan-sulu.html">Козы-Корпеша и Баян-Сулу<i class="fa-light fa-circle-arrow-up-right"></i></a></li>
    <li><a href="https://visitabay.kz/sakralnyi-turizm/61-alakol.html">Алаколь<i class="fa-light fa-circle-arrow-up-right"></i></a></li>
    <li><a href="https://visitabay.kz/sakralnyi-turizm/60-muzej-f-dostoevskogo.html">Музей Ф. Достоевского<i class="fa-light fa-circle-arrow-up-right"></i></a></li>
  </ul>
  <div class="vis-sak_item">
    <img src="https://visitabay.kz/uploads/monument-posvjaschennyj-zhertvam-semipalatinskogo-poligona.jpg"/>
    <a href="https://visitabay.kz/sakralnyi-turizm/59-monument-silnee-smerti.html">Монумент «Сильнее Смерти»</a>
  </div>
  <div class="vis-sak_item">
    <img src="https://visitabay.kz/uploads/l_height-7.webp"/>
    <div><a href="https://visitabay.kz/sakralnyi-turizm/58-muzej-alash-arystary-muhtar-aujezov.html">Музей «Алаш арыстары – Мухтар Ауэзов»</a></div>
  </div>
</div>



<br><br><br>

<div id="section-hotels" class="vis-sak_title">
  <h1>{ui-hotels-semey}</h1>
  <span class="hotels__subtitle">{ui-hotels-semey-sub}</span>
</div>

<section class="home-hotels">
  <div class="container">
    <div class="home-hotels__grid">
      {custom category="24" template="shortstory-hotels-home" limit="6" order="date"}
    </div>
  </div>
</section>
<br><br><br>

<div id="section-alakol" class="vis-sak_title">
  <h1>{ui-alakol-base}</h1>
  <span class="alakol__subtitle">{ui-alakol-base-sub}</span>
</div>

<section class="home-alakol">
  <div class="container">
    <div class="home-alakol__grid">
      <a href="https://localhost/visitabay.kz/baza-otdyha-alakol/" class="alakol-card">
        <div class="alakol-card__image">
          <img src="https://images.pexels.com/photos/210205/pexels-photo-210205.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Базы отдыха Алаколь">
        </div>
        <div class="alakol-card__content">
          <h3 class="alakol-card__title">Базы отдыха Алаколь</h3>
          <p class="alakol-card__meta">Северный и южный берег озера Алаколь</p>
          <p class="alakol-card__price">Подборка баз отдыха и пансионатов для отдыха с семьёй и друзьями.</p>
        </div>
      </a>

      <div class="alakol-info-card">
        <h3 class="alakol-info-card__title">Озеро Алаколь</h3>
        <p class="alakol-info-card__text">Алаколь — бессточное солёное озеро на востоке Казахстана, на границе областей Абай и Жетысу. Площадь около 2,7 тыс. км², глубина до 54 м. Озеро славится чистой водой, целебными грязями и рапой, пляжами и развитой инфраструктурой отдыха на северном и южном берегах.</p>
        <p class="alakol-info-card__text">Отдых на Алаколе популярен у семей с детьми: тёплая вода, пологий заход, санатории и базы с питанием и анимацией. Добраться можно на авто по трассе А-3 или через Усть-Каменогорск и Семей.</p>
      </div>
    </div>
  </div>
</section>
<br><br>


<div class="vis-events">
  <div class="vis-events_head">
    <h2>{ui-events-near}</h2>
  </div>
        <div class="event-filters">
            <button class="filter-btn">{ui-today}</button>
            <button class="filter-btn">{ui-tomorrow}</button>
            <button class="filter-btn">{ui-weekend}</button>
        </div>
        <div class="events-grid">
          {custom category="10" template="events" limit="2" order="date"}  
        </div>
    </div>
    <br><br>



<br><br>
