async function fetchNoCache(url) {
    const timestamp = new Date().getTime(); 
    const noCacheUrl = `${url}?timestamp=${timestamp}`; 
    return fetch(noCacheUrl); 
}

async function updateAuthorInfo(email) {
  if (!email) {
      console.log("Email not provided, skipping author info update.");
      return;
  }

  const jsonPath = `https://download.xn--xhq44jb2fzpc.com/user/${email}/p.json`;

  try {
      const response = await fetchNoCache(jsonPath);
      if (response.ok) {
          const data = await response.json();
          if (data && data.nickname) {
              document.getElementById('post-author').innerText = data.nickname;
              console.log("Author name has been successfully updated.");
          } else {
              document.getElementById('post-author').innerText = "默认昵称";
              console.log("Default author name set due to missing 'nickname' field in response.");
          }
      } else if (response.status === 404) {
          document.getElementById('post-author').innerText = "默认昵称";
      } else {
          throw new Error('Failed to fetch p.json');
      }
  } catch (error) {
      console.error("Error loading author info:", error);
      document.getElementById('post-author').innerText = "默认昵称";
  }
}

// 设置提示框文本并显示
function showTooltip(targetIcon, title, content) {
    const tooltip = document.getElementById('tooltip');
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipContent = document.getElementById('tooltip-content');

    tooltipTitle.textContent = title;
    tooltipContent.textContent = content;

    tooltip.classList.add('show');
}

// 隐藏提示框
function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.classList.remove('show');
}

// 处理点击外部隐藏提示框
document.body.addEventListener('click', (event) => {
    const tooltip = document.getElementById('tooltip');
    const verifiedIcon = document.getElementById('verified-icon');
    const invitedIcon = document.getElementById('invited-icon');

    if (!verifiedIcon.contains(event.target) && !invitedIcon.contains(event.target) && !tooltip.contains(event.target)) {
        hideTooltip();
    }
});

async function checkVerifiedStatus(email) {
    if (!email) {
        console.log("Email not provided, skipping verified status check.");
        return;
    }

    const url = 'https://download.xn--xhq44jb2fzpc.com/upload/verified-email/verified-email.json';
    const verifiedIcon = document.getElementById('verified-icon');
    const tooltipTitle = "认证作者"; // Title for the tooltip

    try {
        const response = await fetchNoCache(url);
        if (response.ok) {
            const verifiedEmails = await response.json();
            if (verifiedEmails.includes(email)) {
                verifiedIcon.style.display = 'inline-flex';
                console.log('Email is verified.');

                // Set up event listeners
                verifiedIcon.addEventListener('mouseenter', () => fetchVerificationDetails(email, verifiedIcon));
                verifiedIcon.addEventListener('mouseleave', hideTooltip);
                verifiedIcon.addEventListener('click', () => fetchVerificationDetails(email, verifiedIcon));
            } else {
                console.log('Email is not verified.');
            }
        } else {
            throw new Error('Failed to fetch verified-email.json');
        }
    } catch (error) {
        console.error('Error loading or parsing verified-email.json:', error);
    }
}

async function fetchVerificationDetails(email, icon) {
    const detailsUrl = `https://download.xn--xhq44jb2fzpc.com/user/${email}/verified.json`;

    try {
        const response = await fetchNoCache(detailsUrl);
        if (response.ok) {
            const data = await response.json();
            showTooltip(icon, "认证作者", data.description); // Use description from verified.json
        } else if (response.status === 404) {
            // If the verified.json file is not found, show a default message
            showTooltip(icon, "认证作者", "本作者为经过网站认证的优质内容分享者。");
        }
    } catch (error) {
        console.error('Error fetching verification details:', error);
        showTooltip(icon, "认证作者", "本作者为经过网站认证的优质内容分享者。"); // Default message on error
    }
}

async function checkInvitedStatus(email) {
    if (!email) {
        console.log("Email not provided, skipping invited author status check.");
        return;
    }

    const invitedEmailUrl = 'https://download.xn--xhq44jb2fzpc.com/upload/invited-email/invited-email.json';
    const invitedIcon = document.getElementById('invited-icon');

    try {
        const response = await fetchNoCache(invitedEmailUrl);
        if (response.ok) {
            const invitedEmails = await response.json();
            if (invitedEmails.includes(email)) {
                invitedIcon.style.display = 'inline-flex';
                console.log('Email is an invited author.');

                invitedIcon.addEventListener('mouseenter', () => fetchInvitedInfo(email, invitedIcon));
                invitedIcon.addEventListener('mouseleave', hideTooltip);
                invitedIcon.addEventListener('click', () => fetchInvitedInfo(email, invitedIcon));
            } else {
                console.log('Email is not an invited author.');
            }
        } else {
            throw new Error('Failed to fetch invited-email.json');
        }
    } catch (error) {
        console.error('Error loading or parsing invited-email.json:', error);
    }
}

async function fetchInvitedInfo(email, icon) {
    const infoUrl = `https://download.xn--xhq44jb2fzpc.com/user/${email}/invited.json`;
    try {
        const response = await fetchNoCache(infoUrl);
        if (response.ok) {
            const data = await response.json();
            showTooltip(icon, "特邀作者", data.description || '无详细信息');
        } else {
            showTooltip(icon, "特邀作者", '无法获取信息');
        }
    } catch (error) {
        console.error('Error fetching invited info:', error);
        showTooltip(icon, "特邀作者", '无法加载信息');
    }
}



async function updateAvatar(email) {
if (!email) {
    console.log("Email not provided, skipping avatar update.");
    return;
}

const avatarUrl = `https://download.xn--xhq44jb2fzpc.com/user/${email}/avatar`;
const defaultAvatarUrl = "https://download.xn--xhq44jb2fzpc.com/avatar/default.png?x-oss-process=style/avatar_comp";

try {
    const response = await fetchNoCache(avatarUrl);
    const timestamp = new Date().getTime();
    if (response.ok) {
        // 保证头像实时更新
        document.getElementById('avatar').src = `${avatarUrl}?timestamp=${timestamp}?x-oss-process=style/avatar_comp`;
        document.getElementById('avatar').style.display = "block";
        console.log("Avatar updated.");
    } else if (response.status === 404) {
        document.getElementById('avatar').src = defaultAvatarUrl;
        document.getElementById('avatar').style.display = "block";
        console.log("Avatar file not found, using default avatar.");
    } else {
        throw new Error('Failed to fetch avatar');
    }
} catch (error) {
    document.getElementById('avatar').src = defaultAvatarUrl;
    document.getElementById('avatar').style.display = "block";
    console.error("Error loading avatar:", error);
}

}