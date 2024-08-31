// 封装的加载金币系统函数
function loadCoinSystem() {
    // 获取当前时间并转换为北京时间
    function getCurrentTime() {
        const now = new Date();
        const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 直接加8小时
        return beijingTime.toISOString().replace('T', ' ').substring(0, 19); // 格式化时间
    }

    // 初始化金币系统
    async function initializeCoinSystem() {
        try {
            // 检查 verify.json 文件是否存在且为 true
            const verifyUrl = `https://download.xn--xhq44jb2fzpc.com/user/${curemail}/coin/verify.json`;
            const response = await fetchNoCache(verifyUrl);
            const verifyResponse = await response.json(); // 正确地处理响应体中的 JSON 数据
    
            console.log("Verify Response: ", verifyResponse);
    
            if (verifyResponse === true) {
                // 读取 list.json 文件
                const listUrl = `https://download.xn--xhq44jb2fzpc.com/user/${curemail}/coin/list.json`;
                const coinDataResponse = await fetchNoCache(listUrl);
                const coinData = await coinDataResponse.json(); // 处理 coinData JSON 数据
                renderCoinContent(coinData);
            } else {
                throw new Error('Verification required');
            }
        } catch (error) {
            console.error("Error in initializeCoinSystem: ", error);
            renderVerificationPrompt();
        }
    }
    
    
    

    // 渲染金币内容
    function renderCoinContent(coinData) {
        const coinContent = document.getElementById('coin-content');
        coinContent.innerHTML = `<p>当前金币数：${coinData.coins}</p>`;

        const table = document.createElement('table');
        const headerRow = table.insertRow();
        headerRow.innerHTML = `<th>时间</th><th>明细</th><th>操作</th>`;

        coinData.transactions.forEach(transaction => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td>${transaction.type === 'credit' ? '+' : '-'}${transaction.amount}</td>
                <td>${transaction.description}</td>
            `;
        });

        coinContent.appendChild(table);
    }

    // 渲染验证提示
    function renderVerificationPrompt() {
        const coinContent = document.getElementById('coin-content');
        coinContent.innerHTML = `
            <p>您需要进行手机验证以解锁金币系统。下载某些资源时会花费金币，而投稿审核通过后可以获得金币。</p>
            <p><strong>请注意：</strong>由于下载同一份文件两次，从服务器流出的下行流量也会计算两次，因此当您多次下载同一个需要金币的资源时，金币也会多次扣除。<strong>我们建议您减少不必要的重复下载。</strong></p>
            <button id="first-verify-btn">验证</button>
        `;

        // 按钮样式定义
        const firstVerifyBtn = document.getElementById('first-verify-btn');
        firstVerifyBtn.style.display = 'block';
        firstVerifyBtn.style.margin = '0 auto';
        firstVerifyBtn.style.padding = '10px 20px';
        firstVerifyBtn.style.backgroundColor = '#007BFF';
        firstVerifyBtn.style.color = '#fff';
        firstVerifyBtn.style.border = 'none';
        firstVerifyBtn.style.borderRadius = '4px';
        firstVerifyBtn.style.cursor = 'pointer';
        firstVerifyBtn.style.textAlign = 'center';

        firstVerifyBtn.onmouseover = function () {
            firstVerifyBtn.style.backgroundColor = '#0056b3';
        };

        firstVerifyBtn.onmouseout = function () {
            firstVerifyBtn.style.backgroundColor = '#007BFF';
        };

        firstVerifyBtn.onmousedown = function () {
            firstVerifyBtn.style.backgroundColor = '#003f7f';
        };

        // 夜间模式样式
        if (document.body.classList.contains('dark')) {
            firstVerifyBtn.style.backgroundColor = '#444';
            firstVerifyBtn.style.color = '#fff';
        }

        // 点击验证按钮，弹出模态框
        firstVerifyBtn.addEventListener('click', showVerificationModal);
    }

    // 显示验证模态框
    function showVerificationModal() {
        const modal = document.getElementById('verification-modal');
        modal.style.display = 'block';

        const sendCodeBtn = document.getElementById('send-code-btn');
        const verifyBtn = document.getElementById('verify-btn');
        const phoneNumberInput = document.getElementById('phone-number');
        const verificationCodeInput = document.getElementById('verification-code');
        const modalMessage = document.getElementById('modal-message');

        sendCodeBtn.addEventListener('click', async () => {
            const phoneNumber = phoneNumberInput.value.trim();
            if (!/^\d{11}$/.test(phoneNumber) || phoneNumber.charAt(0) !== '1') {
                modalMessage.innerText = '请输入有效的11位手机号码！';
                return;
            }
        
            try {
                // 检查手机号是否已验证
                const phoneHash = CryptoJS.SHA256(phoneNumber).toString();
                const phonesResponse = await fetchNoCache('https://download.xn--xhq44jb2fzpc.com/user/pn.json');
                const phonesData = await phonesResponse.json();
                
                if (phonesData.includes(phoneHash)) {
                    modalMessage.innerText = '此手机号已被验证过！';
                    sendCodeBtn.disabled = false; 
                    sendCodeBtn.textContent = '发送验证码';
                    return;
                }
        
                // 禁用发送按钮并修改按钮文本
                sendCodeBtn.disabled = true;
                sendCodeBtn.textContent = '禁用中...';
                setTimeout(() => {
                    sendCodeBtn.disabled = false;
                    sendCodeBtn.textContent = '发送验证码';
                }, 120000); // 2分钟后重新启用发送按钮并恢复原始文本
        
                const response = await fetch('https://sms.xn--xhq44jb2fzpc.com/send-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber })
                });
                const result = await response.json();
                if (response.ok) {
                    modalMessage.innerText = '验证码已发送，请查收。2分钟后可重新发送。';
                    sessionStorage.setItem('phoneNumber', phoneNumber); // 保存手机号
                } else {
                    modalMessage.innerText = `发送失败！请稍后再试。`;
                    sendCodeBtn.disabled = false; // 如果发送失败，立即恢复按钮可用状态
                    sendCodeBtn.textContent = '发送验证码'; // 恢复原始按钮文本
                }
            } catch (error) {
                modalMessage.innerText = '发送验证码时出错，请稍后重试。';
                sendCodeBtn.disabled = false; // 如果发送失败，立即恢复按钮可用状态
                sendCodeBtn.textContent = '发送验证码'; // 恢复原始按钮文本
            }
        });
        

        // 验证验证码事件
        verifyBtn.addEventListener('click', async () => {
            const phoneNumber = sessionStorage.getItem('phoneNumber'); // 从 sessionStorage 中获取手机号
            const verificationCode = verificationCodeInput.value.trim();
        
            // 每次开始验证前清空消息文本
            modalMessage.innerText = '';
        
            if (!verificationCode || !phoneNumber) {
                modalMessage.innerText = '请输入手机号和验证码。';
                return;
            }
        
            try {
                const response = await fetch('https://sms.xn--xhq44jb2fzpc.com/verify-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber, verificationCode })
                });
                const result = await response.json();
                if (response.ok && result.verified) {
                    modalMessage.innerText = '验证通过，请稍后……';
        
                    const phoneHash = CryptoJS.SHA256(phoneNumber).toString();
                    const phonesResponse = await fetchNoCache('https://download.xn--xhq44jb2fzpc.com/user/pn.json');
                    const phonesData = await phonesResponse.json();
                    phonesData.push(phoneHash);
        
                    await client.put('user/pn.json', new Blob([JSON.stringify(phonesData)], { type: 'application/json' }));
        
                    setTimeout(async () => {
                        modal.style.display = 'none';
                        
                        // 初始化金币系统
                        const initialData = {
                            userEmail: curemail,
                            coins: 20,
                            transactions: [
                                {
                                    type: 'credit',
                                    amount: 20,
                                    description: '初始金币奖励',
                                    date: getCurrentTime()
                                }
                            ]
                        };
                        const userInfoBlob = new Blob([JSON.stringify(true)], { type: 'application/json' });
                        await client.put(`user/${curemail}/coin/verify.json`, userInfoBlob);
        
                        const coinBlob = new Blob([JSON.stringify(initialData)], { type: 'application/json' });
                        await client.put(`user/${curemail}/coin/list.json`, coinBlob);
        
                        // 重新读取并渲染金币信息
                        renderCoinContent(initialData);
                    }, 2000);
                } else {
                    modalMessage.innerText = '验证码错误，请重新输入。';
                }
            } catch (error) {
                modalMessage.innerText = '验证时出错，请稍后重试。';
            }
        });
        
        
    }

    

    document.getElementById('cancel-btn').addEventListener('click', function() {
        // 获取模态框元素
        const modal = document.getElementById('verification-modal');
        
        // 隐藏模态框
        modal.style.display = 'none';
    });

    // 初始化系统
    initializeCoinSystem();
}

