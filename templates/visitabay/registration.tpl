<div class="dle-form">
    <h1>[registration]Регистрация[/registration][validation]Продолжение регистрации[/validation]</h1>
    [registration]
    <p>Регистрация на нашем сайте позволит Вам быть его полноценным участником.
    Вы сможете добавлять новости на сайт, оставлять свои комментарии, просматривать скрытый текст и многое другое.
    <br>В случае возникновения проблем с регистрацией, обратитесь к <a href="/index.php?do=feedback">администратору</a> сайта.
    </p>
    [/registration]
    [validation]
    <p>Ваш аккаунт был зарегистрирован на нашем сайте,
    однако информация о Вас является неполной, поэтому ОБЯЗАТЕЛЬНО заполните дополнительные поля в Вашем профиле.<br>
    </p>
    [/validation]<br>
    
    [registration]
    <div class="e-float">
        <input type="text" name="name" id="name" placeholder="Логин" required>
        <label>Логин</label>
    </div>
    
    <div class="e-float">
        <input type="password" name="password1" id="password1" placeholder="Пароль" required>
        <label>Пароль</label>
    </div>
    
    <div class="e-float">
        <input type="password" name="password2" id="password2" placeholder="Повторите пароль" required>
        <label>Повторите пароль</label>
    </div>
    
    <div class="e-float">
        <input type="email" name="email" id="email" placeholder="E-mail" required>
        <label>E-mail</label>
    </div>
    
    [question]
    <div class="dle-form_flex">
        <label id="dle-question" for="question_answer">{question}</label>
        <input placeholder="Введите ответ" type="text" name="question_answer" id="question_answer" required>
    </div>
    [/question] 
    [sec_code]
    <div class="dle-form_flex">
        {reg_code}
        <div class="dle-form_protec">
            <label for="sec_code">Введите код с картинки:</label>
            <input placeholder="Повторите код" title="Введите код указанный на картинке" type="text" name="sec_code" id="sec_code" required>
        </div>
    </div>
    [/sec_code]
    [recaptcha]
    <div class="dle-form_flex">
        <label for="">Защита от спама</label>
        {recaptcha}
    </div>
    [/recaptcha]
    [/registration]
    
    [validation]
    <div class="e-float">
        <input type="text" id="fullname" name="fullname">
        <label>Ваше имя</label>
    </div>
    
    {*<div class="e-float">
        <textarea id="info" name="info" rows="5"></textarea>
        <label>О себе</label>
    </div>*}
    
    <div class="upload-avatar">
        <label class="e-btn" for="image">
            <input type="file" name="image" id="image">
            <i class="fa-regular fa-upload"></i>Загрузить аватар
        </label>
        <img src="" id="uploadedPhoto">
    	<i class="fa-regular fa-trash e-none"></i>
    </div>

    <div class="dle-form_flexno">
        <table class="xfields">{xfields}</table>
    </div>
    [/validation]
    <button name="submit" type="submit">Зарегистрироваться</button>
</div>

<script>
document.addEventListener('DOMContentLoaded', function () {
    const uploadAvatar = document.querySelector('.upload-avatar');
    const fileInput = uploadAvatar.querySelector('input[type="file"]');
    const customFileInput = uploadAvatar.querySelector('label');
    const uploadedPhoto = uploadAvatar.querySelector('#uploadedPhoto');
    const removePhoto = uploadAvatar.querySelector('.fa-trash');
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedPhoto.src = e.target.result;
            uploadedPhoto.style.display = 'block';
            removePhoto.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    });
    removePhoto.addEventListener('click', () => {fileInput.value = '';uploadedPhoto.src = '';uploadedPhoto.style.display = 'none';removePhoto.style.display = 'none';});
});
</script>