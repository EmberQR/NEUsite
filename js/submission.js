let client;
let s = false;
var curemail = "";
var submitted = 0;

document.getElementById('loginForm').addEventListener('submit', async function(event) {
event.preventDefault();
const email = document.getElementById('email').value;
const password = document.getElementById('password').value;
const hashedPassword = CryptoJS.SHA256(password).toString();
const emailFilePath = 'user/email.json';
const userPasswordFilePath = `user/${email}/p.json`;

try {
    let emailResponse = await client.get(emailFilePath);
    let registeredEmails = JSON.parse(emailResponse.content).registeredEmails;

    if (registeredEmails.includes(email)) {
        let passwordResponse = await client.get(userPasswordFilePath);
        let storedUser = JSON.parse(passwordResponse.content);

        if (storedUser.h[0] === hashedPassword) {
            s = true;
            curemail = email;
            document.getElementById('message').innerText = '登录成功！正在加载中...';
            
            setTimeout(initializeUserSession, 3000);

        } else {
            document.getElementById('message').innerText = '密码错误。';
        }
    } else {
        if (confirm('此邮箱没有注册。是否注册？')) {
            registeredEmails.push(email);
            const updatedEmailJson = JSON.stringify({ registeredEmails: registeredEmails }, null, 2);
            await client.put(emailFilePath, new Blob([updatedEmailJson], { type: 'application/json' }));

            const newUserDetails = {
                h: [hashedPassword],
                nickname: "默认昵称",
                hasAvatar: false
            };
            const newUserJson = JSON.stringify(newUserDetails, null, 2);
            await client.put(userPasswordFilePath, new Blob([newUserJson], { type: 'application/json' }));

            s = true; 
            curemail = email;
            document.getElementById('message').innerText = '注册并登录成功！正在加载中...';
            
            setTimeout(initializeUserSession, 3000);

        }
    }
} catch (error) {
    console.error('Error:', error);
    document.getElementById('message').innerText = '发生错误，请稍后重试。';
}
});

function initializeUserSession() {
    document.getElementById('login').style.display = 'none';
    document.getElementById('navContainer').style.display = 'block';
    checkAndLoadAvatar();
    updateUserInfo();
    checkVerifiedStatus();
    fetchSubmittedCount(curemail);
    document.getElementById('userEmail').innerText = curemail;
}


async function f1() {
    try {
        const r1 = await fetchNoCache('https://emberimg.oss-cn-beijing.aliyuncs.com/upload/json/s.json');
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
        console.log("OSS Client Initialized Successfully with decrypted config", client);
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

const buttons = document.querySelectorAll('.navButton'); // Get all navButtons
buttons.forEach(button => {
    button.addEventListener('click', function() {
        buttons.forEach(b => b.classList.remove('selected')); // Remove 'selected' from all buttons
        this.classList.add('selected'); // Add 'selected' to the clicked button
    });
});

function showSubmission() {
    document.getElementById('submission-area').style.display = 'block';
    document.getElementById('myinfo').style.display = 'none';
    document.getElementById('mysubmission').style.display = 'none';
}

function showMyInfo() {
    document.getElementById('submission-area').style.display = 'none';
    document.getElementById('myinfo').style.display = 'block';
    document.getElementById('mysubmission').style.display = 'none';
}

function showMySubmissions() {
    document.getElementById('submission-area').style.display = 'none';
    document.getElementById('myinfo').style.display = 'none';
    fetchSubmissionData(curemail, submitted);
    document.getElementById('mysubmission').style.display = 'block';
}

async function checkVerifiedStatus() {
    const email = curemail; 
    const timestamp = new Date().getTime();
    const url = `https://emberimg.oss-cn-beijing.aliyuncs.com/upload/verified-email/verified-email.json?timestamp=${timestamp}`;

    try {
        const response = await fetch(url);
        const verifiedEmails = await response.json();
        
        if (verifiedEmails.includes(email)) {
            document.getElementById('verified-icon').style.display = 'inline-flex';
            console.log('Email is verified.');
        } else {
            console.log('Email is not verified.');
        }
    } catch (error) {
        console.error('Error loading or parsing verified-email.json:', error);
    }
}


async function updateUserInfo() {
    if (!s) {
        console.log("User is not logged in.");
        return;
    }

    const jsonPath = `https://emberimg.oss-cn-beijing.aliyuncs.com/user/${curemail}/p.json`;

    try {
        const response = await fetchNoCache(jsonPath);
        if (response.ok) {
            const data = await response.json();
            if (data && data.nickname) {
                document.getElementById('nickname').innerText = data.nickname;
                console.log("Nickname has been successfully updated.");
            } else {
                document.getElementById('nickname').innerText = "Default Nickname";
                console.log("Default nickname set due to missing 'nickname' field in response.");
            }
        } else {
            throw new Error('p.json not found');
        }
    } catch (error) {
        console.error("Error loading p.json:", error);
        document.getElementById('nickname').innerText = "Default Nickname";
    }
}

async function checkAndLoadAvatar() {
    if (!s) {
        console.log("User is not logged in.");
        return;
    }

    const jsonPath = `https://emberimg.oss-cn-beijing.aliyuncs.com/user/${curemail}/p.json`;
    const avatarPath = `https://emberimg.oss-cn-beijing.aliyuncs.com/user/${curemail}/avatar`;
    const defaultAvatarPath = "https://emberimg.oss-cn-beijing.aliyuncs.com/avatar/default.png";

    try {
        const response = await fetchNoCache(jsonPath);
        if (response.ok) {
            const data = await response.json();
            if (data.hasAvatar) {
                var newAvatarPath = avatarPath + '?t=' + Date.now(); // 添加时间戳
                document.getElementById('myinfoavatar').src = newAvatarPath;
                console.log("Custom avatar loaded.");
            } else {
                document.getElementById('myinfoavatar').src = defaultAvatarPath;
                console.log("Default avatar loaded due to `hasAvatar` being false.");
            }
        } else {
            throw new Error('p.json not found');
        }
    } catch (error) {
        document.getElementById('myinfoavatar').src = defaultAvatarPath;
        console.error("Error loading p.json. Using default avatar:", error);
    }
}

async function checkVerifiedStatus() {
    const email = curemail; 
    const url = 'https://emberimg.oss-cn-beijing.aliyuncs.com/upload/verified-email/verified-email.json';

    try {
        const response = await fetchNoCache(url);
        const verifiedEmails = await response.json();
        
        if (verifiedEmails.includes(email)) {
            document.getElementById('verified-icon').style.display = 'inline-flex';
            console.log('Email is verified.');
        } else {
            console.log('Email is not verified.');
        }
    } catch (error) {
        console.error('Error loading or parsing verified-email.json:', error);
    }
}

async function editNickname() {
    if (!s) {
        alert("您尚未登录，请登录后再尝试修改昵称。");
        return;
    }

    const newNickname = prompt("请输入新的昵称:");
    if (newNickname === null) {
        // 用户取消输入框，不做任何处理
        return;
    }
    if (newNickname.trim() === "") {
        alert("昵称不能为空！");
        return;
    }

    const jsonPath = `https://emberimg.oss-cn-beijing.aliyuncs.com/user/${curemail}/p.json`;

    try {
        const response = await fetchNoCache(jsonPath);

        if (response.ok) {
            const data = await response.json();
            data.nickname = newNickname;

            const userInfoBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            await client.put(`user/${curemail}/p.json`, userInfoBlob);
            console.log("p.json has been successfully updated with new nickname.");

            setTimeout(() => {
                document.getElementById('nickname').innerText = newNickname;
                console.log("Nickname has been updated on the page.");
            }, 1000);
        } else {
            throw new Error('Failed to fetch p.json');
        }
    } catch (error) {
        console.error("Error updating nickname:", error);
    }
}

document.getElementById('editNicknameBtn').addEventListener('click', editNickname);


async function uploadAvatar(event) {
    var file = event.target.files[0];
    if (file && file.size <= 1048576) { // Size must be less than 1MB
        if (s === true) { 
            var jsonPath = `user/${curemail}/p.json`; // Correct path for p.json
            var filePath = `user/${curemail}/avatar`; // Correct path for avatar file

            try {
                // Try to fetch existing p.json to see if it needs updating
                const response = await fetchNoCache(`https://emberimg.oss-cn-beijing.aliyuncs.com/${jsonPath}`);
                let data;
                if (response.ok) {
                    data = await response.json();
                } else {
                    // If p.json does not exist or can't be loaded, initialize with default values
                    data = {
                        h: [hashedPassword],  // Assuming hashedPassword is available here, if not, need to hash it
                        nickname: "默认昵称",
                        hasAvatar: false
                    };
                }

                // Always upload the avatar image
                await client.put(filePath, file);
                console.log("Avatar has been successfully uploaded.");

                // Update hasAvatar flag and upload updated p.json only if necessary
                if (!data.hasAvatar) {
                    data.hasAvatar = true;  // Update the flag because we are uploading an avatar now
                    const userInfoBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                    await client.put(jsonPath, userInfoBlob);
                    console.log("p.json has been successfully uploaded.");

                    setTimeout(() => {
                        document.getElementById('myinfoavatar').src = `https://emberimg.oss-cn-beijing.aliyuncs.com/${filePath}`;
                        console.log("myinfoavatar's src has been updated to the new avatar.");
                    }, 2000);
                } else {
                    // If the avatar already exists and no new src is needed, force reload the image after 2 seconds
                    setTimeout(() => {
                        document.getElementById('myinfoavatar').src += '?' + new Date().getTime(); // Add timestamp to force reload
                        console.log("Forced reload of the existing avatar.");
                    }, 2000);
                }
            } catch (error) {
                console.error('Failed to upload new avatar or update p.json:', error);
            }
        } else {
            alert("You are not logged in, please log in before attempting to upload an avatar.");
        }
    } else {
        alert("头像必须小于 1MB！");
    }
}

document.querySelector('.overlay').addEventListener('click', function() {
    document.getElementById('fileInput').click(); // Trigger file input
});

const input = document.getElementById('input');
const preview = document.getElementById('preview');

input.addEventListener('input', () => {
    const markdownText = input.value;
    preview.innerHTML = marked.parse(markdownText);
});

// Initialize with empty content
preview.innerHTML = marked.parse('');

async function fetchSubmittedCount(email) {
    const url = `https://emberimg.oss-cn-beijing.aliyuncs.com/upload/${email}/submitted.json`;

    try {
        const response = await fetchNoCache(url);
        if (response.ok) {
            const count = await response.json();
            submitted = count;
            console.log("Submitted count updated:", submitted);
        } else {
            throw new Error('File not found or access error');
        }
    } catch (error) {
        submitted = 0;
        console.log("Error fetching submitted count:", error);
    }
}


async function fetchSubmissionData(email, submitted) {
    let markdownTable = `
## 投稿记录

| 标题 | 板块 | 审核状态 | 审核备注 |
|------|------|------|------|`;

    for (let i = 1; i <= submitted; i++) {
        const statusUrl = `https://emberimg.oss-cn-beijing.aliyuncs.com/upload/${email}/${i}/status.json`;

        try {
            const response = await fetchNoCache(statusUrl);
            if (response.ok) {
                const data = await response.json();
                const { title, section, status, note, link } = data;
                
                // 设置标题列的内容，如果状态为“已通过”，则设置为超链接
                let titleContent = title || '无标题';
                if (status === '已通过' && link) {
                    titleContent = `<a href="${link}" target="_blank">${titleContent}</a>`;
                }

                markdownTable += `
| ${titleContent} | ${section || '无板块'} | ${status || '无状态'} | ${note || ''} |`;
            } else {
                console.error(`无法获取 ${statusUrl}: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error(`请求 ${statusUrl} 时发生错误:`, error);
        }
    }

    if (submitted === 0) {
        markdownTable += `
| 没有投稿记录 |  |  |  |`;
    }

    document.getElementById('mysubmission').innerHTML = marked.parse(markdownTable);
}





function validateFiles(event) {
    const maxFiles = 10;
    const maxFileSize = 2 * 1024 * 1024; // 2MB in bytes
    const maxCompressedFileSize = 20 * 1024 * 1024; // 20MB in bytes
    const files = event.target.files;
    
    if (files.length > maxFiles) {
        alert(`您只能选择最多 ${maxFiles} 个文件。`);
        event.target.value = ''; // 清除已选文件
        return;
    }

    let hasCompressedFile = false;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        const fileSize = file.size;
        const fileExtension = fileName.split('.').pop().toLowerCase();

        if (fileExtension === 'zip' || fileExtension === 'rar') {
            if (hasCompressedFile) {
                alert(`您只能上传一个压缩文件。`);
                event.target.value = ''; // 清除已选文件
                return;
            }
            hasCompressedFile = true;
            if (fileSize > maxCompressedFileSize) {
                alert(`压缩文件 "${fileName}" 超过了大小限制（20MB）。`);
                event.target.value = ''; // 清除已选文件
                return;
            }
        } else {
            if (fileSize > maxFileSize) {
                alert(`文件 "${fileName}" 超过了大小限制（2MB）。`);
                event.target.value = ''; // 清除已选文件
                return;
            }
        }
    }

    if (hasCompressedFile && files.length > 1) {
        alert('上传压缩文件时，只能上传一个文件。');
        event.target.value = ''; // 清除已选文件
        return;
    }
}

// 显示时间
function getBeijingTime() {
    const now = new Date();
    const utcOffset = now.getTimezoneOffset() * 60000;
    const beijingOffset = 8 * 60 * 60 * 1000;
    const beijingTime = new Date(now.getTime() + utcOffset + beijingOffset);
    return beijingTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}

function displayBeijingTime() {
    const beijingTimeElement = document.getElementById('beijing-time');
    beijingTimeElement.textContent = getBeijingTime();
}

window.onload = function() {
    displayBeijingTime();
}

// // 获取当前北京时间并转化为纯数字格式
// function getNumericBeijingTime() {
//     const beijingTimeElement = document.getElementById('beijing-time').textContent.trim();
//     const [date, time] = beijingTimeElement.split(' ');
//     const [year, month, day] = date.split('/');
//     const [hours, minutes] = time.split(':');
//     return `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}${hours.padStart(2, '0')}${minutes.padStart(2, '0')}`;
// }

async function uploadImage(event) {
    const file = event.target.files[0];
    const email = document.querySelector("input[name='email']").value.trim();

    if (!s) {
        alert("您还没有登录，请登录后再上传图片！");
        return;
    }

    if (!file) {
        alert("请先选择图片文件！");
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert("图片文件大小不能超过2MB！");
        event.target.value = '';
        return;
    }

    const postId = submitted + 1;
    const filePath = `upload/${email}/${postId}/postimg/${file.name}`;

    try {
        const result = await client.put(filePath, file);
        const imageUrl = `https://emberimg.oss-cn-beijing.aliyuncs.com/${filePath}`;
        const imageTag = `<img src="${imageUrl}" alt="自定义图片文字" width="150">`;

        // 展示图片URL和HTML标签
        document.getElementById("imageUrl").innerText = imageTag;
        // document.getElementById("imageUrl").href = imageUrl;
        document.getElementById("imagePreview").src = imageUrl;
        document.getElementById("imagePreview").style.display = "block";
        document.getElementById("copyButton").style.display = "inline-block";

    } catch (error) {
        console.error("图片上传失败:", error);
        alert("图片上传失败！");
        event.target.value = '';
    }
}


// 复制HTML标签到剪贴板
function copyImageUrl() {
    const imageTag = document.getElementById("imageUrl").innerText;
    // 创建一个临时文本区域元素
    const textArea = document.createElement("textarea");
    textArea.value = imageTag;
    document.body.appendChild(textArea);
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        const msg = successful ? '标签已复制到剪贴板！请直接粘贴到 markdown 编辑区中，并根据预览效果调整大小。' : '复制失败！';
        alert(msg);
    } catch (err) {
        alert("复制失败！", err);
    }

    document.body.removeChild(textArea);
}



document.getElementById('SubmitButton').onclick = function() {

const section = document.getElementById('section').value;
const wp = document.querySelector("input[name='wp']").value.trim();
const wppassword = document.querySelector("input[name='wppassword']").value.trim();
const note = document.querySelector("input[name='note']").value.trim();
const markdownContent = document.getElementById('input').value.trim();

if (!confirm('请仔细检查后提交，多次提交无关内容将被禁止访问网站！')) {
    return; // 用户点击取消，终止提交
}

uploadData();

async function uploadData() {
    if (!s) {
        alert("您还未登录，请登录后再进行投稿。");
        return;
    }

    const email = curemail;
    const title = document.querySelector("input[name='title']").value.trim();

    if (!title) {
        alert("请填写内容的标题。");
        return;
    }

    const postId = submitted + 1;

    try {
        // 获取用户昵称
        const response = await fetch(`https://emberimg.oss-cn-beijing.aliyuncs.com/user/${email}/p.json`);
        if (!response.ok) {
            throw new Error('无法加载用户数据');
        }
        const userData = await response.json();
        const nickname = userData.nickname || "未知昵称"; 

        const note = "";
        const link = "";

        const userInfoText = `时间：${getBeijingTime()}\n内容标题：${title}\n邮箱：${email}\n板块：${section}\n昵称：${nickname}\n备注：${note}\n网盘外链：${wp}\n网盘提取密码：${wppassword}\n资源展示页：\n${markdownContent}`;
        const userTextFilePath = `upload/${email}/${postId}/userinfo.txt`;
        const statusFilePath = `upload/${email}/${postId}/status.json`;
        const statusData = { title: title, status: "审核中", section: section, note: note, link: link };

        await client.put(userTextFilePath, new Blob([userInfoText], { type: 'text/plain' }));

        await client.put(statusFilePath, new Blob([JSON.stringify(statusData)], { type: 'application/json' }));

        const files = document.getElementById('filePicker').files;
        for (let i = 0; i < files.length; i++) {
            await client.put(`upload/${email}/${postId}/files/${files[i].name}`, files[i]);
        }

        submitted += 1;
        await client.put(`upload/${email}/submitted.json`, new Blob([JSON.stringify(submitted)], { type: 'application/json' }));

        window.location.href = '/submissionsuccess/';
    } catch (error) {
        console.error("上传失败:", error);
        alert("投稿失败，请重试！");
    }
}



};

document.getElementById('SaveDraft').addEventListener('click', async () => {
    if (!s) {
        alert("非法操作！请先登录。");
        return;
    }

    if (confirm("确认保存草稿吗？如您之前有草稿内容，此操作会覆盖前一次的草稿内容。")) {
        const draftContent = document.getElementById('input').value;
        const currentPostId = submitted + 1;
        const filePath = `upload/${curemail}/${currentPostId}/draft.json`;

        const draftData = new Blob([JSON.stringify({ content: draftContent }, null, 2)], { type: 'application/json' });

        try {
            await client.put(filePath, draftData);
            alert("草稿已保存！");
        } catch (error) {
            console.error("保存草稿时出错:", error);
            alert("保存草稿失败，请稍后再试。");
        }
    }
});

document.getElementById('LoadDraft').addEventListener('click', async () => {
    if (!s) {
        alert("非法操作！请先登录。");
        return;
    }

    const currentPostId = submitted + 1;
    const draftURL = `https://emberimg.oss-cn-beijing.aliyuncs.com/upload/${curemail}/${currentPostId}/draft.json`;

    try {
        const response = await fetch(draftURL);
        if (!response.ok) {
            if (response.status === 404) {
                alert("没有草稿记录！");
            } else {
                throw new Error("无法加载草稿内容");
            }
        } else {
            const draftData = await response.json();
            if (confirm("此操作会覆盖您当前的输入内容，确认加载草稿吗？")) {
                document.getElementById('input').value = draftData.content;
                preview.innerHTML = marked.parse(draftData.content);
                alert("草稿已加载！");
            }
        }
    } catch (error) {
        console.error("加载草稿时出错:", error);
        alert("加载草稿失败，请稍后再试。");
    }
});
