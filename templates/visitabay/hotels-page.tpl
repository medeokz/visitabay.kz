<section id="hotels-page" class="hotels-page">
  <div class="container">
    <div class="story-hero">
      <img src="{THEME}/images/hotels-hero.jpg" alt="Гостиницы Семей" class="hero-img">
      <h1 class="hero-title-fullstory">Гостиницы Семей</h1>
    </div>

    <div class="hotels-page-content">
      <div class="hotels-page-intro">
        <p>
          Здесь собраны проверенные гостиницы, отели и гостевые дома Семея. 
          Выберите подходящее размещение по расположению, уровню сервиса и формату отдыха.
        </p>
      </div>

      <div class="event-filters hotels-filters">
        <button class="filter-btn hotels-filter-btn" data-filter="all">Все варианты</button>
        <button class="filter-btn hotels-filter-btn" data-filter="center">Центр города</button>
        <button class="filter-btn hotels-filter-btn" data-filter="embankment">Набережная Иртыша</button>
        <button class="filter-btn hotels-filter-btn" data-filter="family">Для семей</button>
        <button class="filter-btn hotels-filter-btn" data-filter="business">Для бизнеса</button>
      </div>

        <div class="hotels-page-layout">
        <aside class="hotels-page-sidebar">
          <h3>Как выбрать гостиницу</h3>
          <ul>
            <li>Определите, что важнее: близость к центру, набережной или достопримечательностям.</li>
            <li>Обратите внимание на наличие парковки, завтрака и конференц‑залов.</li>
            <li>Для семей подойдут отели с просторными номерами и тихими районами.</li>
          </ul>

          <div class="hotels-page-note">
            Если вы представляете гостиницу Семея и хотите попасть в подборку, 
            свяжитесь с нами через раздел «Контакты».
          </div>
        </aside>

        <div class="hotels-page-list">
          {custom category="24" template="shortstory-hotels-card" limit="20" order="date"}
        </div>
      </div>
    </div>
  </div>
</section>
