import { useState } from 'react';
import { XIcon, TruckIcon, PackageIcon, CheckIcon, RotateCcwIcon } from './Icons';
import type { Order } from '../store/types';

interface OrderTrackingModalProps {
  onClose: () => void;
  orders: Order[];
  onRequestReturn: (orderId: string, reason: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  preparing: 'Hazırlanıyor',
  shipped: 'Kargoya Verildi',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
  return_requested: 'İade Talep Edildi',
  returned: 'İade Tamamlandı',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  confirmed: 'text-blue-600 bg-blue-50',
  preparing: 'text-orange-600 bg-orange-50',
  shipped: 'text-purple-600 bg-purple-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
  return_requested: 'text-orange-600 bg-orange-50',
  returned: 'text-gray-600 bg-gray-50',
};

export default function OrderTrackingModal({ onClose, orders, onRequestReturn }: OrderTrackingModalProps) {
  const [trackingCode, setTrackingCode] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnSubmitted, setReturnSubmitted] = useState(false);

  const handleSearch = () => {
    const order = orders.find(
      (o) =>
        o.trackingCode === trackingCode.toUpperCase() ||
        o.id.toUpperCase() === trackingCode.toUpperCase()
    );
    if (order) {
      setFoundOrder(order);
      setNotFound(false);
    } else {
      setFoundOrder(null);
      setNotFound(true);
    }
  };

  const handleReturnRequest = () => {
    if (!foundOrder || !returnReason.trim()) return;
    onRequestReturn(foundOrder.id, returnReason);
    setReturnSubmitted(true);
    setShowReturnForm(false);
  };

  const steps = ['confirmed', 'preparing', 'shipped', 'delivered'];
  const currentStepIdx = foundOrder ? steps.indexOf(foundOrder.status) : -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-medium tracking-widest uppercase flex items-center gap-2">
            <TruckIcon size={16} />
            Sipariş Takibi
          </h2>
          <button onClick={onClose} className="hover:opacity-60">
            <XIcon size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 border border-gray-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-gray-400"
              placeholder="Takip kodunuzu girin (Örn: MDRAB12CD34)"
            />
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 bg-gray-900 text-white text-xs font-medium tracking-widest uppercase hover:bg-gray-700 transition-colors"
            >
              Sorgula
            </button>
          </div>

          {notFound && (
            <div className="text-center py-6 text-sm text-gray-400">
              Bu takip koduna ait sipariş bulunamadı.
            </div>
          )}

          {foundOrder && (
            <div>
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] text-gray-400 tracking-widest uppercase mb-1">Sipariş No</p>
                  <p className="font-mono text-sm font-medium">{foundOrder.trackingCode}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1.5 ${STATUS_COLORS[foundOrder.status]}`}>
                  {STATUS_LABELS[foundOrder.status]}
                </span>
              </div>

              {/* Progress Tracker */}
              {!['cancelled', 'return_requested', 'returned'].includes(foundOrder.status) && (
                <div className="relative mb-8">
                  <div className="flex justify-between relative">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100" />
                    <div
                      className="absolute top-4 left-0 h-0.5 bg-gray-900 transition-all duration-500"
                      style={{ width: `${Math.max(0, (currentStepIdx / (steps.length - 1)) * 100)}%` }}
                    />
                    {steps.map((step, i) => (
                      <div key={step} className="flex flex-col items-center relative">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-colors ${
                            i <= currentStepIdx
                              ? 'bg-gray-900 border-gray-900 text-white'
                              : 'bg-white border-gray-200 text-gray-300'
                          }`}
                        >
                          {step === 'confirmed' && <CheckIcon size={14} />}
                          {step === 'preparing' && <PackageIcon size={14} />}
                          {step === 'shipped' && <TruckIcon size={14} />}
                          {step === 'delivered' && <CheckIcon size={14} />}
                        </div>
                        <p className={`text-[9px] mt-2 font-medium tracking-widest text-center max-w-16 ${
                          i <= currentStepIdx ? 'text-gray-900' : 'text-gray-300'
                        }`}>
                          {STATUS_LABELS[step]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Details */}
              <div className="bg-gray-50 p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Sipariş Tarihi</span>
                  <span>{new Date(foundOrder.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Ödeme</span>
                  <span>{foundOrder.paymentMethod === 'bank_transfer' ? 'Havale/EFT' : 'Kredi Kartı'}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Toplam</span>
                  <span>{foundOrder.total.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>

              {/* Items */}
              <div className="mb-4">
                <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-3">Ürünler</p>
                <div className="space-y-2">
                  {foundOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-12 bg-gray-100 overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{item.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {[item.color, item.size].filter(Boolean).join(' / ')} × {item.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-medium">{(item.price * item.quantity).toLocaleString('tr-TR')} ₺</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulated Notifications */}
              <div className="border border-blue-100 bg-blue-50 p-4 mb-4">
                <p className="text-[10px] font-medium tracking-widest uppercase text-blue-600 mb-2">📬 Bildirimler</p>
                <div className="space-y-1.5 text-xs text-blue-700">
                  <p>✉️ Sipariş onay e-postası {foundOrder.customer.email} adresine gönderildi.</p>
                  {currentStepIdx >= 2 && (
                    <p>📱 Kargo SMS bildirimi {foundOrder.customer.phone} numarasına iletildi.</p>
                  )}
                  {currentStepIdx >= 3 && (
                    <p>✅ Teslimat tamamlandı bildirimi gönderildi.</p>
                  )}
                </div>
              </div>

              {/* Return Request */}
              {foundOrder.status === 'delivered' && !returnSubmitted && (
                <div>
                  {!showReturnForm ? (
                    <button
                      onClick={() => setShowReturnForm(true)}
                      className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      <RotateCcwIcon size={14} />
                      İade / Değişim Talep Et
                    </button>
                  ) : (
                    <div className="border border-gray-200 p-4">
                      <p className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-3">
                        İade/Değişim Talebi
                      </p>
                      <textarea
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        rows={3}
                        placeholder="İade/değişim nedeninizi yazın..."
                        className="w-full border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-gray-400 resize-none mb-3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleReturnRequest}
                          className="flex-1 bg-gray-900 text-white py-2 text-xs font-medium tracking-widest uppercase hover:bg-gray-700 transition-colors"
                        >
                          Gönder
                        </button>
                        <button
                          onClick={() => setShowReturnForm(false)}
                          className="px-4 border border-gray-200 text-xs hover:bg-gray-50"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {returnSubmitted && (
                <p className="text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-2">
                  ✓ İade talebiniz alındı. En kısa sürede iletişime geçeceğiz.
                </p>
              )}
              {foundOrder.status === 'return_requested' && (
                <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 px-3 py-2">
                  İade talebiniz inceleniyor. En kısa sürede size dönüş yapacağız.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
