<div class="dle-form">
    <h1>Обратная связь</h1>
    [not-logged]
    <div class="e-grid2">
        <div class="e-float">
            <input type="text" maxlength="35" name="name" placeholder="Ваше имя" />
            <label>Ваше имя</label>
        </div>
        <div class="e-float">
            <input type="text" maxlength="35" name="name" placeholder="Ваш E-Mail" />
            <label>Ваш E-Mail</label>
        </div>
    </div>
    [/not-logged]
    {*<div class="dle-form_flex">
        <label>Выберите кому:</label>
        {recipient}
    </div>*}
    <div class="dle-form_flexno e-none">
        <input type="hidden" name="recip" value="1" />
    </div>
    <div class="e-float">
        <input type="text" maxlength="45" name="subject" placeholder="Тема сообщения" />
        <label>Тема сообщения</label>
    </div>
    <div class="e-float">
        <textarea name="message" placeholder="Ваше письмо" style="height: 160px;"></textarea>
        <label>Ваше письмо</label>
    </div>
    
    [question]
    <div class="dle-form_flex">
        <label id="dle-question" for="question_answer">{question}</label>
        <input placeholder="Введите ответ" type="text" name="question_answer" id="question_answer" required>
    </div>
    [/question] 
    [sec_code]
    <div class="dle-form_flex">
        {code}
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
    
    <button class="e-flex50" name="send_btn" type="submit">Отправить</button>
</div>