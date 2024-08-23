function createCardSection(containerId, keyword) {
    fetch('/index.json')
        .then(response => response.json())
        .then(data => {
            const filteredArticles = data.filter(article => 
                article.title.includes(keyword) || article.content.includes(keyword)
            ).slice(0, 6); // 最多显示6篇文章

            const articlesContainer = document.getElementById(containerId);

            filteredArticles.forEach(article => {
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
        })
        .catch(error => console.error('Error loading articles:', error));
}