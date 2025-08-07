// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, set, get, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

// Firebase configuration - 用户需要替换这些值
const firebaseConfig = {
    apiKey: "AIzaSyDXkOJ-bBMyROThD0al3TNpPYoSWwUvLjc",
    authDomain: "video-manager-aa6bf.firebaseapp.com",
    databaseURL: "https://video-manager-aa6bf-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "video-manager-aa6bf",
    storageBucket: "video-manager-aa6bf.firebasestorage.app",
    messagingSenderId: "515806508959",
    appId: "1:515806508959:web:f7e23d5f324c48b5156faa"
};


// Initialize Firebase
let app, database;
let isFirebaseConnected = false;

try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    window.firebaseDB = { database, ref, set, get, onValue };
    isFirebaseConnected = true;
    console.log('Firebase已连接');
} catch (error) {
    console.log('Firebase未配置或连接失败，使用本地存储模式');
}

// 数据管理器
window.dataManager = {
    async saveData(data) {
        if (isFirebaseConnected) {
            try {
                await set(ref(database, 'videoData'), data);
                return true;
            } catch (error) {
                console.error('Firebase保存失败:', error);
                localStorage.setItem('videoData', JSON.stringify(data));
                return false;
            }
        } else {
            localStorage.setItem('videoData', JSON.stringify(data));
            return true;
        }
    },

    async loadData() {
        if (isFirebaseConnected) {
            try {
                const snapshot = await get(ref(database, 'videoData'));
                if (snapshot.exists()) {
                    return snapshot.val();
                }
            } catch (error) {
                console.error('Firebase读取失败:', error);
            }
        }
        
        const localData = localStorage.getItem('videoData');
        if (localData) {
            return JSON.parse(localData);
        }
        
        return this.getDefaultData();
    },

    getDefaultData() {
        // 生成测试用的发布时间（最近30天内的随机日期）
        const generateTestDate = (daysAgo) => {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            return date.toISOString().split('T')[0];
        };

        return [
            {"视频名称": "智能小江全景介绍", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(25), "浏览量": 1200, "点赞量": 80, "评论量": 15, "转发量": 5},
            {"视频名称": "机器狗第一集-3岁小朋友居家安全", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(22), "浏览量": 2500, "点赞量": 150, "评论量": 30, "转发量": 10},
            {"视频名称": "遇过完整！双进领导到访者观看机器人成果", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(20), "浏览量": 800, "点赞量": 50, "评论量": 10, "转发量": 3},
            {"视频名称": "宜兴支行走访", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(18), "浏览量": 1500, "点赞量": 100, "评论量": 20, "转发量": 8},
            {"视频名称": "感年安康", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(15), "浏览量": 900, "点赞量": 60, "评论量": 12, "转发量": 4},
            {"视频名称": "机器狗第二集-技能测试全演关", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(12), "浏览量": 3000, "点赞量": 200, "评论量": 40, "转发量": 15},
            {"视频名称": "高考加油视频", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(10), "浏览量": 1800, "点赞量": 120, "评论量": 25, "转发量": 7},
            {"视频名称": "程序员与AI结对编程的一天", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(8), "浏览量": 2200, "点赞量": 180, "评论量": 35, "转发量": 12},
            {"视频名称": "一份来自人们的表扬信", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(6), "浏览量": 1000, "点赞量": 70, "评论量": 18, "转发量": 6},
            {"视频名称": "经开区支行走访", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(5), "浏览量": 1300, "点赞量": 90, "评论量": 16, "转发量": 5},
            {"视频名称": "同事间学习强行刷剧大战", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(4), "浏览量": 1700, "点赞量": 110, "评论量": 22, "转发量": 9},
            {"视频名称": "夏至视频", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(3), "浏览量": 1100, "点赞量": 75, "评论量": 14, "转发量": 4},
            {"视频名称": "建党节视频", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(2), "浏览量": 1400, "点赞量": 95, "评论量": 19, "转发量": 6},
            {"视频名称": "钟楼支行走访", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(1), "浏览量": 1600, "点赞量": 105, "评论量": 21, "转发量": 7},
            {"视频名称": "AI智能助手演示", "剧本完成进度": "完成", "来访拍摄进度": "完成", "剪辑进度": "完成", "审核进度": "完成", "发布进度": "完成", "发布时间": generateTestDate(0), "浏览量": 2800, "点赞量": 220, "评论量": 45, "转发量": 18},
            {"视频名称": "工作日志助手", "剧本完成进度": "完成", "来访拍摄进度": "未完成", "剪辑进度": "未完成", "审核进度": "未完成", "发布进度": "未完成", "发布时间": "", "浏览量": 0, "点赞量": 0, "评论量": 0, "转发量": 0},
            {"视频名称": "智能会议助手", "剧本完成进度": "未完成", "来访拍摄进度": "未完成", "剪辑进度": "未完成", "审核进度": "未完成", "发布进度": "未完成", "发布时间": "", "浏览量": 0, "点赞量": 0, "评论量": 0, "转发量": 0},
            {"视频名称": "理财顾问助手", "剧本完成进度": "未完成", "来访拍摄进度": "未完成", "剪辑进度": "未完成", "审核进度": "未完成", "发布进度": "未完成", "发布时间": "", "浏览量": 0, "点赞量": 0, "评论量": 0, "转发量": 0},
            {"视频名称": "文本润色助手", "剧本完成进度": "未完成", "来访拍摄进度": "未完成", "剪辑进度": "未完成", "审核进度": "未完成", "发布进度": "未完成", "发布时间": "", "浏览量": 0, "点赞量": 0, "评论量": 0, "转发量": 0},
            {"视频名称": "PPT大师助手", "剧本完成进度": "未完成", "来访拍摄进度": "未完成", "剪辑进度": "未完成", "审核进度": "未完成", "发布进度": "未完成", "发布时间": "", "浏览量": 0, "点赞量": 0, "评论量": 0, "转发量": 0}
        ];
    }
};
