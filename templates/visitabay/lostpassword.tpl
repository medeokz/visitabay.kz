<div class="dle-form">
    <h1>Восстановить пароль</h1>
    <div class="dle-form_flexno">
        <label for="lostname">Ваш логин:</label>
        <input type="text" name="lostname" id="lostname" placeholder="Ваш логин или E-Mail на сайте" />
    </div>
    [sec_code]
    <div class="dle-form_flex">
        {code}
        <div class="dle-form_protec">
            <label for="sec_code">Введите код с картинки:</label>
            <input type="text" name="sec_code" id="sec_code" placeholder="Впишите код с картинки" maxlength="45" required />
        </div>
    </div>
    [/sec_code]
    [recaptcha]
    <div class="dle-form_flex">
        <label for="">Защита от спама</label>
        {recaptcha}
    </div>
    [/recaptcha]
    <button name="submit" type="submit">Отправить</button>
</div>