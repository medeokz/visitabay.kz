<div class="dle-addnews">
    <h1>Добавить пост</h1>
    <div class="e-grid2">
        <div class="e-float">
        	<input type="text" id="title" name="title" value="{title}" maxlength="150" placeholder="Заголовок" required/>
        	<label>Заголовок</label>
    	</div>
        {category1}
    </div>

    <div class="e-field">
        <label for="short_story">Краткое описание</label>
        [not-wysywyg]
        <div class="bb-editor">
            {bbcode}
            <textarea name="short_story" id="short_story" onfocus="setFieldName(this.name)" rows="10" required>{short-story}</textarea>
        </div>
        [/not-wysywyg] {shortarea}
    </div>

    <div class="e-field">
        <label for="full_story">Полное описание</label>
        [not-wysywyg]
        <div class="bb-editor">
            {bbcode}
            <textarea name="full_story" id="full_story" onfocus="setFieldName(this.name)" rows="12">{full-story}</textarea>
        </div>
        [/not-wysywyg] {fullarea}
    </div>

    <div class="e-field">
        <table style="width: 100%;">
            {xfields}
        </table>
    </div>
    <div class="e-field">
        <label for="alt_name">Ключевые слова</label>
        <input placeholder="Вводите через запятую" type="text" name="tags" id="tags" value="{tags}" maxlength="150" autocomplete="off" />
    </div>
    <div class="e-field">{admintag}</div>
    
    <div class="dle-form_vote e-none">
        <h2>Опрос</h2>
        <div class="e-field">
            <label for="vote_title">Заголовок:</label>
            <input type="text" name="vote_title" value="{votetitle}" maxlength="150" placeholder="Заголовок опроса" />
        </div>
        <div class="e-field">
            <label for="frage">Сам вопрос:</label>
            <input type="text" name="frage" value="{frage}" maxlength="150" placeholder="Сам вопрос" />
        </div>
        <div class="e-field">
            <label for="vote_body">Варианты ответов (Каждая новая строка является новым вариантом ответа):</label>
            <textarea name="vote_body" rows="10">{votebody}</textarea>
        </div>
        <div class="e-field checkbox">
            Разрешить выбор нескольких вариантов
            <input class="" type="checkbox" name="allow_m_vote" value="1" {allowmvote} />
        </div>
    </div>

    [question]
    <div class="e-field">
        <label id="dle-question" for="question_answer">{question}</label>
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
    <div class="e-field e-flex">
        <label for="">Защита от спама</label>
        {recaptcha}
    </div>
    [/recaptcha]

    <div class="e-field e-flex">
        <button type="submit" name="add">Отправить</button>
        <button class="e-btn" onclick="$('.dle-form_vote').toggle();return false;" style="background: var(--bg2);">Добавить опрос</button>
        {*<button onclick="preview()" type="submit" name="nview">Предпросмотр</button>*}
    </div>
</div>