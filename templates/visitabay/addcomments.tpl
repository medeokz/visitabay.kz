<textarea name="comments" id="commentsadd" rows="3" onfocus="setNewField(this.name, document.getElementById( 'dle-comments-form' ))" placeholder="Напишите комментарий"></textarea>
[not-logged]
<div class="e-field e-grid2">
    <input type="text" maxlength="35" name="name" id="name" placeholder="Ваше имя" />
    <input type="text" maxlength="35" name="mail" id="mail" placeholder="Ваш e-mail (необязательно)" />
</div>
[/not-logged]
[question]
<div class="e-field">
    {question}
    <input type="text" name="question_answer" id="question_answer" placeholder="Впишите ответ на вопрос" required />
</div>
[/question] 
[sec_code]
<div class="e-field e-flex">
    {sec_code}
    <div class="dle-form_protec">
        <label for="sec_code">Введите код с картинки:</label>
        <input type="text" name="sec_code" id="sec_code" placeholder="Впишите код с картинки" maxlength="45" required />
    </div>
</div>
[/sec_code] 
[recaptcha]
<div class="e-field e-flex"><label for="">Защита от спама</label>{recaptcha}</div>
[/recaptcha] 
<div class="dle-comm_submit">
    [allow-comments-subscribe]{comments-subscribe}[/allow-comments-subscribe]
    <button name="submit" type="submit"><i class="fa-regular fa-paper-plane-top"></i> Отправить</button>
</div>