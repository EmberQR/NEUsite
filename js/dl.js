document.addEventListener('DOMContentLoaded', function() {
    const initializeDownloadLink = (linkId, popupId, actualLink) => {
        const downloadLink = document.getElementById(linkId);
        const popup = document.getElementById(popupId);
        const popupContent = popup.querySelector('.popup-content');

        downloadLink.addEventListener('click', function() {
            let countdown = 3;

            const updatePopup = () => {
                if (countdown > 0) {
                    popupContent.textContent = `${countdown}秒后将开始下载...`;
                    countdown--;
                    setTimeout(updatePopup, 1000);
                } else {
                    popup.style.display = 'none';
                    window.location.href = actualLink;
                }
            };

            popup.style.display = 'block';
            updatePopup();
        });
    };

    window.initializeDownloadLink = initializeDownloadLink;
});
