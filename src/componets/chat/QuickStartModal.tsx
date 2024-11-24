import {api} from '@/api/api.tsx';
import {Modal} from 'antd';
import React, {useState} from 'react';
import styles from './QuickStartModal.module.scss';

interface QuickStartModalProps {
    visible: boolean;
    onClose: () => void;
}

const QuickStartModal: React.FC<QuickStartModalProps> = ({visible, onClose}) => {
    const [folderId, setFolderId] = useState<string | null>(null);

    // 提取获取 Folder ID 的函数
    const fetchFolderId = async () => {
        try {
            const foldersResponse = await api.get('/python/api/v1/folders/');

            if (foldersResponse.data.length > 0) {
                const firstFolderId = foldersResponse.data[0].id;
                setFolderId(firstFolderId);
                console.log('Fetched and set folder ID:', firstFolderId);
                return firstFolderId;
            } else {
                console.error('No folders found.');
                alert('没有找到合适的文件夹，请稍后再试。');
                return 1;
            }
        } catch (error) {
            console.error('Error fetching folder ID:', error);
            alert('获取文件夹ID失败，请稍后再试。');
            return 1;
        }
    };

    // 处理每个卡片的点击
    const handleCardClick = async (applicationName: string) => {
        // 获取 folderId，即使获取失败，仍然继续进行后续操作
        const folderId = await fetchFolderId();

        try {
            // 调用 /java/getApplicationTemplate API 并传递 applicationName
            const response = await api.get('/java/getApplicationTemplate', {
                params: {applicationName},
            });
            console.log('Application template response:', response.data);

            if (response.data) {
                // 替换 folder_id，即使 folderId 为 null，仍然继续
                const templateData = {...response.data};
                if (folderId) {
                    templateData.folder_id = folderId;
                }

                // 调用 /python/api/v1/flows/ 接口并传递模板数据
                const createFlowResponse = await api.post('/python/api/v1/flows/', templateData);
                // 获取响应数据中的id
                const flowId = createFlowResponse.data.id;
                window.location.href = `http://10.3.244.41:13730/flow/${flowId}`;
                //window.location.href = `http://localhost:3000/flow/${flowId}`;
            } else {
                console.error('No data found for application template.');
                alert('没有找到合适的应用模板，请稍后再试。');
            }
        } catch (error) {
            console.error('Error fetching or creating flow:', error);
            alert('获取应用模板或创建流程失败，请稍后再试。');
        }
    };

    return (
        <Modal
            visible={visible}
            onCancel={onClose}
            footer={null}
            width={1220}
            centered
            className={styles.modal}
        >
            <div className={styles.header}>
                <h2>快速开始</h2>
                <p>请从下方选择一个开始模板</p>
            </div>
            <div className={styles.content}>
                <div className={styles.templateGrid}>
                    <div className={styles.templateItem} onClick={() => handleCardClick('空白工作流')}>
                        <img src="/dp_qsm_empty_workflow.png" alt="空白工作流"/>
                        <p>空白工作流</p>
                    </div>
                    <div className={styles.templateItem} onClick={() => handleCardClick('基础提示词模板')}>
                        <img src="/dp_qsm_basic_prompt_template.png" alt="基础提示词模板"/>
                        <p>基础提示词模板</p>
                    </div>
                    <div className={styles.templateItem} onClick={() => handleCardClick('记忆聊天机器人')}>
                        <img src="/dp_qsm_chatbot_template.png" alt="聊天机器人模板"/>
                        <p>聊天机器人模板</p>
                    </div>
                    <div className={styles.templateItem} onClick={() => handleCardClick('文档问答')}>
                        <img src="/dp_qsm_document_answering.png" alt="文档回答"/>
                        <p>文档回答</p>
                    </div>
                    <div className={styles.templateItem} onClick={() => handleCardClick('博客写作')}>
                        <img src="/dp_qsm_blog_writing.png" alt="博客写作"/>
                        <p>博客写作</p>
                    </div>
                    <div className={styles.templateItem} onClick={() => handleCardClick('向量存储RAG')}>
                        <img src="/dp_qsm_rag_storage.png" alt="向量存储RAG"/>
                        <p>向量存储RAG</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default QuickStartModal;
