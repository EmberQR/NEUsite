let client;

async function f1() {
    try {
        const r1 = await fetch('https://download.xn--xhq44jb2fzpc.com/upload/json/s.json');
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
    f1().then(() => {
        if (client) {
        } else {
            console.error('Failed to initialize OSS client due to decryption error.');
        }
    }).catch(e2 => {
        console.log('Error initializing OSS Client:', e2);
    });
});

// 获取Cookie的函数
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// 获取登录状态和用户邮箱
const loggedIn = getCookie('loggedIn');
const email = getCookie('userEmail');

// 检查用户是否已登录
if (!loggedIn || !email) {
    alert("您未登录，请先登录后操作！");
    window.location.href = "/submission";
} else {
    // 检查用户是否已经完成验证
    const checkVerificationStatus = async () => {
        try {
            const response = await fetch(`https://download.xn--xhq44jb2fzpc.com/user/${email}/qv.json`);
            if (response.ok) {
                const data = await response.json();
                if (data === true) {
                    alert("您已经完成验证，无需再次验证！");
                    window.location.href = "/submission";
                }
            }
        } catch (error) {
            console.log("没有找到验证文件，继续验证流程。");
        }
    };

    checkVerificationStatus();

    // 验证按钮点击事件
            document.getElementById('verifybtn').addEventListener('click', async () => {
                try {
                    // 调用IP验证API
                    const ipResponse = await fetch('https://ipquery.xn--xhq44jb2fzpc.com/api/check-ip');
                    const ipResult = await ipResponse.json();

                    if (ipResult.data.isInNeU) {
                        // NEU校园网内，进行验证通过操作
                        const verificationData = true;
                        const userInfoBlob = new Blob([JSON.stringify(verificationData)], { type: 'application/json' });
                        try {
                            await client.put(`user/${email}/qv.json`, userInfoBlob);
                            setVerifiedCookie(email);
                            alert("您已完成验证！");
                            window.location.href = "/submission";
                        } catch (err) {
                            console.error('OSS写入失败:', err);
                            alert("验证失败，请稍后重试。");
                        }
                    } else {
                        alert("您未连接NEU校园网，请连接后重试！");
                    }
                } catch (error) {
                    console.error('IP验证失败:', error);
                    alert("验证失败，请稍后重试。");
                }
            });
}

function setVerifiedCookie(email) {
    const domain = window.location.hostname.includes('localhost') ? 'localhost' : `.${window.location.hostname.split('.').slice(-2).join('.')}`;
    const expires = new Date(Date.now() + 20 * 60 * 1000).toUTCString();  // 20分钟
    document.cookie = `loggedIn=true; domain=${domain}; path=/; expires=${expires}; SameSite=Lax`;
    document.cookie = `userEmail=${email}; domain=${domain}; path=/; expires=${expires}; SameSite=Lax`;
    document.cookie = `verified=true; domain=${domain}; path=/; expires=${expires}; SameSite=Lax`;
}