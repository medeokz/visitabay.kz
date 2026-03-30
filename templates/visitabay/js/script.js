document.addEventListener('DOMContentLoaded', function () {
    var hotelsPage = document.querySelector('.hotels-page');
    if (!hotelsPage) return;

    var buttons = Array.prototype.slice.call(
        hotelsPage.querySelectorAll('.hotels-filter-btn')
    );
    var cards = Array.prototype.slice.call(
        hotelsPage.querySelectorAll('.hotels-page-list .hotel-card-h')
    );

    function applyFilter(filter) {
        cards.forEach(function (card) {
            var categories = (card.getAttribute('data-categories') || '').split(/\s+/);
            var show = filter === 'all' || categories.indexOf(filter) !== -1;
            card.style.display = show ? '' : 'none';
        });
    }

    buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var filter = btn.getAttribute('data-filter') || 'all';

            buttons.forEach(function (b) {
                b.classList.remove('is-active');
            });
            btn.classList.add('is-active');

            applyFilter(filter);
        });
    });

    // начальное состояние — "Все варианты"
    var defaultBtn = hotelsPage.querySelector('.hotels-filter-btn[data-filter="all"]');
    if (defaultBtn) {
        defaultBtn.classList.add('is-active');
        applyFilter('all');
    }
});
