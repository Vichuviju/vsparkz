import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

const SECTION_TYPES = ['hero', 'grid', 'carousel', 'cta', 'stats', 'testimonial', 'case_study_preview', 'video', 'feature_highlights', 'metrics', 'timeline'];
const BLOCK_TYPES = ['headline', 'text', 'cta', 'media', 'metrics', 'video'];

export function PageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageForm, setPageForm] = useState({ slug: '', title: '', meta_title: '', meta_description: '', meta_keywords: '', og_image: '', is_published: true });
  const [savingPage, setSavingPage] = useState(false);
  const [sectionModal, setSectionModal] = useState(null);
  const [blockModal, setBlockModal] = useState(null);
  const [mediaPicker, setMediaPicker] = useState(null);

  const fetchPage = () => {
    api.get(`/admin/pages/${id}`).then(({ data }) => {
      setPage(data);
      setPageForm({
        slug: data.slug ?? '',
        title: data.title ?? '',
        meta_title: data.meta_title ?? '',
        meta_description: data.meta_description ?? '',
        meta_keywords: data.meta_keywords ?? '',
        og_image: data.og_image ?? '',
        is_published: data.is_published ?? true,
      });
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load page')).finally(() => setLoading(false));
  };

  const fetchSections = () => {
    api.get(`/admin/pages/${id}/sections`).then(({ data }) => setSections(Array.isArray(data) ? data : [])).catch(() => setSections([]));
  };

  useEffect(() => {
    fetchPage();
  }, [id]);
  useEffect(() => {
    if (page) fetchSections();
  }, [page?.id]);

  const savePageMeta = async (e) => {
    e.preventDefault();
    setSavingPage(true);
    try {
      await api.put(`/admin/pages/${id}`, pageForm);
      setPage((p) => ({ ...p, ...pageForm }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSavingPage(false);
    }
  };

  const addSection = () => {
    setSectionModal({ action: 'add', type: 'hero', layout: 'default', is_visible: true, sort_order: sections.length });
  };
  const editSection = (sec) => {
    setSectionModal({ action: 'edit', ...sec });
  };
  const saveSection = async (payload) => {
    try {
      if (sectionModal.action === 'add') {
        await api.post(`/admin/pages/${id}/sections`, payload);
      } else {
        await api.put(`/admin/page-sections/${sectionModal.id}`, payload);
      }
      fetchSections();
      setSectionModal(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save section');
    }
  };
  const deleteSection = async (secId) => {
    if (!confirm('Delete this section and all its blocks?')) return;
    try {
      await api.delete(`/admin/page-sections/${secId}`);
      fetchSections();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const reorderSections = async (sectionIds) => {
    try {
      await api.post('/admin/page-sections/reorder', { section_ids: sectionIds });
      fetchSections();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reorder');
    }
  };
  const moveSection = (index, dir) => {
    const next = [...sections];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    reorderSections(next.map((s) => s.id));
  };

  const addBlock = (section) => {
    setBlockModal({ action: 'add', section, type: 'headline', content: {}, sort_order: (section.blocks?.length ?? 0) });
  };
  const editBlock = (section, block) => {
    setBlockModal({ action: 'edit', section, ...block });
  };
  const saveBlock = async (payload) => {
    try {
      if (blockModal.action === 'add') {
        await api.post(`/admin/page-sections/${blockModal.section.id}/blocks`, payload);
      } else {
        await api.put(`/admin/page-blocks/${blockModal.id}`, payload);
      }
      fetchSections();
      setBlockModal(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save block');
    }
  };
  const deleteBlock = async (blockId) => {
    if (!confirm('Delete this block?')) return;
    try {
      await api.delete(`/admin/page-blocks/${blockId}`);
      fetchSections();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openMediaPicker = (onSelect) => {
    setMediaPicker({ onSelect });
  };
  const closeMediaPicker = () => setMediaPicker(null);

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (error && !page) return <div className="p-8 text-red-600">{error}</div>;
  if (!page) return null;

  const websiteBase = import.meta.env.VITE_WEBSITE_URL || `${window.location.origin.replace(/:\d+$/, '')}:5174`;
  const publicUrl = `${websiteBase}/${page.slug === 'home' ? '' : page.slug}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/pages" className="text-slate-600 hover:text-slate-800">← Pages</Link>
        <h1 className="text-2xl font-bold text-slate-800">Edit: {page.title || page.slug}</h1>
      </div>
      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      <form onSubmit={savePageMeta} className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Page & SEO</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
            <input type="text" value={pageForm.slug} onChange={(e) => setPageForm((f) => ({ ...f, slug: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input type="text" value={pageForm.title} onChange={(e) => setPageForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Meta title</label>
          <input type="text" value={pageForm.meta_title} onChange={(e) => setPageForm((f) => ({ ...f, meta_title: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Meta description</label>
          <textarea value={pageForm.meta_description} onChange={(e) => setPageForm((f) => ({ ...f, meta_description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Meta keywords</label>
          <input type="text" value={pageForm.meta_keywords} onChange={(e) => setPageForm((f) => ({ ...f, meta_keywords: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">OG image URL</label>
          <input type="text" value={pageForm.og_image} onChange={(e) => setPageForm((f) => ({ ...f, og_image: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="/storage/..." />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={pageForm.is_published} onChange={(e) => setPageForm((f) => ({ ...f, is_published: e.target.checked }))} className="rounded" />
            <span className="text-sm text-slate-700">Published</span>
          </label>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">Preview on website</a>
        </div>
        <button type="submit" disabled={savingPage} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Save page</button>
      </form>

      <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Sections</h2>
          <button type="button" onClick={addSection} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Add section</button>
        </div>
        <div className="space-y-3">
          {sections.length === 0 && <p className="text-slate-500 text-sm">No sections yet. Add one to build the page.</p>}
          {sections.map((sec, idx) => (
            <div key={sec.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{sec.type}</span>
                  <span className="text-slate-500 text-sm">({sec.layout})</span>
                  {!sec.is_visible && <span className="text-amber-600 text-xs">Hidden</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40">↑</button>
                  <button type="button" onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1} className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40">↓</button>
                  <button type="button" onClick={() => editSection(sec)} className="px-2 py-1 text-sm text-indigo-600 hover:underline">Edit</button>
                  <button type="button" onClick={() => deleteSection(sec.id)} className="px-2 py-1 text-sm text-red-600 hover:underline">Delete</button>
                </div>
              </div>
              <div className="mt-3 pl-2 border-l-2 border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-slate-600 text-sm">Blocks</span>
                  <button type="button" onClick={() => addBlock(sec)} className="text-xs text-indigo-600 hover:underline">+ Add block</button>
                </div>
                <ul className="space-y-1 text-sm">
                  {(sec.blocks || []).map((blk) => (
                    <li key={blk.id} className="flex items-center gap-2 text-slate-700">
                      <span>{blk.type}</span>
                      <button type="button" onClick={() => editBlock(sec, blk)} className="text-indigo-600 hover:underline">Edit</button>
                      <button type="button" onClick={() => deleteBlock(blk.id)} className="text-red-600 hover:underline">Delete</button>
                    </li>
                  ))}
                  {(sec.blocks || []).length === 0 && <li className="text-slate-500">No blocks</li>}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {sectionModal && (
        <SectionModal
          initial={sectionModal}
          onSave={saveSection}
          onClose={() => setSectionModal(null)}
        />
      )}
      {blockModal && (
        <BlockModal
          initial={blockModal}
          onSave={saveBlock}
          onClose={() => setBlockModal(null)}
          onOpenMediaPicker={openMediaPicker}
        />
      )}
      {mediaPicker && (
        <MediaLibraryModal
          onSelect={(media) => {
            if (mediaPicker.onSelect) mediaPicker.onSelect(media);
            setMediaPicker(null);
          }}
          onClose={() => setMediaPicker(null)}
        />
      )}
    </div>
  );
}

function SectionModal({ initial, onSave, onClose }) {
  const [type, setType] = useState(initial.type ?? 'hero');
  const [layout, setLayout] = useState(initial.layout ?? 'default');
  const [is_visible, setIsVisible] = useState(initial.is_visible ?? true);
  const [sort_order, setSortOrder] = useState(initial.sort_order ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    onSave({ type, layout, is_visible, sort_order }).finally(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{initial.action === 'add' ? 'Add section' : 'Edit section'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
              {SECTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Layout</label>
            <input type="text" value={layout} onChange={(e) => setLayout(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="default" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={is_visible} onChange={(e) => setIsVisible(e.target.checked)} className="rounded" />
            <span className="text-sm text-slate-700">Visible</span>
          </label>
          {initial.action === 'add' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sort order</label>
              <input type="number" min={0} value={sort_order} onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Save</button>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BlockModal({ initial, onSave, onClose, onOpenMediaPicker }) {
  const [type, setType] = useState(initial.type ?? 'headline');
  const [content, setContent] = useState(typeof initial.content === 'object' ? JSON.stringify(initial.content || {}, null, 2) : (initial.content || '{}'));
  const [media_id, setMediaId] = useState(initial.media_id ?? '');
  const [aspect_ratio, setAspectRatio] = useState(initial.aspect_ratio ?? '');
  const [cta_config, setCtaConfig] = useState(typeof initial.cta_config === 'object' ? JSON.stringify(initial.cta_config || {}, null, 2) : (initial.cta_config || '{}'));
  const [sort_order, setSortOrder] = useState(initial.sort_order ?? 0);
  const [saving, setSaving] = useState(false);
  const [contentError, setContentError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    let contentObj = {};
    try {
      contentObj = JSON.parse(content || '{}');
    } catch {
      setContentError('Invalid JSON');
      return;
    }
    setContentError('');
    let ctaObj = {};
    try {
      ctaObj = JSON.parse(cta_config || '{}');
    } catch {
      ctaObj = {};
    }
    setSaving(true);
    onSave({
      type,
      content: contentObj,
      media_id: media_id ? parseInt(media_id, 10) : null,
      aspect_ratio: aspect_ratio || null,
      cta_config: ctaObj,
      sort_order,
    }).finally(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{initial.action === 'add' ? 'Add block' : 'Edit block'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
              {BLOCK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content (JSON)</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" />
            {contentError && <p className="text-red-600 text-sm mt-1">{contentError}</p>}
          </div>
          <div className="flex gap-2 items-center">
            <label className="block text-sm font-medium text-slate-700">Media ID</label>
            <input type="number" value={media_id} onChange={(e) => setMediaId(e.target.value)} className="w-24 px-3 py-2 border border-slate-300 rounded-lg" />
            <button type="button" onClick={() => onOpenMediaPicker((m) => setMediaId(String(m.id)))} className="text-sm text-indigo-600 hover:underline">Pick from library</button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Aspect ratio</label>
            <input type="text" value={aspect_ratio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="16:9, 1:1, 4:5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CTA config (JSON)</label>
            <textarea value={cta_config} onChange={(e) => setCtaConfig(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" />
          </div>
          {initial.action === 'add' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sort order</label>
              <input type="number" min={0} value={sort_order} onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Save</button>
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MediaLibraryModal({ onSelect, onClose }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/admin/media', { params: { per_page: 48, search } }).then((res) => {
      const d = res?.data;
      setList(Array.isArray(d) ? d : (d?.data ?? []));
    }).catch(() => setList([])).finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Select media</h3>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-4" />
        {loading ? <p className="text-slate-500">Loading…</p> : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 overflow-y-auto flex-1">
            {list.map((m) => (
              <button key={m.id} type="button" onClick={() => onSelect(m)} className="rounded-lg border border-slate-200 overflow-hidden hover:border-indigo-500 focus:border-indigo-500">
                {m.mime_type?.startsWith('image/') ? (
                  <img src={m.url} alt={m.filename} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-slate-100 flex items-center justify-center text-slate-500 text-xs truncate p-1">{m.filename}</div>
                )}
                <span className="block text-xs text-slate-600 truncate p-1">{m.filename}</span>
              </button>
            ))}
            {list.length === 0 && <p className="col-span-full text-slate-500 text-sm">No media found.</p>}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
        </div>
      </div>
    </div>
  );
}
