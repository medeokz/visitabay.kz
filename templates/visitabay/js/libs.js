// SLIDER VIS HERO
var swiper3 = new Swiper(".vis-hero", {
    watchSlidesProgress: true,
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
        bulletClass: 'swiper-pagination-bullet',
        bulletActiveClass: 'swiper-pagination-bullet-active'
    },
    loop: true,
    spaceBetween: 0,
    loopAdditionalSlides: 2,
    centeredSlides: false,
    slidesPerView: 1,
    breakpoints: {
        860: {
            slidesPerView: 1,
            centeredSlides: true,
            spaceBetween: 30,
        },
    },
    autoplay: {
        delay: 10000,
        disableOnInteraction: false,
    },
    on: {
        init: function() {
            document.documentElement.style.setProperty('--swiper-autoplay-time', `${this.params.autoplay.delay}ms`);
        },
        slideChangeTransitionStart: function() {
            let bullets = document.querySelectorAll('.swiper-pagination-bullet');
            bullets.forEach(bullet => {
                bullet.style.animation = 'none';
            });
            let activeBullet = document.querySelector('.swiper-pagination-bullet-active');
            if (activeBullet) {
                setTimeout(() => {
                    activeBullet.style.animation = '';
                }, 10);
            }
        }
    }
});

var swiper = new Swiper(".vis-info", {
    slidesPerView: "1",
    spaceBetween: 20,
    loop: true,
    autoplay: {
        delay: 5000,
        disableOnInteraction: false,
    },
    navigation: {
        nextEl: ".vis-info .fa-chevron-right",
        prevEl: ".vis-info .fa-chevron-left",
    }
});

var swiper = new Swiper(".vis-blog_items", {
    slidesPerView: 1.3,
    spaceBetween: 30,
    navigation: {
        nextEl: ".vis-blog_items .fa-chevron-right",
        prevEl: ".vis-blog_items .fa-chevron-left",
    },
    breakpoints: {
        860: {
            slidesPerView: 3,
        },
    },
});

var swiper = new Swiper(".vis-gall_items", {
    slidesPerView: 1.3,
    spaceBetween: 30,
    navigation: {
        nextEl: ".vis-gall_items .fa-chevron-right",
        prevEl: ".vis-gall_items .fa-chevron-left",
    },
    breakpoints: {
        860: {
            slidesPerView: 2,
        },
    },
});

var swiper = new Swiper(".vis-heri", {
    slidesPerView: "1",
    effect: "fade",
    spaceBetween: 20,
    navigation: {
        nextEl: ".vis-heri .fa-chevron-right",
        prevEl: ".vis-heri .fa-chevron-left",
    }
});