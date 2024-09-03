// 封装的加载东币系统函数
function loadCoinSystem() {
    // 获取当前时间并转换为北京时间
    function getCurrentTime() {
        const now = new Date();
        const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 直接加8小时
        return beijingTime.toISOString().replace('T', ' ').substring(0, 19); // 格式化时间
    }

    // 初始化东币系统
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
    
    
    
// 渲染东币内容并分页显示
function renderCoinContent(coinData) {
    const coinContent = document.getElementById('coin-content');
    const itemsPerPage = 10; // 每页显示的记录数
    let currentPage = 1; // 当前页码

    // 初始化内容
    coinContent.innerHTML = `
    <p><strong>当前东币数：${coinData.coins}</strong></p>
    <p>下载某些资源时会花费东币，而投稿审核通过后可以获得东币。</p>
    <p><strong>请注意：</strong>由于下载同一份文件两次，从服务器流出的下行流量也会计算两次，因此当您多次下载同一个需要东币的资源时，东币也会多次扣除。<strong>我们建议您减少不必要的重复下载。</strong></p>
    <p><strong>每页显示10条东币记录，最近的记录将显示在最后。</strong></p>
    `;

    // 渲染表格数据
    function renderTable(page) {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const transactions = coinData.transactions.slice(start, end);

        let table = coinContent.querySelector('table');
        
        // 如果表格不存在，创建一个新的表格
        if (!table) {
            table = document.createElement('table');
            const headerRow = table.insertRow();
            headerRow.innerHTML = `<th>时间</th><th>明细</th><th>操作</th>`;
            coinContent.appendChild(table);
        } else {
            // 如果表格存在，清空之前的内容（除标题外）
            table.innerHTML = table.rows[0].innerHTML; // 保留标题行
        }

        transactions.forEach(transaction => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td>${transaction.type === 'credit' ? '+' : '-'}${transaction.amount}</td>
                <td>${transaction.description}</td>
            `;
        });
    }

    // 渲染页码
    function renderPagination() {
        const totalPages = Math.ceil(coinData.transactions.length / itemsPerPage);
        const pagination = document.createElement('div');
        pagination.className = 'pagination';

        // 页码前添加“页码：”
        const pageLabel = document.createElement('span');
        // pageLabel.textContent = '每页显示10条记录。';
        // pageLabel.style.marginRight = '10px';
        pagination.appendChild(pageLabel);

        for (let i = 1; i <= totalPages; i++) {
            const pageLink = document.createElement('button');
            pageLink.textContent = i;
            pageLink.className = 'page-link';
            pageLink.style.margin = '0 5px';
            pageLink.style.fontWeight = (i === currentPage) ? 'bold' : 'normal'; // 当前页码加粗
            pageLink.disabled = (i === currentPage);
            pageLink.addEventListener('click', () => {
                currentPage = i;
                renderTable(currentPage);
                renderPagination();
            });
            pagination.appendChild(pageLink);
        }

        // 清空并添加新的分页控件
        const existingPagination = coinContent.querySelector('.pagination');
        if (existingPagination) {
            coinContent.removeChild(existingPagination);
        }
        coinContent.appendChild(pagination);
    }

    // 初始渲染
    renderTable(currentPage);
    renderPagination();
}




// 渲染验证提示
function renderVerificationPrompt() {
    const coinContent = document.getElementById('coin-content');
    coinContent.innerHTML = `
        <p>您需要进行手机验证以解锁东币系统。下载某些资源时会花费东币，而投稿审核通过后可以获得东币。</p>
        <p><strong>请注意：</strong>由于下载同一份文件两次，从服务器流出的下行流量也会计算两次，因此当您多次下载同一个需要东币的资源时，东币也会多次扣除。<strong>我们建议您减少不必要的重复下载。</strong></p>
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

    // 判断是否为夜间模式
    const isDarkMode = document.body.classList.contains('dark');
    if (isDarkMode) {
        firstVerifyBtn.style.backgroundColor = '#444';
        firstVerifyBtn.style.color = '#fff';
    }

    firstVerifyBtn.onmouseover = function () {
        if (isDarkMode) {
            firstVerifyBtn.style.backgroundColor = '#555';
        } else {
            firstVerifyBtn.style.backgroundColor = '#0056b3';
        }
    };

    firstVerifyBtn.onmouseout = function () {
        if (isDarkMode) {
            firstVerifyBtn.style.backgroundColor = '#444';
        } else {
            firstVerifyBtn.style.backgroundColor = '#007BFF';
        }
    };

    firstVerifyBtn.onmousedown = function () {
        if (isDarkMode) {
            firstVerifyBtn.style.backgroundColor = '#333';
        } else {
            firstVerifyBtn.style.backgroundColor = '#003f7f';
        }
    };

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

        // 发送验证码事件
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
                    modalMessage.innerText = '验证码已发送。若未收到，2分钟后可重新发送。';
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

                // 检查响应状态和验证结果
                if (response.ok && result.verified) {
                    modalMessage.innerText = '验证通过，请稍后……';

                    // 确保在正确验证后，不再处理错误消息
                    verifyBtn.disabled = true;  // 禁用按钮，防止多次点击
                    verificationCodeInput.disabled = true;  // 禁用输入框，防止再次输入

                    const phoneHash = CryptoJS.SHA256(phoneNumber).toString();
                    const phonesResponse = await fetchNoCache('https://download.xn--xhq44jb2fzpc.com/user/pn.json');
                    const phonesData = await phonesResponse.json();
                    phonesData.push(phoneHash);

                    // 写入加密后的手机号到 pn.json
                    await client.put('user/pn.json', new Blob([JSON.stringify(phonesData)], { type: 'application/json' }));

                    // 写入未加密的手机号到用户特定的 pn.json
                    await client.put(`user/${curemail}/pn.json`, new Blob([JSON.stringify({ phoneNumber })], { type: 'application/json' }));

                    setTimeout(async () => {
                        modal.style.display = 'none';
                        
                        // 初始化金币系统
                        const initialData = {
                            userEmail: curemail,
                            coins: 50,
                            transactions: [
                                {
                                    type: 'credit',
                                    amount: 50,
                                    description: '初始东币奖励',
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

