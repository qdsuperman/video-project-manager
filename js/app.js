// 全局变量
let videoData = [];
let charts = {};
let hasUnsavedChanges = false;
let currentFilter = 'all'; // 当前筛选状态：'all', 'not-started', 'in-progress', 'published'

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadData();
});

// 切换标签页
function switchTab(tabName) {
    // 隐藏所有标签页内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // 移除所有标签的active类
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // 显示选中的标签页内容
    document.getElementById(tabName).classList.add('active');

    // 添加active类到选中的标签
    event.target.classList.add('active');

    // 根据标签页加载相应内容
    if (tabName === 'charts') {
        updateCharts();
    } else if (tabName === 'table') {
        updateTable();
    }

    // 更新快速导航按钮显示状态
    updateQuickNavVisibility();
}

// 加载数据
async function loadData() {
    try {
        videoData = await window.dataManager.loadData();
        updateCharts();
        updateTable();
        updateStatusStats();
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// 更新图表
function updateCharts() {
    updateDataStats();
    createProgressChart();
    createMetricsChart();
}

// 更新数据统计
function updateDataStats() {
    const totalViews = videoData.reduce((sum, item) => sum + (parseInt(item.浏览量) || 0), 0);
    const totalLikes = videoData.reduce((sum, item) => sum + (parseInt(item.点赞量) || 0), 0);
    const totalComments = videoData.reduce((sum, item) => sum + (parseInt(item.评论量) || 0), 0);
    const totalShares = videoData.reduce((sum, item) => sum + (parseInt(item.转发量) || 0), 0);

    document.getElementById('totalViews').textContent = totalViews.toLocaleString();
    document.getElementById('totalLikes').textContent = totalLikes.toLocaleString();
    document.getElementById('totalComments').textContent = totalComments.toLocaleString();
    document.getElementById('totalShares').textContent = totalShares.toLocaleString();
}

// 创建进度统计图表
function createProgressChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    if (charts.progressChart) {
        charts.progressChart.destroy();
    }

    const progressFields = ['剧本完成进度', '来访拍摄进度', '剪辑进度', '审核进度', '发布进度'];
    const completedCounts = progressFields.map(field => 
        videoData.filter(item => item[field] === '完成').length
    );
    const notCompletedCounts = progressFields.map(field => 
        videoData.filter(item => item[field] === '未完成').length
    );

    charts.progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: progressFields,
            datasets: [{
                label: '完成',
                data: completedCounts,
                backgroundColor: '#28a745',
                borderColor: '#28a745',
                borderWidth: 1
            }, {
                label: '未完成',
                data: notCompletedCounts,
                backgroundColor: '#dc3545',
                borderColor: '#dc3545',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 16
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// 创建数据指标图表（时间趋势）
function createMetricsChart() {
    const ctx = document.getElementById('metricsChart').getContext('2d');

    if (charts.metricsChart) {
        charts.metricsChart.destroy();
    }

    // 获取已发布的视频，按发布时间排序
    const publishedVideos = videoData.filter(item =>
        item.发布进度 === '完成' && item.发布时间 && parseInt(item.浏览量) > 0
    ).sort((a, b) => new Date(a.发布时间) - new Date(b.发布时间));

    // 获取所有发布日期并排序
    const allDates = [...new Set(publishedVideos.map(item => item.发布时间))].sort();

    // 计算累计浏览量：到每个日期为止的所有已发布视频浏览量总和
    const cumulativeViewsMap = new Map();
    allDates.forEach(currentDate => {
        // 获取到当前日期为止所有已发布的视频
        const videosUpToDate = publishedVideos.filter(item => item.发布时间 <= currentDate);
        const totalViews = videosUpToDate.reduce((sum, item) => sum + (parseInt(item.浏览量) || 0), 0);
        cumulativeViewsMap.set(currentDate, totalViews);
    });

    // 获取最近10个发布日期
    const sortedDates = allDates.slice(-10);
    const labels = sortedDates.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const viewsData = sortedDates.map(date => cumulativeViewsMap.get(date));

    charts.metricsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '总浏览量',
                data: viewsData,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#007bff',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return (value / 1000).toFixed(1) + 'K';
                            }
                            return value;
                        }
                    }
                },
                x: {
                    title: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    onClick: function() {
                        // 禁用点击图例的默认行为（划线效果）
                        return false;
                    }
                },
                title: {
                    display: false
                }
            }
        }
    });
}

// 更新状态统计
function updateStatusStats() {
    const notStarted = videoData.filter(item =>
        item.剧本完成进度 === '未完成' || item.剧本完成进度 === ''
    ).length;

    const inProgress = videoData.filter(item =>
        item.剧本完成进度 === '完成' && item.发布进度 !== '完成'
    ).length;

    const published = videoData.filter(item =>
        item.发布进度 === '完成'
    ).length;

    document.getElementById('notStartedCount').textContent = notStarted;
    document.getElementById('inProgressCount').textContent = inProgress;
    document.getElementById('publishedCount').textContent = published;

    // 更新状态卡片的选中状态
    updateStatusCardSelection();
}

// 根据当前筛选状态获取过滤后的数据
function getFilteredData() {
    if (currentFilter === 'all') {
        return videoData;
    }

    return videoData.filter(item => {
        switch (currentFilter) {
            case 'not-started':
                return item.剧本完成进度 === '未完成' || item.剧本完成进度 === '';
            case 'in-progress':
                return item.剧本完成进度 === '完成' && item.发布进度 !== '完成';
            case 'published':
                return item.发布进度 === '完成';
            default:
                return true;
        }
    });
}

// 设置筛选状态
function setFilter(filterType) {
    // 如果点击的是当前已选中的筛选状态，则取消筛选回到全量显示
    if (currentFilter === filterType) {
        currentFilter = 'all';
    } else {
        currentFilter = filterType;
    }

    updateTable();
    updateStatusCardSelection();
}

// 更新状态卡片的选中状态
function updateStatusCardSelection() {
    // 移除所有状态卡片的选中状态
    document.querySelectorAll('.status-card').forEach(card => {
        card.classList.remove('selected');
    });

    // 根据当前筛选状态添加选中状态
    if (currentFilter !== 'all') {
        const targetCard = document.querySelector(`.status-card.${currentFilter}`);
        if (targetCard) {
            targetCard.classList.add('selected');
        }
    }
}



// 更新表格
function updateTable() {
    // 根据当前筛选状态获取要显示的数据
    const filteredData = getFilteredData();

    // 更新桌面端表格
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    filteredData.forEach((item) => {
        const originalIndex = videoData.indexOf(item);
        const row = createTableRow(item, originalIndex);
        tbody.appendChild(row);
    });

    // 更新移动端卡片
    updateMobileTable();
    updateStatusStats();
}

// 更新移动端表格
function updateMobileTable() {
    // 根据当前筛选状态获取要显示的数据
    const filteredData = getFilteredData();

    const container = document.getElementById('mobileTableContainer');
    container.innerHTML = '';

    filteredData.forEach((item) => {
        const originalIndex = videoData.indexOf(item);
        const card = createMobileCard(item, originalIndex);
        container.appendChild(card);
    });
}

// 显示保存按钮
function showSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.classList.add('show');
        console.log('保存按钮已显示');
    } else {
        console.error('找不到保存按钮元素');
    }
}

// 隐藏保存按钮
function hideSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.classList.remove('show');
        console.log('保存按钮已隐藏');
    } else {
        console.error('找不到保存按钮元素');
    }
}

// 保存更改
async function saveChanges() {
    try {
        await window.dataManager.saveData(videoData);
        hasUnsavedChanges = false;
        hideSaveButton();
        alert('数据保存成功！');
        updateCharts();
    } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败，请重试');
    }
}

// 添加行
function addRow() {
    const newRow = {
        "视频名称": "",
        "剧本完成进度": "",
        "来访拍摄进度": "",
        "剪辑进度": "",
        "审核进度": "",
        "发布进度": "",
        "发布时间": "",
        "浏览量": "",
        "点赞量": "",
        "评论量": "",
        "转发量": ""
    };
    
    videoData.push(newRow);
    updateTable();
    hasUnsavedChanges = true;
    showSaveButton();
}

// 删除选中行
function deleteSelectedRows() {
    const checkboxes = document.querySelectorAll('.row-checkbox:checked');
    const indices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index)).sort((a, b) => b - a);
    
    if (indices.length === 0) {
        alert('请先选择要删除的行');
        return;
    }
    
    if (confirm(`确定要删除选中的 ${indices.length} 行吗？`)) {
        indices.forEach(index => {
            videoData.splice(index, 1);
        });
        updateTable();
        hasUnsavedChanges = true;
        showSaveButton();
    }
}

// 快速导航功能
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function scrollToBottom() {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
    });
}

// 监听滚动事件，显示/隐藏快速导航按钮
window.addEventListener('scroll', function() {
    const quickNav = document.getElementById('quickNav');
    if (quickNav) {
        // 检查当前是否在数据表格页面，且是移动端
        const isTablePage = document.getElementById('table').classList.contains('active');
        const isMobile = window.innerWidth <= 768;

        // 如果是移动端的数据表格页面，才显示快速导航
        if (isTablePage && isMobile && window.scrollY > 300) {
            quickNav.style.opacity = '1';
            quickNav.style.pointerEvents = 'auto';
        } else {
            quickNav.style.opacity = '0';
            quickNav.style.pointerEvents = 'none';
        }
    }
});

// 创建移动端卡片
function createMobileCard(item, index) {
    const card = document.createElement('div');
    card.className = 'mobile-card';

    // 根据状态设置卡片样式
    if (item.发布进度 === '完成') {
        card.classList.add('completed');
    } else if (item.剧本完成进度 === '未完成' || item.剧本完成进度 === '') {
        card.classList.add('not-started');
    } else {
        card.classList.add('in-progress');
    }

    const progressOptions = ['', '未完成', '完成'];

    // 获取进度摘要信息
    const progressSummary = getProgressSummary(item);

    card.innerHTML = `
        <div class="mobile-card-header">
            <div class="mobile-card-title-row">
                <input type="text" value="${item.视频名称 || ''}"
                       onchange="updateData(${index}, '视频名称', this.value)"
                       style="border: none; background: transparent; font-weight: bold; font-size: 16px; flex: 1;">
                <input type="checkbox" class="mobile-card-checkbox row-checkbox" data-index="${index}">
            </div>
            <div class="mobile-card-summary">
                <span class="progress-summary">${progressSummary}</span>
                <button class="mobile-card-toggle" onclick="toggleMobileCard(${index})" type="button">
                    <span class="toggle-icon">▼</span>
                    <span class="toggle-text">展开</span>
                </button>
            </div>
        </div>

        <!-- 已发布视频的四个量显示在外面 -->
        ${item.发布进度 === '完成' ? `
        <div class="mobile-metrics-external">
            <div class="mobile-metric-external">
                <div class="mobile-metric-label">浏览量</div>
                <input type="number" value="${item.浏览量 || ''}"
                       onchange="updateData(${index}, '浏览量', this.value)"
                       class="mobile-metric-value" style="text-align: center; border: 1px solid #ddd; border-radius: 4px; padding: 4px;">
            </div>
            <div class="mobile-metric-external">
                <div class="mobile-metric-label">点赞量</div>
                <input type="number" value="${item.点赞量 || ''}"
                       onchange="updateData(${index}, '点赞量', this.value)"
                       class="mobile-metric-value" style="text-align: center; border: 1px solid #ddd; border-radius: 4px; padding: 4px;">
            </div>
            <div class="mobile-metric-external">
                <div class="mobile-metric-label">评论量</div>
                <input type="number" value="${item.评论量 || ''}"
                       onchange="updateData(${index}, '评论量', this.value)"
                       class="mobile-metric-value" style="text-align: center; border: 1px solid #ddd; border-radius: 4px; padding: 4px;">
            </div>
            <div class="mobile-metric-external">
                <div class="mobile-metric-label">转发量</div>
                <input type="number" value="${item.转发量 || ''}"
                       onchange="updateData(${index}, '转发量', this.value)"
                       class="mobile-metric-value" style="text-align: center; border: 1px solid #ddd; border-radius: 4px; padding: 4px;">
            </div>
        </div>
        ` : ''}

        <div class="mobile-card-content" id="mobile-card-content-${index}">
            <div class="mobile-field">
                <span class="mobile-field-label">剧本:</span>
                <div class="mobile-field-value">
                    <select onchange="updateData(${index}, '剧本完成进度', this.value)">
                        ${progressOptions.map(option =>
                            `<option value="${option}" ${item.剧本完成进度 === option ? 'selected' : ''}>${option || '未设置'}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>

            <div class="mobile-field">
                <span class="mobile-field-label">拍摄:</span>
                <div class="mobile-field-value">
                    <select onchange="updateData(${index}, '来访拍摄进度', this.value)">
                        ${progressOptions.map(option =>
                            `<option value="${option}" ${item.来访拍摄进度 === option ? 'selected' : ''}>${option || '未设置'}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>

            <div class="mobile-field">
                <span class="mobile-field-label">剪辑:</span>
                <div class="mobile-field-value">
                    <select onchange="updateData(${index}, '剪辑进度', this.value)">
                        ${progressOptions.map(option =>
                            `<option value="${option}" ${item.剪辑进度 === option ? 'selected' : ''}>${option || '未设置'}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>

            <div class="mobile-field">
                <span class="mobile-field-label">审核:</span>
                <div class="mobile-field-value">
                    <select onchange="updateData(${index}, '审核进度', this.value)">
                        ${progressOptions.map(option =>
                            `<option value="${option}" ${item.审核进度 === option ? 'selected' : ''}>${option || '未设置'}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>

            <div class="mobile-field">
                <span class="mobile-field-label">发布:</span>
                <div class="mobile-field-value">
                    <select onchange="updateData(${index}, '发布进度', this.value)">
                        ${progressOptions.map(option =>
                            `<option value="${option}" ${item.发布进度 === option ? 'selected' : ''}>${option || '未设置'}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>

            <div class="mobile-field">
                <span class="mobile-field-label">时间:</span>
                <div class="mobile-field-value">
                    <div style="display: flex; gap: 5px;">
                        <input type="date" value="${item.发布时间 || ''}"
                               onchange="updateData(${index}, '发布时间', this.value)"
                               style="flex: 1;">
                        <button type="button" onclick="setTodayMobile(this, ${index})"
                                style="background: #007bff; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px;">今天</button>
                    </div>
                </div>
            </div>

            <!-- 四个量已移到外面，这里只保留其他内容 -->
        </div>
    `;

    return card;
}

// 获取进度摘要信息
function getProgressSummary(item) {
    const stages = [
        { key: '剧本完成进度', name: '剧本' },
        { key: '来访拍摄进度', name: '拍摄' },
        { key: '剪辑进度', name: '剪辑' },
        { key: '审核进度', name: '审核' },
        { key: '发布进度', name: '发布' }
    ];

    const completed = stages.filter(stage => item[stage.key] === '完成').length;
    const total = stages.length;

    // 找出当前进行到哪个阶段
    let currentStage = '未开始';
    for (let i = 0; i < stages.length; i++) {
        if (item[stages[i].key] === '完成') {
            continue;
        } else if (item[stages[i].key] === '未完成' || item[stages[i].key] === '') {
            if (i === 0) {
                currentStage = '未开始';
            } else {
                currentStage = `进行中 (${stages[i-1].name}已完成)`;
            }
            break;
        }
    }

    if (completed === total) {
        currentStage = '全部完成';
    }

    return `${completed}/${total} - ${currentStage}`;
}

// 切换移动端卡片的折叠状态
function toggleMobileCard(index) {
    const content = document.getElementById(`mobile-card-content-${index}`);
    const button = content.parentElement.querySelector('.mobile-card-toggle');
    const icon = button.querySelector('.toggle-icon');
    const text = button.querySelector('.toggle-text');

    if (content.classList.contains('expanded')) {
        // 折叠
        content.classList.remove('expanded');
        icon.textContent = '▼';
        text.textContent = '展开';
        button.classList.remove('expanded'); // 移除展开状态的颜色
    } else {
        // 展开
        content.classList.add('expanded');
        icon.textContent = '▲';
        text.textContent = '折叠';
        button.classList.add('expanded'); // 添加展开状态的颜色
    }
}



// 创建表格行
function createTableRow(item, index) {
    const row = document.createElement('tr');
    const progressOptions = ['', '未完成', '完成'];

    // 确定状态类
    let statusClass = '';
    if (item.发布进度 === '完成') {
        statusClass = 'completed';
    } else if (item.剧本完成进度 === '未完成' || item.剧本完成进度 === '') {
        statusClass = 'not-started';
    } else {
        statusClass = 'in-progress';
    }

    row.innerHTML = `
        <td>
            <div class="name-cell-content">
                <input type="checkbox" class="row-checkbox" data-index="${index}">
                <div class="editable-cell" onclick="startEdit(this, ${index}, '视频名称', 'text')">
                    <div class="display-value">${item.视频名称 || '点击输入视频名称'}</div>
                    <input type="text" class="edit-input" value="${item.视频名称 || ''}"
                           onblur="finishEdit(this, ${index}, '视频名称')"
                           onkeydown="handleKeyDown(event, this, ${index}, '视频名称')"
                           placeholder="请输入视频名称">
                </div>
            </div>
        </td>
        <td class="progress-cell ${statusClass}">
            <div class="editable-cell" onclick="startEdit(this, ${index}, '剧本完成进度', 'select')">
                <div class="display-value">${item.剧本完成进度 || '点击选择'}</div>
                <select class="edit-input" onblur="finishEdit(this, ${index}, '剧本完成进度')"
                        onchange="finishEdit(this, ${index}, '剧本完成进度')">
                    ${progressOptions.map(option =>
                        `<option value="${option}" ${item.剧本完成进度 === option ? 'selected' : ''}>${option || '未设置'}</option>`
                    ).join('')}
                </select>
            </div>
        </td>
        <td class="progress-cell ${statusClass}">
            <div class="editable-cell" onclick="startEdit(this, ${index}, '来访拍摄进度', 'select')">
                <div class="display-value">${item.来访拍摄进度 || '点击选择'}</div>
                <select class="edit-input" onblur="finishEdit(this, ${index}, '来访拍摄进度')"
                        onchange="finishEdit(this, ${index}, '来访拍摄进度')">
                    ${progressOptions.map(option =>
                        `<option value="${option}" ${item.来访拍摄进度 === option ? 'selected' : ''}>${option || '未设置'}</option>`
                    ).join('')}
                </select>
            </div>
        </td>
        <td class="progress-cell ${statusClass}">
            <div class="editable-cell" onclick="startEdit(this, ${index}, '剪辑进度', 'select')">
                <div class="display-value">${item.剪辑进度 || '点击选择'}</div>
                <select class="edit-input" onblur="finishEdit(this, ${index}, '剪辑进度')"
                        onchange="finishEdit(this, ${index}, '剪辑进度')">
                    ${progressOptions.map(option =>
                        `<option value="${option}" ${item.剪辑进度 === option ? 'selected' : ''}>${option || '未设置'}</option>`
                    ).join('')}
                </select>
            </div>
        </td>
        <td class="progress-cell ${statusClass}">
            <div class="editable-cell" onclick="startEdit(this, ${index}, '审核进度', 'select')">
                <div class="display-value">${item.审核进度 || '点击选择'}</div>
                <select class="edit-input" onblur="finishEdit(this, ${index}, '审核进度')"
                        onchange="finishEdit(this, ${index}, '审核进度')">
                    ${progressOptions.map(option =>
                        `<option value="${option}" ${item.审核进度 === option ? 'selected' : ''}>${option || '未设置'}</option>`
                    ).join('')}
                </select>
            </div>
        </td>
        <td class="progress-cell ${statusClass}">
            <div class="editable-cell" onclick="startEdit(this, ${index}, '发布进度', 'select')">
                <div class="display-value">${item.发布进度 || '点击选择'}</div>
                <select class="edit-input" onblur="finishEdit(this, ${index}, '发布进度')"
                        onchange="finishEdit(this, ${index}, '发布进度')">
                    ${progressOptions.map(option =>
                        `<option value="${option}" ${item.发布进度 === option ? 'selected' : ''}>${option || '未设置'}</option>`
                    ).join('')}
                </select>
            </div>
        </td>
        <td>
            <div class="editable-cell" onclick="startEdit(this, ${index}, '发布时间', 'date')">
                <div class="display-value">${item.发布时间 || '点击选择日期'}</div>
                <div class="edit-input date-picker-container">
                    <input type="date" value="${item.发布时间 || ''}"
                           onblur="finishEdit(this, ${index}, '发布时间')"
                           onchange="finishEdit(this, ${index}, '发布时间')">
                    <button type="button" class="date-quick-btn" onclick="setToday(this, ${index})">今天</button>
                </div>
            </div>
        </td>
        <td>
            <div class="editable-cell" onclick="startEdit(this, ${index}, '浏览量', 'number')">
                <div class="display-value">${item.浏览量 || '点击输入'}</div>
                <input type="number" class="edit-input" value="${item.浏览量 || ''}"
                       onblur="finishEdit(this, ${index}, '浏览量')"
                       onkeydown="handleKeyDown(event, this, ${index}, '浏览量')"
                       placeholder="输入浏览量">
            </div>
        </td>
        <td>
            <div class="editable-cell" onclick="startEdit(this, ${index}, '点赞量', 'number')">
                <div class="display-value">${item.点赞量 || '点击输入'}</div>
                <input type="number" class="edit-input" value="${item.点赞量 || ''}"
                       onblur="finishEdit(this, ${index}, '点赞量')"
                       onkeydown="handleKeyDown(event, this, ${index}, '点赞量')"
                       placeholder="输入点赞量">
            </div>
        </td>
        <td>
            <div class="editable-cell" onclick="startEdit(this, ${index}, '评论量', 'number')">
                <div class="display-value">${item.评论量 || '点击输入'}</div>
                <input type="number" class="edit-input" value="${item.评论量 || ''}"
                       onblur="finishEdit(this, ${index}, '评论量')"
                       onkeydown="handleKeyDown(event, this, ${index}, '评论量')"
                       placeholder="输入评论量">
            </div>
        </td>
        <td>
            <div class="editable-cell" onclick="startEdit(this, ${index}, '转发量', 'number')">
                <div class="display-value">${item.转发量 || '点击输入'}</div>
                <input type="number" class="edit-input" value="${item.转发量 || ''}"
                       onblur="finishEdit(this, ${index}, '转发量')"
                       onkeydown="handleKeyDown(event, this, ${index}, '转发量')"
                       placeholder="输入转发量">
            </div>
        </td>
    `;

    return row;
}

// 更新数据
function updateData(index, field, value) {
    videoData[index][field] = value;
    hasUnsavedChanges = true;
    showSaveButton();
    updateStatusStats();

    // 如果更新的是浏览量、点赞量、评论量、转发量或发布时间，需要更新统计和图表
    if (['浏览量', '点赞量', '评论量', '转发量', '发布时间', '发布进度'].includes(field)) {
        updateDataStats();
        createMetricsChart();
    }

    // 确定新的状态类
    let statusClass = '';
    if (videoData[index].发布进度 === '完成') {
        statusClass = 'completed';
    } else if (videoData[index].剧本完成进度 === '未完成' || videoData[index].剧本完成进度 === '') {
        statusClass = 'not-started';
    } else {
        statusClass = 'in-progress';
    }

    // 更新桌面端进度列样式
    const row = document.querySelector(`input.row-checkbox[data-index="${index}"]`)?.closest('tr');
    if (row) {
        const progressCells = row.querySelectorAll('.progress-cell');
        progressCells.forEach(cell => {
            cell.className = `progress-cell ${statusClass}`;
        });
    }

    // 更新移动端卡片样式和内容
    const mobileCard = document.querySelector(`input.mobile-card-checkbox[data-index="${index}"]`)?.closest('.mobile-card');
    if (mobileCard) {
        // 如果发布进度改变，需要重新渲染整个卡片以显示/隐藏外部四个量
        if (field === '发布进度') {
            const container = mobileCard.parentElement;
            const newCard = createMobileCard(videoData[index], index);
            container.replaceChild(newCard, mobileCard);
        } else {
            // 只更新样式
            mobileCard.className = 'mobile-card';
            if (videoData[index].发布进度 === '完成') {
                mobileCard.classList.add('completed');
            } else if (videoData[index].剧本完成进度 === '未完成' || videoData[index].剧本完成进度 === '') {
                mobileCard.classList.add('not-started');
            } else {
                mobileCard.classList.add('in-progress');
            }

            // 更新进度摘要
            const progressSummary = mobileCard.querySelector('.progress-summary');
            if (progressSummary) {
                progressSummary.textContent = getProgressSummary(videoData[index]);
            }
        }
    }
}

// 开始编辑
function startEdit(cell, index, field, type) {
    // 如果已经在编辑状态，不重复触发
    if (cell.classList.contains('editing')) {
        return;
    }

    // 结束其他正在编辑的单元格
    document.querySelectorAll('.editable-cell.editing').forEach(editingCell => {
        if (editingCell !== cell) {
            finishEditWithoutSave(editingCell);
        }
    });

    cell.classList.add('editing');
    const input = cell.querySelector('.edit-input');

    if (type === 'select') {
        input.focus();
    } else {
        input.focus();
        input.select();
    }
}

// 完成编辑
function finishEdit(input, index, field) {
    const cell = input.closest('.editable-cell');
    const value = input.value;

    // 更新数据
    updateData(index, field, value);

    // 更新显示值
    const displayValue = cell.querySelector('.display-value');
    if (value) {
        displayValue.textContent = value;
    } else {
        displayValue.textContent = getPlaceholderText(field);
    }

    // 退出编辑状态
    cell.classList.remove('editing');
}

// 完成编辑但不保存（用于取消编辑）
function finishEditWithoutSave(cell) {
    cell.classList.remove('editing');
}

// 处理键盘事件
function handleKeyDown(event, input, index, field) {
    if (event.key === 'Enter') {
        finishEdit(input, index, field);
    } else if (event.key === 'Escape') {
        const cell = input.closest('.editable-cell');
        finishEditWithoutSave(cell);
    }
}

// 设置今天日期（桌面端）
function setToday(button, index) {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = button.previousElementSibling;
    dateInput.value = today;
    finishEdit(dateInput, index, '发布时间');
}

// 设置今天日期（移动端）
function setTodayMobile(button, index) {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = button.parentElement.querySelector('input[type="date"]');
    dateInput.value = today;
    updateData(index, '发布时间', today);
}

// 获取占位符文本
function getPlaceholderText(field) {
    const placeholders = {
        '视频名称': '点击输入视频名称',
        '剧本完成进度': '点击选择',
        '来访拍摄进度': '点击选择',
        '剪辑进度': '点击选择',
        '审核进度': '点击选择',
        '发布进度': '点击选择',
        '发布时间': '点击选择日期',
        '浏览量': '点击输入',
        '点赞量': '点击输入',
        '评论量': '点击输入',
        '转发量': '点击输入'
    };
    return placeholders[field] || '点击编辑';
}

// 更新快速导航按钮可见性
function updateQuickNavVisibility() {
    const quickNav = document.getElementById('quickNav');
    if (quickNav) {
        const isTablePage = document.getElementById('table').classList.contains('active');
        const isMobile = window.innerWidth <= 768;

        // 如果不是移动端的数据表格页面，隐藏快速导航
        if (!isTablePage || !isMobile) {
            quickNav.style.opacity = '0';
            quickNav.style.pointerEvents = 'none';
        }
    }
}

// 监听窗口大小变化，更新快速导航按钮状态
window.addEventListener('resize', function() {
    updateQuickNavVisibility();
});

// 页面离开前提醒保存
window.addEventListener('beforeunload', function(e) {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});
