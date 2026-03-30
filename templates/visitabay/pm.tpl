<div class="dle-form pm-page">
    <h1>Персональные сообщения</h1>
    <ul class="pm-page_lists e-flex">
        <li>[inbox]Входящие[/inbox]</li>
        <li>[outbox]Отправленные[/outbox]</li>
        <li>[new_pm]Создать[/new_pm]</li>
    </ul>
    <div class="pm-page_status">
        <div>Папки персональных сообщений заполнены на:</div>
        {pm-progress-bar} {proc-pm-limit}% от лимита ({pm-limit} сообщений)
    </div>
    [pmlist]
    <div class="pm-page">
        <h2>Список сообщений</h2>
        {pmlist}
    </div>
    [/pmlist] [readpm]
    <div class="pm-page">
        <h2>Ваши сообщения</h2>
        <div class="dle-comm_item">
            <div class="dle-comm_meta e-flex">
                <div class="dle-comm_user">
                    <div class="dle-comm_avatar e-cover"><img src="{foto}" alt="{login}" /></div>
                    <div>[not-group=5]{author}[/not-group][group=5]<a>{login}</a>[/group]<span>{date}</span></div>
                </div>
                [reply]Ответить[/reply]
                <div class="dle-comm_det">
            		<i class="fa-regular fa-ellipsis"></i>
            		<div>[del]Удалить[/del]</div>
        		</div>
            </div>
            <div class="dle-comm_text">{text}</div>
        </div>
        [/readpm] [newpm]
        <div class="pm-page">
            <h2>Новое сообщение</h2>
            <div class="e-grid2">
                <div class="e-float">
                    <input type="text" name="name" value="{author}" placeholder="Кому" required />
                    <label>Ваше имя:</label>
                </div>
                <div class="e-float">
                    <input type="text" name="subj" value="{subj}" placeholder="Тема" />
                    <label>Ваше имя:</label>
                </div>
            </div>
            <div class="dle-form_flexno">{editor}</div>
            [question]
            <div class="dle-form_flex">
                {question}
                <input type="text" name="question_answer" id="question_answer" placeholder="Впишите ответ на вопрос" required />
            </div>
            [/question] [sec_code]
            <div class="dle-form_flex">
                {sec_code}
                <div class="dle-form_protec">
                    <label for="sec_code">Введите код с картинки:</label>
                    <input type="text" name="sec_code" id="sec_code" placeholder="Впишите код с картинки" maxlength="45" required />
                </div>
            </div>
            [/sec_code] [recaptcha]
            <div class="dle-form_flex">
                <label for="">Защита от спама</label>
                {recaptcha}
            </div>
            [/recaptcha]
            <div class="dle-form_flexno checkbox">
                <label for="outboxcopy">
                    <input type="checkbox" id="outboxcopy" name="outboxcopy" value="1" checked />
                    Сохранить сообщение в папке "Отправленные"
                </label>
            </div>
            <div class="dle-form_flex">
                <button type="submit" name="add">Отправить</button>
                <button class="e-btn" style="background: var(--color2); margin-left: 20px;" onclick="dlePMPreview()">Просмотр</button>
            </div>
            [/newpm]
        </div>
    </div>
</div>