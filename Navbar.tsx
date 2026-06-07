import { useState } from 'react';
import { XIcon, TrashIcon, PlusIcon, MinusIcon, TagIcon } from './Icons';
import type { CartItem, Coupon } from '../store/types';

interface CartDrawerProps {
  cart: CartItem[];
  cartTotal: number;
  onClose: () => void;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onCheckout: (coupon: Coupon | null) => void;
  validateCoupon: (code: string, subtotal: number) => Coupon | null;
}

export default function CartDrawer({
  cart,
  cartTotal,
  onClose,
  onRemove,
  onUpdateQty,
  onCheckout,
  validateCoupon,
}: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  const discount = appliedCoupon ? Math.round(cartTotal * (appliedCoupon.discount / 100)) : 0;
  const total = cartTotal - discount;

  const handleCoupon = () => {
    if (!couponCode.trim()) return;
    const coupon = validateCoupon(couponCode.trim(), cartTotal);
    if (coupon) {
      setAppliedCoupon(coupon);
      setCouponError('');
    } else {
      setCouponError('Geçersiz kupon veya minimum tutar sağlanamadı.');
      setAppliedCoupon(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-medium tracking-widest uppercase">
            Sepetim ({cart.reduce((s, i) => s + i.quantity, 0)} ürün)
          </h2>
          <button onClick={onClose} className="hover:opacity-60 transition-opacity">
            <XIcon size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 border border-gray-200 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">Sepetiniz boş</p>
              <button
                onClick={onClose}
                className="mt-4 text-xs font-medium tracking-widest uppercase text-gray-900 underline underline-offset-4"
              >
                Alışverişe Başla
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 px-6 py-4">
                  <div className="w-20 h-24 bg-gray-50 flex-shrink-0 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400 mb-2">
                      {[item.color, item.size].filter(Boolean).join(' / ')}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {(item.price * item.quantity).toLocaleString('tr-TR')} ₺
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-gray-100">
                        <button
                          onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                        >
                          <MinusIcon size={12} />
                        </button>
                        <span className="w-8 text-center text-xs">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                        >
                          <PlusIcon size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors ml-auto"
                        aria-label="Kaldır"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-4">
            {/* Coupon */}
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Kupon kodu"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 text-xs focus:outline-none focus:border-gray-400 uppercase tracking-widest"
                  />
                </div>
                <button
                  onClick={handleCoupon}
                  className="px-4 py-2.5 bg-gray-900 text-white text-xs font-medium tracking-widest hover:bg-gray-700 transition-colors"
                >
                  Uygula
                </button>
              </div>
              {couponError && (
                <p className="text-[11px] text-red-500 mt-1">{couponError}</p>
              )}
              {appliedCoupon && (
                <p className="text-[11px] text-green-600 mt-1">
                  ✓ %{appliedCoupon.discount} indirim uygulandı! -{discount.toLocaleString('tr-TR')} ₺
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Ara Toplam</span>
                <span>{cartTotal.toLocaleString('tr-TR')} ₺</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>İndirim</span>
                  <span>-{discount.toLocaleString('tr-TR')} ₺</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-500">
                <span>Kargo</span>
                <span className="text-green-600">Ücretsiz</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-100">
                <span>Toplam</span>
                <span>{total.toLocaleString('tr-TR')} ₺</span>
              </div>
            </div>

            <button
              onClick={() => onCheckout(appliedCoupon)}
              className="w-full bg-gray-900 text-white py-4 text-sm font-medium tracking-widest uppercase hover:bg-gray-700 transition-colors"
            >
              Ödemeye Geç
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
