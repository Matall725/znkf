import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api-client';
import { Button, Card, Input, Modal, Table, StatusBadge, Loading } from '@znkfxt/shared-ui';
import type { KnowledgeCategory, KnowledgeArticle } from '@znkfxt/contracts';
import type { Column } from '@znkfxt/shared-ui/Table';

type Tab = 'articles' | 'categories';

export function KnowledgePage() {
  const [tab, setTab] = useState<Tab>('articles');

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>知识库</h2>
      <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
        <button onClick={() => setTab('articles')} style={{ padding: '8px 20px', border: '1px solid #d1d5db', background: tab === 'articles' ? '#1d4ed8' : '#fff', color: tab === 'articles' ? '#fff' : '#374151', borderRadius: '6px 0 0 6px', cursor: 'pointer', fontSize: 14 }}>文章管理</button>
        <button onClick={() => setTab('categories')} style={{ padding: '8px 20px', border: '1px solid #d1d5db', borderLeft: 'none', background: tab === 'categories' ? '#1d4ed8' : '#fff', color: tab === 'categories' ? '#fff' : '#374151', borderRadius: '0 6px 6px 0', cursor: 'pointer', fontSize: 14 }}>分类管理</button>
      </div>
      {tab === 'articles' ? <ArticleSection /> : <CategorySection />}
    </div>
  );
}

function CategorySection() {
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<KnowledgeCategory | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    adminApi.listCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditItem(null); setName(''); setSlug(''); setModalOpen(true); };

  const openEdit = (cat: KnowledgeCategory) => { setEditItem(cat); setName(cat.name); setSlug(cat.slug); setModalOpen(true); };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        await adminApi.updateCategory(editItem.id, { name: name.trim(), slug: slug.trim() });
      } else {
        await adminApi.createCategory({ name: name.trim(), slug: slug.trim() });
      }
      setModalOpen(false);
      fetchData();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  if (loading) return <Loading />;

  const columns: Column<KnowledgeCategory>[] = [
    { key: 'name', header: '名称' },
    { key: 'slug', header: '标识' },
    { key: 'status', header: '状态', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', header: '创建时间', render: (r) => new Date(r.createdAt).toLocaleString('zh-CN') },
    {
      key: 'actions', header: '操作', render: (r) => (
        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>编辑</Button>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button size="sm" onClick={openCreate}>新建分类</Button>
      </div>
      <Table columns={columns} data={categories} keyExtractor={(r) => r.id} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? '编辑分类' : '新建分类'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="名称" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="标识" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Button onClick={handleSave} loading={saving}>{editItem ? '保存' : '创建'}</Button>
        </div>
      </Modal>
    </Card>
  );
}

function ArticleSection() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchTitle, setSearchTitle] = useState('');
  const pageSize = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<KnowledgeArticle | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [articleType, setArticleType] = useState<'faq' | 'document'>('faq');
  const [status, setStatus] = useState<KnowledgeArticle['status']>('draft');
  const [keywords, setKeywords] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    adminApi.listArticles({ limit: pageSize, offset: page * pageSize, title: searchTitle || undefined })
      .then((res) => { setArticles(res.articles); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, searchTitle]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditItem(null);
    setTitle(''); setContent(''); setArticleType('faq'); setStatus('draft'); setKeywords('');
    setModalOpen(true);
  };

  const openEdit = (a: KnowledgeArticle) => {
    setEditItem(a);
    setTitle(a.title); setContent(a.content); setArticleType(a.articleType);
    setStatus(a.status); setKeywords(a.keywords.join(', '));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        articleType,
        status,
        keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      };
      if (editItem) {
        await adminApi.updateArticle(editItem.id, payload);
      } else {
        await adminApi.createArticle(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const totalPages = Math.ceil(total / pageSize);

  const columns: Column<KnowledgeArticle>[] = [
    { key: 'title', header: '标题', style: { maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
    { key: 'articleType', header: '类型', render: (r) => r.articleType === 'faq' ? 'FAQ' : '文档' },
    { key: 'status', header: '状态', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', header: '创建时间', render: (r) => new Date(r.createdAt).toLocaleString('zh-CN') },
    {
      key: 'actions', header: '操作', render: (r) => (
        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>编辑</Button>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Input placeholder="搜索标题..." value={searchTitle} onChange={(e) => { setSearchTitle(e.target.value); setPage(0); }} style={{ width: 240 }} />
        <Button size="sm" onClick={openCreate}>新建文章</Button>
      </div>
      <Table columns={columns} data={articles} keyExtractor={(r) => r.id} loading={loading} />
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>上一页</Button>
          <span style={{ fontSize: 13, color: '#6b7280' }}>{page + 1} / {totalPages}</span>
          <Button size="sm" variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>下一页</Button>
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? '编辑文章' : '新建文章'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 500 }}>
          <Input label="标题" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
              <select value={articleType} onChange={(e) => setArticleType(e.target.value as 'faq' | 'document')} style={{ marginLeft: 4, padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db' }}>
                <option value="faq">FAQ</option>
                <option value="document">文档</option>
              </select>
            </label>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
              <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'enabled')} style={{ marginLeft: 4, padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db' }}>
                <option value="draft">草稿</option>
                <option value="enabled">已启用</option>
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>内容</label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          <Input label="关键词（逗号分隔）" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          <Button onClick={handleSave} loading={saving}>{editItem ? '保存' : '创建'}</Button>
        </div>
      </Modal>
    </Card>
  );
}
