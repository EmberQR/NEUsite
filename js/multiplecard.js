function initializeCardSection(containerId, mainKeyword, initialKeywords = []) {
    let selectedKeywords = initialKeywords;

    // 初始化默认展示
    updateCardSection(containerId, selectedKeywords, mainKeyword);

    // 导航按钮点击事件处理
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function () {
            const keyword = this.getAttribute('data-keyword');

            // 如果已经选中，取消选中并移除关键词
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                selectedKeywords = selectedKeywords.filter(k => k !== keyword);
            } else {
                // 否则选中并添加关键词
                this.classList.add('active');
                selectedKeywords.push(keyword);
            }

            // 更新卡片内容
            updateCardSection(containerId, selectedKeywords, mainKeyword);
        });
    });
}

function updateCardSection(containerId, keywords, mainKeyword) {
    const container = document.getElementById(containerId);
    container.classList.add('fade-hide');  // 隐藏当前卡片，增加动画效果

    setTimeout(() => {
        fetch('/index.json')
            .then(response => response.json())
            .then(data => {
                const filteredArticles = filterArticles(data, keywords, mainKeyword);
                container.innerHTML = '';  // 清空现有内容
                renderArticles(containerId, filteredArticles);
                container.classList.remove('fade-hide');
                container.classList.add('fade-show');
            })
            .catch(error => console.error('Error updating articles:', error));
    }, 300);  // 短暂延迟以配合动画效果
}

function filterArticles(data, keywords, mainKeyword) {
    // 确保所有文章都包含mainKeyword，且排除 /card/ 内容
    return data.filter(article => {
        const containsMainKeyword = article.title.includes(mainKeyword) || article.content.includes(mainKeyword);
        const containsSelectedKeywords = keywords.every(keyword =>
            article.title.includes(keyword) || article.content.includes(keyword)
        );
        return containsMainKeyword && containsSelectedKeywords && !article.permalink.includes('/card/');
    });
}

function renderArticles(containerId, articles) {
    const articlesContainer = document.getElementById(containerId);

    articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => window.location.href = article.permalink;

        const title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = article.title.length > 30 
                                ? article.title.slice(0, 27) + "..." 
                                : article.title;

        const summary = document.createElement('div');
        summary.className = 'summary';
        summary.textContent = article.summary.length > 60 
                                ? article.summary.slice(0, 57) + "..." 
                                : article.summary;

        card.appendChild(title);
        card.appendChild(summary);

        articlesContainer.appendChild(card);
    });

    articlesContainer.style.display = 'grid';
    articlesContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    articlesContainer.style.gap = '16px';
}
