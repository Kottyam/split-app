import { ArrowLeft, Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import AppSectionHeader from '@/components/AppSectionHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead, subscribeToNotifications, type KharchaNotification } from '@/lib/notifications';
import { refreshAutomaticNotifications } from '@/lib/notificationEngine';

export default function Notifications() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<KharchaNotification[]>(() => getNotifications());

  useEffect(() => {
    refreshAutomaticNotifications();
    setNotifications(getNotifications());
    return subscribeToNotifications(() => setNotifications(getNotifications()));
  }, []);

  const unread = notifications.filter(item => !item.read).length;

  return <div className="min-h-screen bg-kharcha-cream px-3 pb-12 pt-4 sm:px-4 sm:pt-6"><div className="mx-auto max-w-3xl space-y-3"><AppSectionHeader
        title={t('notificationsTitle' as any)}
        onBack={() => navigate('/')}
        backLabel={t('backToKharcha' as any)}
        actions={unread > 0 ? <Button variant="outline" size="sm" onClick={markAllNotificationsRead} className="w-full"><CheckCheck size={15} className="mr-1" />{t('markAllRead' as any)}</Button> : undefined}
      />{notifications.length === 0 ? <Card className="border-2 border-dashed border-[#16834b] bg-[#f2fbf3] p-8 text-center"><Bell className="mx-auto mb-3 text-[#16834b]" size={30} /><p className="font-bold text-gray-600">{t('noNotifications' as any)}</p></Card> : <div className="space-y-2">{notifications.map(item => <Card key={item.id} className={`rounded-2xl border border-[#d7e4dc] bg-white p-3 shadow-sm ${item.read ? 'opacity-75' : 'ring-1 ring-[#b9ddc9]'}`}><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#dff1e5] text-[#16834b]"><Bell size={18} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-black text-kharcha-navy">{item.title}</p>{!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#e87817]" aria-label={t('unread' as any)} />}</div><p className="mt-1 text-sm text-gray-600">{item.message}</p><div className="mt-2 flex items-center justify-between gap-2"><p className="text-xs font-bold text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>{item.path && <Button size="sm" variant="outline" className="shrink-0 rounded-lg font-black" onClick={() => { markNotificationRead(item.id); navigate(item.path!); }}>{item.actionLabel || 'Open'}<ChevronRight size={14} className="ml-1" /></Button>}</div></div></div></Card>)}</div>}</div></div>;
}
