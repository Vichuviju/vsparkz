export function SubscriptionExpiredScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="max-w-md w-full rounded-2xl border border-amber-500/50 bg-navy-900 p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-amber-400 mb-2">Subscription Expired</h1>
        <p className="text-text-muted mb-6">
          Please renew your subscription to continue. Contact support for assistance.
        </p>
        <a href="mailto:support@vsparkzdigital.com" className="inline-block px-6 py-3 rounded-vsparkz bg-accent text-white font-medium">
          Contact Support
        </a>
      </div>
    </div>
  );
}
