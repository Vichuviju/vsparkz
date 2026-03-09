const CARDS = [
  { id: 'meta-ads', title: 'Meta Ads', desc: 'Connect Facebook & Instagram ads. Configure in System Settings.', status: 'Available' },
  { id: 'whatsapp', title: 'WhatsApp Business API', desc: 'Messaging and notifications. Configure in System Settings.', status: 'Available' },
  { id: 'ai-content', title: 'AI Content Assistant', desc: 'Content generation and suggestions. Configure in System Settings.', status: 'Available' },
  { id: 'automation', title: 'Automation Workflows', desc: 'Trigger-based workflows. Use the Automation section in the sidebar.', status: 'Available' },
];

export function Integrations() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold dark:text-text-primary text-slate-800 mb-2">Integrations</h1>
      <p className="text-text-muted dark:text-slate-600 mb-6">Connect third-party services. Configure credentials and options in System Settings.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARDS.map((card) => (
          <div key={card.id} className="bg-white dark:bg-navy-800/80 rounded-xl shadow border border-slate-200 dark:border-navy-700 p-6">
            <h2 className="font-semibold dark:text-text-primary text-slate-800 mb-2">{card.title}</h2>
            <p className="text-text-muted text-sm mb-4">{card.desc}</p>
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent">{card.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Integrations;
