[group=5]
<div class="modal-login">
    <a href="#modal" name="modal"><i class="fa-light fa-arrow-right-to-arc"></i></a>
    <form action="" method="post" id="modal" class="modal">
        <i class="fa-regular fa-xmark"></i>
        <h2>Вход в аккаунт</h2>
        <div class="e-float">
            <input type="text" name="login_name" placeholder="Email" required/>
            <label>Email</label>
        </div>
        <div class="e-float">
            <a href="{lostpassword-link}">Забыли пароль?</a>
            <input type="password" name="login_password" id="login_password" placeholder="Пароль" required/>
            <label>Пароль</label>
        </div>
        <div class="modal-login_btn">
            <button onclick="submit();" type="submit">Войти</button>
            <a class="e-btn" href="{registration-link}">Регистрация</a>
        </div>
        {*<div class="modal-login_soc">
            <span>Войти с помощью</span>
            <div class="e-flex">
                [google]<a href="{google_url}"><img src="{THEME}/dleimages/soc/google.svg"/></a>[/google]
                [yandex]<a href="{yandex_url}"><img src="{THEME}/dleimages/soc/yandex.svg"/></a>[/yandex]
            </div>
        </div>*}
        <input name="login" type="hidden" id="login" value="submit">
    </form>
</div>
[/group]

[not-group=5]
<div class="header-user">
    <a><i class="fa-light fa-circle-user"></i></a>
    <div>
        <div class="header-user_info">
            <img src="{foto}" alt="{login}"/>
            <span>{login}</span>
            <div class="header-user_group">{group}</div>
        </div>
        <div class="header-user_link">
            [admin-link]<a href="{admin-link}"><i class="fa-regular fa-screwdriver-wrench"></i>Админпанель</a>[/admin-link] 
            <a href="{profile-link}"><i class="fa-regular fa-gear"></i>Мой кабинет</a>
            <a href="/pm/"><i class="fa-regular fa-comments-question-check"></i>Тех. поддержка</a>
            <a href="{logout-link}"><i class="fa-regular fa-arrow-right-from-bracket"></i>Выйти</a>
        </div>
    </div>
</div>
[/not-group]