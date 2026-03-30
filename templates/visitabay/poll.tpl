<div class="dle-vote">
    <div class="dle-vote_title">
        <i class="far fa-ballot-check"></i>
        <h3>{question}</h3>
    </div>
    <div class="dle-vote_list">{list}</div>
    <div class="dle-vote_grade">Голосов: {votes}</div>
    <div class="dle-vote_btn">
    	[not-voted]<a class="fbutton" type="submit" onclick="doPoll('vote', '{news-id}'); return false;">Голосовать</a>[/not-voted]
        {*<a class="fbutton" type="submit" onclick="doPoll('results', '{news-id}'); return false;">Результаты</a>*}
    </div>  
</div>