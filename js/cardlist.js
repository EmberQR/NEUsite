function createCardSection(containerId, keyword) {
    fetch('/index.json')
        .then(response => response.json())
        .then(data => {
            // 筛选文章，排除掉 permalink 包含 /card/ 的内容
            const filteredArticles = data.filter(article => 
                (article.title.includes(keyword) || article.content.includes(keyword)) &&
                !article.permalink.includes('/card/')
            );

            const articlesContainer = document.getElementById(containerId);

            filteredArticles.forEach(article => {
                const card = document.createElement('div');
                card.className = 'card';
                card.onclick = () => window.location.href = article.permalink;

                const title = document.createElement('div');
                title.className = 'card-title';  // 使用 card-title 避免类名冲突
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

            // 设置网格布局每行显示3个卡片
            articlesContainer.style.display = 'grid';
            articlesContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
            articlesContainer.style.gap = '16px';
        })
        .catch(error => console.error('Error loading articles:', error));
}