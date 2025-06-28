# ���ı�֪ʶ��API�ĵ�

## ����
����һ�����ı��ĵ�֪ʶ��ϵͳ��API�ӿ��ĵ���֧���ĵ������ı����ۺͰ汾���ƹ��ܡ�

## ������Ϣ
- **����URL**: `http://localhost:3300/api`
- **��Ӧ��ʽ**: ���нӿ�ͳһ���� `{ code, message, data }` ��ʽ
- **��֤��ʽ**: ���ֽӿ���Ҫ�û���֤

## 1. �û�����ӿ�

### 1.1 �û�ע��
- **URL**: `POST /api/users/register`
- **����**: ע�����û�
- **������**:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```
- **����**:
```json
{
  "code": 200,
  "message": "�û�ע��ɹ�",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 1.2 �û���¼
- **URL**: `POST /api/users/login`
- **����**: �û���¼
- **������**:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
- **����**:
```json
{
  "code": 200,
  "message": "��¼�ɹ�",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com"
    }
  }
}
```

## 2. ֪ʶ�����ӿ�

### 2.1 ����֪ʶ��
- **URL**: `POST /api/knowledgeBase/create`
- **����**: �����µ�֪ʶ��
- **������**:
```json
{
  "name": "�ҵ�֪ʶ��",
  "description": "����һ������֪ʶ��",
  "ownerId": 1
}
```
- **����**:
```json
{
  "code": 200,
  "message": "֪ʶ�ⴴ���ɹ�",
  "data": {
    "id": 1,
    "name": "�ҵ�֪ʶ��",
    "description": "����һ������֪ʶ��",
    "ownerId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2.2 ��ȡ�û���֪ʶ���б�
- **URL**: `GET /api/knowledgeBase/user/:userId`
- **����**: ��ȡָ���û���֪ʶ���б�
- **����**:
```json
{
  "code": 200,
  "message": "��ȡ֪ʶ���б�ɹ�",
  "data": [
    {
      "id": 1,
      "name": "�ҵ�֪ʶ��",
      "description": "����һ������֪ʶ��",
      "ownerId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 3. �ĵ�����ӿ�

### 3.1 �����ĵ�
- **URL**: `POST /api/documents/create`
- **����**: �����µ��ĵ�
- **������**:
```json
{
  "title": "�ĵ�����",
  "content": "�ĵ����ݣ���ѡ��",
  "ownerId": 1,
  "knowledgeBaseId": 1,
  "folderId": 1
}
```
- **����˵��**:
  - `title` (����): �ĵ�����
  - `content` (��ѡ): �ĵ����ݣ�Ĭ��Ϊ���ַ���
  - `ownerId` (����): �ĵ�ӵ����ID
  - `knowledgeBaseId` (����): ����֪ʶ��ID
  - `folderId` (��ѡ): �����ļ���ID��Ĭ��Ϊnull
- **����**:
```json
{
  "code": 200,
  "message": "�ĵ������ɹ�",
  "data": {
    "id": 1,
    "title": "�ĵ�����",
    "content": "�ĵ�����",
    "ownerId": 1,
    "knowledgeBaseId": 1,
    "folderId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3.2 ��ȡ�ĵ��б�
- **URL**: `GET /api/documents/list/:knowledgeBaseId`
- **URL**: `GET /api/documents/list/:knowledgeBaseId/:userId`
- **����**: ��ȡָ��֪ʶ����ĵ��б�
- **����**:
  - `knowledgeBaseId` (·������): ֪ʶ��ID
  - `userId` (��ѡ·������): �û�ID������ṩ��ֻ���ظ��û�ӵ�е��ĵ�
- **����**:
```json
{
  "code": 200,
  "message": "��ȡ�ĵ��б�ɹ�",
  "data": [
    {
      "id": 1,
      "title": "�ĵ�����",
      "ownerId": 1,
      "ownerName": "�û���",
      "knowledgeBaseId": 1,
      "folderId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3.3 ��ȡ�ĵ�����
- **URL**: `GET /api/documents/:documentId/:userId`
- **����**: ��ȡָ���ĵ�������
- **����**:
```json
{
  "code": 200,
  "message": "��ȡ�ĵ��ɹ�",
  "data": {
    "id": 1,
    "title": "�����ĵ�",
    "content": "�ĵ�����...",
    "knowledgeBaseId": 1,
    "folderId": 1,
    "ownerId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3.4 ���渻�ı�
- **URL**: `POST /api/documents/save`
- **����**: �����ĵ��ĸ��ı����ݣ��Զ������°汾��
- **������**:
```json
{
  "userId": 1,
  "documentId": 1,
  "newContent": "���º���ĵ�����",
  "updateTime": "2024-01-01T00:00:00.000Z"
}
```
- **����**:
```json
{
  "code": 200,
  "message": "�ĵ�����ɹ�",
  "data": {
    "documentId": 1,
    "versionNumber": 2,
    "diff": "�������� 50 ���ַ�",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3.5 ɾ���ĵ�
- **URL**: `DELETE /api/documents/:documentId/:userId`
- **����**: ɾ��ָ���ĵ�����ɾ����
- **����**:
  - `documentId` (·������): �ĵ�ID
  - `userId` (·������): �û�ID������Ȩ����֤��
- **����**:
```json
{
  "code": 200,
  "message": "�ĵ�ɾ���ɹ�",
  "data": null
}
```

## 4. �ı����۽ӿ�

### 4.1 ѡ���ı�����
- **URL**: `POST /api/text-comments/add`
- **����**: Ϊѡ�е��ı��������
- **������**:
```json
{
  "textNanoid": "unique_text_id",
  "textContent": "��ѡ�е��ı�����",
  "comment": "��������",
  "userId": 1,
  "documentId": 1
}
```
- **����**:
```json
{
  "code": 200,
  "message": "�ı�������ӳɹ�",
  "data": {
    "id": 1,
    "textNanoid": "unique_text_id",
    "textContent": "��ѡ�е��ı�����",
    "comment": "��������",
    "userId": 1,
    "documentId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### textNanoid ����˵��
`textNanoid` ��ǰ�����û�ѡ���ı�ʱ��̬���ɵ�Ψһ��ʶ�������ڱ�ʶ�ض����ı�Ƭ�Ρ�

**���ɹ���**:
- ��ʽ: `text_{����ַ���}_{ʱ���}`
- ʾ��: `text_ABC123DEF_1704067200000`
- ����: ͨ��20-30���ַ�

**ǰ��ʵ�ֲ���**:
1. �����ı�ѡ���¼� (`mouseup` �� `selectionchange`)
2. ��ȡѡ�е��ı�����
3. ����Ψһ�� `textNanoid`
4. ��ʾ���۰�ť��Ի���
5. �û��������ۺ󣬽� `textNanoid` ����������һ���͵�API

**����ʾ������**:
```javascript
// ʹ�� nanoid ��
import { nanoid } from 'nanoid';
const textNanoid = `text_${nanoid(10)}_${Date.now()}`;

// ��ʹ���Զ��庯��
function generateTextNanoid() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'text_';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '_' + Date.now();
  return result;
}
```

**ʹ�ó���**:
- �û�ѡ���ĵ��е�һ���ı�
- ǰ������Ψһ�� `textNanoid`
- �û�������۰�ť��������������
- ǰ�˽� `textNanoid`��ѡ�е��ı����ݡ���������һ���͵����
- ��˱������ۣ�����ͨ�� `textNanoid` ������������ı�Ƭ��

### 4.2 ��ȡ�ı�����
- **URL**: `GET /api/text-comments/:textNanoid`
- **����**: ��ȡָ���ı�Ƭ�ε���������
- **����**:
  - `textNanoid` (·������): �ı���Ψһ��ʶ
- **����**:
```json
{
  "code": 200,
  "message": "��ȡ�ı����۳ɹ�",
  "data": [
    {
      "id": 1,
      "textContent": "��ѡ�е��ı�����",
      "comment": "��������",
      "userId": 1,
      "username": "�û���",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 4.3 ��ȡ�ĵ��������ı�����
- **URL**: `GET /api/text-comments/document/:documentId`
- **����**: ��ȡָ���ĵ��������ı�����
- **����**:
  - `documentId` (·������): �ĵ�ID
- **����**:
```json
{
  "code": 200,
  "message": "��ȡ�ĵ��ı����۳ɹ�",
  "data": [
    {
      "id": 1,
      "textNanoid": "unique_text_id",
      "textContent": "��ѡ�е��ı�����",
      "comment": "��������",
      "userId": 1,
      "username": "�û���",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 4.4 ɾ���ı�����
- **URL**: `DELETE /api/text-comments/:commentId`
- **����**: ɾ��ָ�����ı����ۣ�ֻ�з����߿���ɾ����
- **����**:
  - `commentId` (·������): ����ID
- **������**:
```json
{
  "userId": 1
}
```
- **����**:
```json
{
  "code": 200,
  "message": "����ɾ���ɹ�",
  "data": {
    "deletedCommentId": 1
  }
}
```

## 5. �汾����ӿ�

### �汾����˵��
�汾�������**�Զ��汾����**���ƣ�
- ÿ�α����ĵ�ʱ��ϵͳ�Զ������°汾
- �汾���Զ������������û�ָ��
- ϵͳ�Զ���������һ�汾�Ĳ���
- �û������ֶ�����汾��

### 5.1 �鿴�汾�б�
- **URL**: `GET /api/versions/:documentId`
- **����**: ��ȡָ���ĵ������а汾�б�
- **����**:
  - `documentId` (·������): �ĵ�ID
- **����**:
```json
{
  "code": 200,
  "message": "��ȡ�汾�б�ɹ�",
  "data": [
    {
      "id": 1,
      "versionNumber": 3,
      "diff": "�������� 50 ���ַ�",
      "savedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "versionNumber": 2,
      "diff": "���ݱ��޸�",
      "savedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 3,
      "versionNumber": 1,
      "diff": "��ʼ�汾",
      "savedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 5.2 ��ȡ�ض��汾����
- **URL**: `GET /api/versions/:documentId/:versionNumber`
- **����**: ��ȡָ���ĵ����ض��汾����
- **����**:
  - `documentId` (·������): �ĵ�ID
  - `versionNumber` (·������): �汾��
- **����**:
```json
{
  "code": 200,
  "message": "��ȡ�汾���ݳɹ�",
  "data": {
    "id": 1,
    "documentId": 1,
    "versionNumber": 2,
    "content": "�汾����",
    "diff": "����һ�汾�Ĳ��",
    "savedAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5.3 ���˰汾
- **URL**: `POST /api/versions/:documentId/:versionNumber/rollback`
- **����**: ���ĵ����˵�ָ���汾
- **����**:
  - `documentId` (·������): �ĵ�ID
  - `versionNumber` (·������): Ŀ��汾��
- **������**:
```json
{
  "userId": 1
}
```
- **����**:
```json
{
  "code": 200,
  "message": "�汾���˳ɹ�",
  "data": {
    "documentId": 1,
    "rollbackToVersion": 2,
    "newVersionNumber": 4,
    "content": "���˺������",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5.4 ɾ���汾
- **URL**: `DELETE /api/versions/:documentId/:versionNumber`
- **����**: ɾ��ָ���ĵ����ض��汾��ֻ��ӵ���߿���ɾ����
- **����**:
  - `documentId` (·������): �ĵ�ID
  - `versionNumber` (·������): �汾��
- **������**:
```json
{
  "userId": 1
}
```
- **����**:
```json
{
  "code": 200,
  "message": "�汾ɾ���ɹ�",
  "data": {
    "deletedVersionNumber": 2
  }
}
```

### �汾����˵��
ϵͳ���Զ�����汾��Ĳ��죬�����Ĳ�������������
- `��ʼ�汾`: �ĵ��ĵ�һ���汾
- `�����ޱ仯`: ����ʱ����û�б仯
- `�������� X ���ַ�`: ���ݳ�������
- `���ݼ��� X ���ַ�`: ���ݳ��ȼ���
- `���ݱ��޸�`: ���ݱ��޸ĵ�������ͬ
- `���˵��汾 X`: ͨ�����˲��������İ汾

## 6. �ļ��й���ӿ�

### 6.1 �����ļ���
- **URL**: `POST /api/folders/create`
- **����**: �������ļ���
- **������**:
```json
{
  "name": "�����ļ���",
  "knowledgeBaseId": 1,
  "parentFolderId": null
}
```
- **����**:
```json
{
  "code": 200,
  "message": "�ļ��д����ɹ�",
  "data": {
    "id": 1,
    "name": "�����ļ���",
    "knowledgeBaseId": 1,
    "parentFolderId": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6.2 ��ȡ�ļ����б�
- **URL**: `GET /api/folders/:knowledgeBaseId`
- **����**: ��ȡָ��֪ʶ����ļ����б�
- **����**:
```json
{
  "code": 200,
  "message": "��ȡ�ļ����б�ɹ�",
  "data": [
    {
      "id": 1,
      "name": "�����ļ���",
      "knowledgeBaseId": 1,
      "parentFolderId": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## ������Ӧ��ʽ
���нӿ��ڷ�������ʱ���᷵�����¸�ʽ��
```json
{
  "code": 400,
  "message": "����������Ϣ",
  "data": null
}
```

## ����������
- `400`: �����������
- `401`: δ��Ȩ����
- `404`: ��Դ������
- `500`: �������ڲ�����

## ����
����
����ʹ���ṩ�� test_api.js �ļ����������нӿڹ��ܡ�
�ܽ�
���Ѿ�������API�ĵ��е��ظ����ݣ����ڵ��ĵ��ṹ������û���ظ��Ľӿ�˵����
? �����������
ɾ�����ظ����ĵ�����ӿ� - ֻ���������������İ汾
ͳһ�˽ӿڱ�� - ���չ���ģ�����±��
���������б�Ҫ�Ľӿ� - ������Ҫ����ӵĴ����ĵ��ͻ�ȡ�ĵ��б�ӿ�
�����˰汾����ӿ� - ��ӳ�µ��Զ��汾�������
?? ��ǰ�ĵ��ṹ
�û�����ӿ� (1.x)
֪ʶ�����ӿ� (2.x)
�ĵ�����ӿ� (3.x) - �����������б���ȡ�����桢ɾ��
�ı����۽ӿ� (4.x) - ������ӡ���ȡ��ɾ������
�汾����ӿ� (5.x) - �Զ��汾����
�ļ��й���ӿ� (6.x)