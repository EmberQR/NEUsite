
let client;

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

async function fetchNoCache(url) {
    const timestamp = new Date().getTime(); 
    const noCacheUrl = `${url}?timestamp=${timestamp}`; 
    return fetch(noCacheUrl); 
}

async function f1() {
    try {
        const r1 = await fetchNoCache('https://download.xn--xhq44jb2fzpc.com/upload/json/s.json');
        const d1 = await r1.json();

        const m1 = d1.masterKey;
        const k1 = CryptoJS.SHA256(m1);

        const c1 = {
            region: d2(d1.encryptedRegion, k1),
            accessKeyId: d2(d1.encryptedKeyId, k1),
            accessKeySecret: d2(d1.encryptedKeySecret, k1),
            bucket: d2(d1.encryptedBucket, k1)
        };

        client = new OSS(c1);
        // console.log("OSS Client Initialized Successfully with decrypted config", client);
    } catch (e1) {
        console.error('Failed to fetch or decrypt OSS config:', e1);
    }
}

function d2(e2, k2) {
    e2 = e2.replace(/\s/g, '');
    const e3 = CryptoJS.enc.Base64.parse(e2);
    const iv = CryptoJS.lib.WordArray.create(e3.words.slice(0, 4));
    const e4 = CryptoJS.lib.WordArray.create(e3.words.slice(4));

    const d3 = CryptoJS.AES.decrypt({ ciphertext: e4 }, k2, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return d3.toString(CryptoJS.enc.Utf8);
}

// 初始化client
f1();

document.addEventListener("DOMContentLoaded", function() {
    // const linkId = "{{ .Get "id" }}";
    // const objectKey = "{{ .Get "url" }}";  // 使用URL参数作为OSS对象的key
    // const popupId = "popup-" + linkId;
    // const requiredCoins = {{ .Get "coin" | default 0 }}; // 获取需要扣除的东币数，默认为0
    // const resourceTitle = "{{ .Get "title" }}"; // 获取资源标题

    const linkId = "aaa";
    const objectKey = "bbb";  // 使用URL参数作为OSS对象的key
    const popupId = "popup-" + linkId;
    const requiredCoins = 666; // 获取需要扣除的东币数，默认为0
    const resourceTitle = "ccc"

    const checkAndDownload = async () => {
        const loggedIn = getCookie('loggedIn');
        const email = getCookie('userEmail');

        if (!loggedIn) {
            alert("请登录后下载！");
            window.location.href = "/submission";
            return;
        }

        if (requiredCoins > 0) {
            const coinListUrl = `https://download.xn--xhq44jb2fzpc.com/user/${email}/coin/list.json`;
            try {
                const response = await fetchNoCache(coinListUrl);
                if (!response.ok) {
                    alert("您还未激活东币系统，请前往激活！");
                    window.location.href = "/submission";
                    return;
                }
                const data = await response.json();
                if (data.coins < requiredCoins) {
                    alert(`您的东币数量不够！当前资源要求东币数：${requiredCoins}；您的东币数：${data.coins}。`);
                    return;
                } else {
                    if (confirm(`当前下载操作花费：${requiredCoins}东币；您的东币：${data.coins}。是否继续？`)) {
                        data.coins -= requiredCoins;
                        data.transactions.push({
                            type: "debit",
                            amount: requiredCoins,
                            description: `下载资源：${resourceTitle}`,  // 使用资源标题
                            date: getCurrentTime()
                        });
                        const coinBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                        await client.put(`user/${email}/coin/list.json`, coinBlob);

                        // 调用下载功能并进行倒计时
                        startDownload(linkId, popupId, objectKey);
                    }
                }
            } catch (error) {
                console.error("Error handling coins for download:", error);
                alert("无法处理您的请求，请稍后重试。");
            }
        } else {
            // 如果不需要东币，直接开始下载
            startDownload(linkId, popupId, objectKey);
        }
    };

    const startDownload = (linkId, popupId, key) => {
        let countdown = 3;
        const popup = document.getElementById(popupId);
        const popupContent = popup.querySelector('.popup-content');

        if (client) {
            let actualLink = client.signatureUrl(key, {
                expires: 20,  // 过期时间为 20 秒
                response: {
                    'content-disposition': 'attachment'  // 强制下载
                }
            });

            // 替换域名部分
            const sanitizedUrl = actualLink.replace('emberimg.oss-cn-beijing.aliyuncs.com', 'download.xn--xhq44jb2fzpc.com');

            const updatePopup = () => {
                if (countdown > 0) {
                    popupContent.textContent = `${countdown}秒后将开始下载...`;
                    countdown--;
                    setTimeout(updatePopup, 1000);
                } else {
                    popup.style.display = 'none';
                    window.location.href = sanitizedUrl;
                }
            };

            popup.style.display = 'block';
            updatePopup();

        } else {
            console.error('OSS client is not initialized.');
        }
    };

    document.getElementById(linkId).addEventListener('click', checkAndDownload);
});



function getCurrentTime() {
    const now = new Date();
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 直接加8小时
    return beijingTime.toISOString().replace('T', ' ').substring(0, 19); // 格式化时间
}