import { useEffect, useState } from 'react';
import api from '../lib/api';

const LANDING_SECTION_TYPES = [
  'hero', 'logos', 'services', 'about', 'metrics', 'influencer_highlight',
  'testimonials', 'case_studies', 'cta', 'footer_cta',
];
const LANDING_BLOCK_TYPES = [
  'headline', 'subheadline', 'paragraph', 'cta', 'image', 'video',
  'logo_grid', 'icon_list', 'counter',
];
const LAYOUT_VARIANTS = ['default', 'left-image', 'right-image', 'centered', 'split'];
const ANIMATION_TYPES = ['none', 'fade', 'slideUp', 'slideLeft', 'slideRight', 'zoom', 'stagger'];
const ANIMATION_TRIGGERS = ['onLoad', 'onScroll'];

/** Compress image to under maxBytes so it fits PHP default 2M limit. Returns a new File. */
function compressImageForUpload(file, maxBytes = 1.5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 1920;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const mime = file.type || 'image/jpeg';
      let quality = 0.88;
      const tryBlob = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }
            if (blob.size <= maxBytes || quality <= 0.3) {
              resolve(new File([blob], file.name, { type: blob.type, lastModified: Date.now() }));
              return;
            }
            quality -= 0.15;
            tryBlob();
          },
          mime,
          quality
        );
      };
      tryBlob();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

export function LandingBuilder() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateDetail, setTemplateDetail] = useState(null);
  const [sectionModal, setSectionModal] = useState(null);
  const [blockModal, setBlockModal] = useState(null);
  const [mediaPicker, setMediaPicker] = useState(null);

  const fetchTemplates = () => {
    api
      .get('/admin/landing-templates')
      .then(({ data }) => setTemplates(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load templates'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplateDetail = (templateId) => {
    if (!templateId) return;
    api
      .get(`/admin/landing-templates/${templateId}`)
      .then(({ data }) => setTemplateDetail(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load template'));
  };

  useEffect(() => {
    if (selectedTemplate) fetchTemplateDetail(selectedTemplate.id);
    else setTemplateDetail(null);
  }, [selectedTemplate?.id]);

  const handleActivate = async (template) => {
    try {
      await api.post(`/admin/landing-templates/${template.id}/activate`);
      fetchTemplates();
      if (selectedTemplate?.id === template.id) setTemplateDetail((d) => (d ? { ...d, is_active: true } : null));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate');
    }
  };

  const addSection = () => {
    const template = templateDetail || selectedTemplate;
    if (!template) return;
    setSectionModal({
      action: 'add',
      landing_template_id: template.id,
      type: 'hero',
      layout_variant: 'default',
      is_active: true,
      sort_order: (templateDetail?.sections?.length ?? 0),
    });
  };

  const editSection = (sec) => {
    setSectionModal({ action: 'edit', ...sec });
  };

  const saveSection = async (payload) => {
    const template = templateDetail || selectedTemplate;
    try {
      if (sectionModal.action === 'add') {
        await api.post(`/admin/landing-templates/${template.id}/sections`, payload);
      } else {
        await api.put(`/admin/landing-sections/${sectionModal.id}`, payload);
      }
      fetchTemplateDetail(template.id);
      setSectionModal(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save section');
    }
  };

  const deleteSection = async (secId) => {
    if (!confirm('Delete this section and all its blocks?')) return;
    try {
      await api.delete(`/admin/landing-sections/${secId}`);
      fetchTemplateDetail(selectedTemplate?.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const reorderSections = async (sectionIds) => {
    try {
      await api.post('/admin/landing-sections/reorder', { section_ids: sectionIds });
      fetchTemplateDetail(selectedTemplate?.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reorder');
    }
  };

  const moveSection = (index, dir) => {
    const sections = templateDetail?.sections ?? [];
    const next = [...sections];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    reorderSections(next.map((s) => s.id));
  };

  const addBlock = (section) => {
    setBlockModal({
      action: 'add',
      section,
      type: 'headline',
      content: {},
      media_id: null,
      aspect_ratio: '',
      alignment: 'left',
      object_fit: 'cover',
      animation_config: { type: 'fade', delay: 0, duration: 0.5, trigger: 'onScroll' },
      sort_order: (section.blocks?.length ?? 0),
    });
  };

  const editBlock = (section, block) => {
    setBlockModal({
      action: 'edit',
      section,
      ...block,
      animation_config: block.animation_config || { type: 'fade', delay: 0, duration: 0.5, trigger: 'onScroll' },
    });
  };

  const saveBlock = async (payload) => {
    try {
      if (blockModal.action === 'add') {
        await api.post(`/admin/landing-sections/${blockModal.section.id}/blocks`, payload);
      } else {
        await api.put(`/admin/landing-blocks/${blockModal.id}`, payload);
      }
      fetchTemplateDetail(selectedTemplate?.id);
      setBlockModal(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save block');
    }
  };

  const deleteBlock = async (blockId) => {
    if (!confirm('Delete this block?')) return;
    try {
      await api.delete(`/admin/landing-blocks/${blockId}`);
      fetchTemplateDetail(selectedTemplate?.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const moveBlock = (section, index, dir) => {
    const blocks = section.blocks ?? [];
    const next = [...blocks];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    api
      .post('/admin/landing-blocks/reorder', { block_ids: next.map((b) => b.id) })
      .then(() => fetchTemplateDetail(selectedTemplate?.id))
      .catch((err) => setError(err.response?.data?.message || 'Failed to reorder'));
  };

  const openMediaPicker = (onSelect) => setMediaPicker({ onSelect });
  const closeMediaPicker = () => setMediaPicker(null);

  const websiteBase = import.meta.env.VITE_WEBSITE_URL || `${window.location.origin.replace(/:\d+$/, '')}:5174`;
  const previewUrl = websiteBase;

  if (loading) return <div className="p-8 text-slate-500">Loading…</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Landing Page Builder</h1>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-800"
        >
          Preview on website
        </a>
      </div>
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Template selection */}
      <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Templates</h2>
        <p className="text-slate-600 text-sm mb-4">
          Select one template as active (shown on the public site). Edit any template to manage sections and content.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`border rounded-xl p-4 ${
                selectedTemplate?.id === t.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-semibold text-slate-800">{t.name}</span>
                {t.is_active && (
                  <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">Active</span>
                )}
              </div>
              <p className="text-slate-500 text-xs mb-3 line-clamp-2">{t.description || t.slug}</p>
              <div className="flex flex-wrap gap-2">
                {!t.is_active && (
                  <button
                    type="button"
                    onClick={() => handleActivate(t)}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Activate
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(t)}
                  className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {selectedTemplate?.id === t.id ? 'Editing' : 'Edit'}
                </button>
              </div>
            </div>
          ))}
        </div>
        {templates.length === 0 && (
          <p className="text-slate-500 text-sm">No templates. Run the landing seeder.</p>
        )}
      </div>

      {/* Section & block editor for selected template */}
      {selectedTemplate && templateDetail && (
        <div className="bg-white rounded-xl shadow border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Sections: {templateDetail.name}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Close editor
              </button>
              <button
                type="button"
                onClick={addSection}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
              >
                Add section
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {(templateDetail.sections || []).length === 0 && (
              <p className="text-slate-500 text-sm">No sections. Add one above.</p>
            )}
            {(templateDetail.sections || []).map((sec, idx) => (
              <div key={sec.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{sec.type}</span>
                    <span className="text-slate-500 text-sm">({sec.layout_variant})</span>
                    {!sec.is_active && (
                      <span className="text-amber-600 text-xs">Hidden</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSection(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(idx, 1)}
                      disabled={idx === (templateDetail.sections?.length ?? 0) - 1}
                      className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => editSection(sec)}
                      className="px-2 py-1 text-sm text-indigo-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSection(sec.id)}
                      className="px-2 py-1 text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 pl-2 border-l-2 border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-slate-600 text-sm">Blocks</span>
                    <button
                      type="button"
                      onClick={() => addBlock(sec)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      + Add block
                    </button>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {(sec.blocks || []).map((blk, bIdx) => (
                      <li key={blk.id} className="flex items-center gap-2 text-slate-700">
                        <span>{blk.type}</span>
                        <button
                          type="button"
                          onClick={() => moveBlock(sec, bIdx, -1)}
                          disabled={bIdx === 0}
                          className="text-slate-400 hover:text-slate-600 disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBlock(sec, bIdx, 1)}
                          disabled={bIdx === (sec.blocks?.length ?? 0) - 1}
                          className="text-slate-400 hover:text-slate-600 disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => editBlock(sec, blk)}
                          className="text-indigo-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBlock(blk.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                    {(sec.blocks || []).length === 0 && (
                      <li className="text-slate-500">No blocks</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sectionModal && (
        <LandingSectionModal
          initial={sectionModal}
          onSave={saveSection}
          onClose={() => setSectionModal(null)}
          onOpenMediaPicker={openMediaPicker}
        />
      )}
      {blockModal && (
        <LandingBlockModal
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

function LandingSectionModal({ initial, onSave, onClose, onOpenMediaPicker }) {
  const [type, setType] = useState(initial.type ?? 'hero');
  const [layout_variant, setLayoutVariant] = useState(initial.layout_variant ?? 'default');
  const [is_active, setIsActive] = useState(initial.is_active ?? true);
  const [sort_order, setSortOrder] = useState(initial.sort_order ?? 0);
  const [background_media_id, setBackgroundMediaId] = useState(initial.settings?.background_media_id ?? null);
  const [background_position, setBackgroundPosition] = useState(initial.settings?.background_position ?? 'center');
  const [background_size, setBackgroundSize] = useState(initial.settings?.background_size ?? 'cover');
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    onSave({
      type,
      layout_variant,
      is_active,
      sort_order,
      settings: {
        ...(initial.settings || {}),
        background_media_id: background_media_id || null,
        background_position: background_position || 'center',
        background_size: background_size || 'cover',
      },
    }).finally(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {initial.action === 'add' ? 'Add section' : 'Edit section'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              {LANDING_SECTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Layout variant</label>
            <select
              value={layout_variant}
              onChange={(e) => setLayoutVariant(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              {LAYOUT_VARIANTS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Background image</label>
            <p className="text-xs text-slate-500 mb-1">Optional. Shown behind this section on the public site.</p>
            <div className="flex gap-2 items-center flex-wrap">
              {background_media_id ? (
                <>
                  <span className="text-sm text-slate-600">ID: {background_media_id}</span>
                  <button
                    type="button"
                    onClick={() => onOpenMediaPicker?.((m) => setBackgroundMediaId(m?.id ?? null))}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackgroundMediaId(null)}
                    className="text-sm text-slate-500 hover:underline"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenMediaPicker?.((m) => setBackgroundMediaId(m?.id ?? null))}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Pick from library
                </button>
              )}
            </div>
            {background_media_id && (
              <div className="grid grid-cols-2 gap-4 pl-2 border-l-2 border-slate-200">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Background position</label>
                  <select
                    value={background_position}
                    onChange={(e) => setBackgroundPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="top left">Top left</option>
                    <option value="top right">Top right</option>
                    <option value="bottom left">Bottom left</option>
                    <option value="bottom right">Bottom right</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Background fit</label>
                  <select
                    value={background_size}
                    onChange={(e) => setBackgroundSize(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="cover">Cover (fill section)</option>
                    <option value="contain">Contain (fit inside)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={is_active}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-slate-700">Visible on public page</span>
          </label>
          {initial.action === 'add' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sort order</label>
              <input
                type="number"
                min={0}
                value={sort_order}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LandingBlockModal({ initial, onSave, onClose, onOpenMediaPicker }) {
  const [type, setType] = useState(initial.type ?? 'headline');
  const [content, setContent] = useState(
    typeof initial.content === 'object'
      ? JSON.stringify(initial.content || {}, null, 2)
      : (initial.content || '{}')
  );
  const [media_id, setMediaId] = useState(initial.media_id ?? '');
  const [aspect_ratio, setAspectRatio] = useState(initial.aspect_ratio ?? '');
  const [alignment, setAlignment] = useState(initial.alignment ?? 'left');
  const [object_fit, setObjectFit] = useState(initial.object_fit ?? 'cover');
  const [object_position, setObjectPosition] = useState(initial.content?.object_position ?? 'center');
  const [max_width, setMaxWidth] = useState(initial.content?.max_width ?? 'full');
  const [animation_config, setAnimationConfig] = useState(
    typeof initial.animation_config === 'object'
      ? {
          type: initial.animation_config?.type ?? 'fade',
          delay: initial.animation_config?.delay ?? 0,
          duration: initial.animation_config?.duration ?? 0.5,
          trigger: initial.animation_config?.trigger ?? 'onScroll',
        }
      : { type: 'fade', delay: 0, duration: 0.5, trigger: 'onScroll' }
  );
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
    const isImageOrVideo = type === 'image' || type === 'video';
    if (isImageOrVideo) {
      contentObj.object_position = object_position || 'center';
      contentObj.max_width = max_width || 'full';
    }
    setSaving(true);
    onSave({
      type,
      content: contentObj,
      media_id: media_id ? parseInt(media_id, 10) : null,
      aspect_ratio: aspect_ratio || null,
      alignment: alignment || null,
      object_fit: object_fit || null,
      animation_config,
      sort_order,
    }).finally(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          {initial.action === 'add' ? 'Add block' : 'Edit block'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              {LANDING_BLOCK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content (JSON)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
            />
            {contentError && <p className="text-red-600 text-sm mt-1">{contentError}</p>}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <label className="block text-sm font-medium text-slate-700">Media</label>
            <input
              type="number"
              value={media_id}
              onChange={(e) => setMediaId(e.target.value)}
              className="w-24 px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="ID"
            />
            <button
              type="button"
              onClick={() => onOpenMediaPicker((m) => setMediaId(String(m.id)))}
              className="text-sm text-indigo-600 hover:underline"
            >
              Pick from library
            </button>
          </div>
          {(type === 'image' || type === 'video') && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
              <p className="text-sm font-medium text-slate-800">Image / media display – align and fit to template</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alignment</label>
                  <select
                    value={alignment}
                    onChange={(e) => setAlignment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-0.5">Position in section</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fit to template</label>
                  <select
                    value={object_fit}
                    onChange={(e) => setObjectFit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="cover">Cover (fill area)</option>
                    <option value="contain">Contain (fit inside)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-0.5">How image fills the box</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aspect ratio</label>
                  <select
                    value={aspect_ratio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Auto</option>
                    <option value="16:9">16:9</option>
                    <option value="1:1">1:1</option>
                    <option value="4:5">4:5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Focus (object position)</label>
                  <select
                    value={object_position}
                    onChange={(e) => setObjectPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                    <option value="top left">Top left</option>
                    <option value="top right">Top right</option>
                    <option value="bottom left">Bottom left</option>
                    <option value="bottom right">Bottom right</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-0.5">Which part of image is visible with cover</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max width in template</label>
                  <select
                    value={max_width}
                    onChange={(e) => setMaxWidth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="full">Full width</option>
                    <option value="4xl">Large (max 56rem)</option>
                    <option value="3xl">Medium (max 48rem)</option>
                    <option value="2xl">Small (max 42rem)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          {type !== 'image' && type !== 'video' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aspect ratio</label>
                  <select
                    value={aspect_ratio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">—</option>
                    <option value="16:9">16:9</option>
                    <option value="1:1">1:1</option>
                    <option value="4:5">4:5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alignment</label>
                  <select
                    value={alignment}
                    onChange={(e) => setAlignment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Object fit</label>
                <select
                  value={object_fit}
                  onChange={(e) => setObjectFit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                </select>
              </div>
            </>
          )}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Animation</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Type</label>
                <select
                  value={animation_config.type}
                  onChange={(e) => setAnimationConfig((c) => ({ ...c, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  {ANIMATION_TYPES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Trigger</label>
                <select
                  value={animation_config.trigger}
                  onChange={(e) => setAnimationConfig((c) => ({ ...c, trigger: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  {ANIMATION_TRIGGERS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Delay (s)</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={animation_config.delay}
                  onChange={(e) =>
                    setAnimationConfig((c) => ({ ...c, delay: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Duration (s)</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={animation_config.duration}
                  onChange={(e) =>
                    setAnimationConfig((c) => ({ ...c, duration: parseFloat(e.target.value) || 0.5 }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
          {initial.action === 'add' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sort order</label>
              <input
                type="number"
                min={0}
                value={sort_order}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MediaLibraryModal({ onSelect, onClose }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [uploadError, setUploadError] = useState('');

  const fetchList = () => {
    setLoading(true);
    api
      .get('/admin/media', { params: { per_page: 48, search } })
      .then((res) => {
        const d = res?.data;
        setList(Array.isArray(d) ? d : (d?.data ?? []));
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, [search]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    e.target.value = '';
    let fileToSend = file;
    const maxSize = 1.5 * 1024 * 1024;
    if (file.type.startsWith('image/') && file.size > maxSize && !file.type.includes('svg')) {
      try {
        fileToSend = await compressImageForUpload(file, maxSize);
      } catch (err) {
        setUploadError('Image too large and compression failed. Try a smaller image or increase PHP limits.');
        setUploading(false);
        return;
      }
    }
    const formData = new FormData();
    formData.append('file', fileToSend);
    const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const token = localStorage.getItem('vsparkz_token');
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const res = await fetch(`${baseURL}/admin/media`, {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        let errMsg = data?.message || data?.errors?.file?.[0] || 'Upload failed';
        if (data?.diagnostic) {
          errMsg += ` [PHP: upload_max=${data.diagnostic.php_upload_max_filesize}, post_max=${data.diagnostic.php_post_max_size}. Edit: ${data.diagnostic.php_ini_loaded_file || 'php.ini'}]`;
        }
        setUploadError(errMsg);
        return;
      }
      fetchList();
      if (data?.id && onSelect) onSelect(data);
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Select or upload media</h3>
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg"
          />
          <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm cursor-pointer hover:bg-indigo-700 disabled:opacity-50">
            <input
              type="file"
              accept="image/*,video/*,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.webm"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            {uploading ? 'Uploading…' : 'Upload new (max 50MB)'}
          </label>
        </div>
        {uploadError && (
          <p className="text-red-600 text-sm mb-2">{uploadError}</p>
        )}
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 overflow-y-auto flex-1">
            {list.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m)}
                className="rounded-lg border border-slate-200 overflow-hidden hover:border-indigo-500 focus:border-indigo-500 text-left"
              >
                {m.mime_type?.startsWith('image/') ? (
                  <img src={m.url} alt={m.filename} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-slate-100 flex items-center justify-center text-slate-500 text-xs truncate p-1">
                    {m.filename}
                  </div>
                )}
                <span className="block text-xs text-slate-600 truncate p-1">{m.filename}</span>
              </button>
            ))}
            {list.length === 0 && (
              <p className="col-span-full text-slate-500 text-sm">No media found.</p>
            )}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
