let client;

async function fetchNoCache(url) {
    const timestamp = new Date().getTime(); 
    const noCacheUrl = `${url}?timestamp=${timestamp}`; 
    return fetch(noCacheUrl); 
}

async function f1() {
    try {
        const r1 = await fetchNoCache('https://download.xn--xhq44jb2fzpc.com/download/json/s.json');
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

document.addEventListener('DOMContentLoaded', function() {
    const initializeDownloadLink = (linkId, popupId, key) => {
        const downloadLink = document.getElementById(linkId);
        const popup = document.getElementById(popupId);
        const popupContent = popup.querySelector('.popup-content');

        downloadLink.addEventListener('click', function() {
            let countdown = 3;

            f1().then(() => {
                if (client) {
                    // 在这里生成签名URL
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
                    console.error('Failed to initialize OSS client due to decryption error.');
                }
            }).catch(e2 => {
                console.log('Error initializing OSS Client:', e2);
            });
        });
    };

    window.initializeDownloadLink = initializeDownloadLink;
});


