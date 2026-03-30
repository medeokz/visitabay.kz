<div class="dle-lk">
    <div class="dle-lk_link">
        <span data-tab="setting" class="active"><i class="fa-regular fa-user"></i>Профиль</span>
    	<span data-tab="order"><i class="fa-regular fa-cart-shopping"></i>Мои заказы</span>
    	<span data-tab="fav"><i class="fa-regular fa-heart"></i>Избранное</span>
    </div>
    <div class="dle-lk_grid">
        <div id="setting" class="dle-lk_content tab-content active">
            <h2>Мои данные</h2>
            <div class="dle-lk_upload">
                <input type="file" name="image" id="image">
                <div id="avatar" style="background: url({foto}) center center / cover;"></div>
                <div>
                    <button id="upload-button" type="button">Выбрать изображение</button>
                    <span>Файл PNG или JPEG размером не более 1Мб.</span>
                </div>
                <label><input type="checkbox" name="del_foto" id="del_foto">Удалить аватар</label>
            </div>
            <div class="e-field">
                <label>Ваше имя:</label>
                <input type="text" name="fullname" value="{fullname}" placeholder="Ваше Имя"/>
            </div>
            <div class="e-field">
                <label>Ваш e-mail:</label>
                <input type="text" name="email" value="{editmail}" placeholder="Ваш E-Mail: {editmail}"/>
            </div>
            <div class="e-field">
                <label>Часовой пояс:</label>
                {timezones}
            </div>
            <div class="e-field">
                <label>Ваш сайт:</label>
                <input type="text" name="info" placeholder="Ваш сайт" value="{editinfo}"/>
            </div>
            <br><h2>Cоциальные сети</h2>
            <div class="dle-lk_soc">
                <span>Привяжите социальную сеть к сайту, и входите на сайт через соц. сеть</span>
                <div>
                    [google]<a href="{google_url}"><img src="{THEME}/dleimages/soc/google.svg"/></a>[/google]
                    [detach-google]<img src="{THEME}/dleimages/soc/google.svg"/>[/detach-google]
                    [yandex]<a href="{yandex_url}"><img src="{THEME}/dleimages/soc/yandex.svg"/></a>[/yandex]
                    [detach-yandex]<img src="{THEME}/dleimages/soc/yandex.svg"/>[/detach-yandex]
                </div>
            </div>
            <br><h2>Настройки безопасности</h2>
            <div class="e-field">
                <label>Двухфакторная аутентификация:</label>
                {twofactor-auth}
            </div>
            <div class="e-field">
                <label>Cтарый пароль:</label>
                <input type="password" name="altpass" placeholder="Старый пароль"/>
            </div>
            <div class="e-field">
                <label>Новый пароль:</label>
                <input type="password" name="password1" placeholder="Новый пароль"/>
            </div>
            <div class="e-field">
                <label>Повторите пароль:</label>
                <input type="password" name="password2" placeholder="Повторите пароль"/>
            </div>
            <br><h2>Дополнительные опции</h2>
            {xfields}
            <div class="dle-lk_checkbox">
                <div class="checkbox">{hidemail}</div>
                <div class="checkbox">{news-subscribe}</div>
                <div class="checkbox">{comments-reply-subscribe}</div>
                <div class="checkbox">{unsubscribe}</div>
            </div><br><br>
            <div class="dle-lk_link">
                <button name="submit" type="submit">Отправить</button>
                [delete]<i class="fa-regular fa-trash"></i> Удалить[/delete]
            </div>
            <input name="submit" type="hidden" id="submit" value="submit"/>
        </div>
    
        <div id="order" class="dle-lk_content tab-content store-order">
            <h2>Мои заказы ({order-count})</h2>
            [order]<ul>{order}</ul>[/order]
            [not-order]У вас пока нет совершенных покупок.[/not-order]
        </div>

        <div id="fav" class="dle-lk_content tab-content">
            <h2>Избранное</h2>
            <div class="e-grid4">{custom favorites="yes" order="id_as_list”}</div>
        </div>
	</div>
</div>

<script>
// UPLOAD
const UPLOAD_BUTTON = document.getElementById("upload-button");
const FILE_INPUT = document.querySelector("input[type=file]");
const AVATAR = document.getElementById("avatar");
UPLOAD_BUTTON.addEventListener("click", () => FILE_INPUT.click());
FILE_INPUT.addEventListener("change", event => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
        AVATAR.setAttribute("aria-label", file.name);
        AVATAR.style.background = `url(${reader.result}) center center/cover`;
    };
});
</script>