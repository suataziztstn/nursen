import { useState } from 'react';
import { XIcon, CreditCardIcon, BankIcon, CheckIcon, PrinterIcon } from './Icons';
import type { CartItem, Coupon, Order, StoreSettings } from '../store/types';

type PlaceOrderData = Omit<Order, 'id' | 'trackingCode' | 'status' | 'createdAt' | 'updatedAt'>;

interface CheckoutModalProps {
  cart: CartItem[];
  cartTotal: number;
  appliedCoupon: Coupon | null;
  settings: StoreSettings;
  onClose: () => void;
  onPlaceOrder: (orderData: PlaceOrderData) => Order;
}

type Step = 'info' | 'payment' | 'confirm';

export default function CheckoutModal({
  cart,
  cartTotal,
  appliedCoupon,
  settings,
  onClose,
  onPlaceOrder,
}: CheckoutModalProps) {
  const [step, setStep] = useState<Step>('info');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer'>('credit_card');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const discount = appliedCoupon ? Math.round(cartTotal * (appliedCoupon.discount / 100)) : 0;
  const total = cartTotal - discount;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const [card, setCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  const validateInfo = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Ad Soyad gerekli';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Geçerli e-posta gerekli';
    if (!form.phone.trim()) e.phone = 'Telefon gerekli';
    if (!form.address.trim()) e.address = 'Adres gerekli';
    if (!form.city.trim()) e.city = 'Şehir gerekli';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateCard = () => {
    if (paymentMethod !== 'credit_card') return true;
    const e: Record<string, string> = {};
    if (card.number.replace(/\s/g, '').length < 16) e.cardNumber = 'Geçerli kart numarası girin';
    if (!card.name.trim()) e.cardName = 'Kart üzerindeki isim gerekli';
    if (!card.expiry.match(/^\d{2}\/\d{2}$/)) e.expiry = 'GG/YY formatında girin';
    if (card.cvv.length < 3) e.cvv = 'CVV gerekli';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextStep = () => {
    if (step === 'info') {
      if (validateInfo()) setStep('payment');
    } else if (step === 'payment') {
      if (validateCard()) setStep('confirm');
    }
  };

  const handlePlaceOrder = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));

    const order = onPlaceOrder({
      items: cart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        image: item.image,
      })),
      subtotal: cartTotal,
      discount,
      total,
      couponCode: appliedCoupon?.code,
      paymentMethod,
      paymentStatus: paymentMethod === 'bank_transfer' ? 'pending' : 'paid',
      customer: form,
    });

    setCompletedOrder(order);
    setProcessing(false);
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  if (completedOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-white w-full max-w-lg shadow-2xl animate-fade-in">
          {!showInvoice ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckIcon size={28} className="text-green-600" />
              </div>
              <h2 className="text-xl font-light text-gray-900 mb-2">Siparişiniz Alındı!</h2>
              <p className="text-sm text-gray-500 mb-5">
                Teşekkürler <strong>{completedOrder.customer.name}</strong>. Siparişiniz başarıyla oluşturuldu.
              </p>

              <div className="bg-gray-50 p-4 mb-5 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sipariş No</span>
                  <span className="font-mono font-medium text-gray-900">{completedOrder.id.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Takip Kodu</span>
                  <span className="font-mono font-bold text-gray-900 text-base tracking-widest">
                    {completedOrder.trackingCode}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Toplam</span>
                  <span className="font-semibold text-gray-900">{completedOrder.total.toLocaleString('tr-TR')} ₺</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ödeme</span>
                  <span className="text-gray-900">
                    {completedOrder.paymentMethod === 'bank_transfer' ? 'Havale/EFT' : 'Kredi Kartı'}
                  </span>
                </div>
                {completedOrder.paymentMethod === 'bank_transfer' && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                    <p className="font-medium text-gray-800">Havale Bilgileri:</p>
                    <p>Banka: {settings.bankName}</p>
                    <p>IBAN: {settings.iban}</p>
                    <p>Hesap Sahibi: {settings.accountHolder}</p>
                    <p className="text-orange-600 mt-1">
                      ⚠️ Havaleyi gönderdikten sonra {completedOrder.trackingCode} kodunu açıklamaya yazınız.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 p-3 mb-5 text-xs text-blue-700">
                📧 Sipariş detayları <strong>{completedOrder.customer.email}</strong> adresine gönderildi.
                <br />🚚 Tahmini teslimat: {settings.cargoDays} iş günü
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowInvoice(true)}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-200 py-3 text-xs font-medium tracking-widest uppercase hover:bg-gray-50 transition-colors"
                >
                  <PrinterIcon size={14} />
                  Faturayı Görüntüle
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-900 text-white py-3 text-xs font-medium tracking-widest uppercase hover:bg-gray-700 transition-colors"
                >
                  Alışverişe Dön
                </button>
              </div>
            </div>
          ) : (
            // Invoice
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-light">FATURA</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 border border-gray-200 px-3 py-2 text-xs font-medium hover:bg-gray-50"
                  >
                    <PrinterIcon size={14} />
                    Yazdır
                  </button>
                  <button
                    onClick={() => setShowInvoice(false)}
                    className="p-2 hover:opacity-60"
                  >
                    <XIcon size={18} />
                  </button>
                </div>
              </div>
              <div className="border-b border-gray-200 pb-4 mb-4">
                <p className="font-bold text-lg tracking-widest">{settings.storeName}</p>
                <p className="text-xs text-gray-500">Fatura No: INV-{completedOrder.id.toUpperCase()}</p>
                <p className="text-xs text-gray-500">Tarih: {new Date(completedOrder.createdAt).toLocaleDateString('tr-TR')}</p>
              </div>
              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-widest text-gray-500 mb-2">Müşteri</p>
                <p className="text-sm font-medium">{completedOrder.customer.name}</p>
                <p className="text-xs text-gray-500">{completedOrder.customer.email}</p>
                <p className="text-xs text-gray-500">{completedOrder.customer.phone}</p>
                <p className="text-xs text-gray-500">{completedOrder.customer.address}, {completedOrder.customer.city} {completedOrder.customer.postalCode}</p>
              </div>
              <table className="w-full text-xs mb-4">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">Ürün</th>
                    <th className="text-center py-2 text-gray-500 font-medium">Adet</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrder.items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-gray-400">{[item.color, item.size].filter(Boolean).join(' / ')}</p>
                      </td>
                      <td className="text-center py-2">{item.quantity}</td>
                      <td className="text-right py-2">{(item.price * item.quantity).toLocaleString('tr-TR')} ₺</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 text-xs border-t border-gray-200 pt-3">
                <div className="flex justify-between text-gray-500">
                  <span>Ara Toplam</span>
                  <span>{completedOrder.subtotal.toLocaleString('tr-TR')} ₺</span>
                </div>
                {completedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>İndirim ({completedOrder.couponCode})</span>
                    <span>-{completedOrder.discount.toLocaleString('tr-TR')} ₺</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>Kargo</span>
                  <span>Ücretsiz</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-gray-200">
                  <span>GENEL TOPLAM</span>
                  <span>{completedOrder.total.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-400 text-center">
                <p>Takip Kodu: <strong className="text-gray-700 font-mono">{completedOrder.trackingCode}</strong></p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-medium tracking-widest uppercase">Ödeme</h2>
          <button onClick={onClose} className="hover:opacity-60">
            <XIcon size={20} />
          </button>
        </div>

        {/* Steps */}
        <div className="flex border-b border-gray-100">
          {(['info', 'payment', 'confirm'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`flex-1 py-3 text-center text-xs font-medium tracking-widest uppercase transition-colors ${
                step === s
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : i < ['info', 'payment', 'confirm'].indexOf(step)
                  ? 'text-gray-400'
                  : 'text-gray-300'
              }`}
            >
              {i + 1}. {s === 'info' ? 'Bilgiler' : s === 'payment' ? 'Ödeme' : 'Onay'}
            </div>
          ))}
        </div>

        <div className="p-6">
          {/* Step 1: Customer Info */}
          {step === 'info' && (
            <div className="space-y-4">
              <h3 className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-4">
                Teslimat Bilgileri
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ad Soyad *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={`w-full border px-3 py-2.5 text-sm focus:outline-none transition-colors ${errors.name ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
                    placeholder="Ad Soyad"
                  />
                  {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">E-posta *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={`w-full border px-3 py-2.5 text-sm focus:outline-none transition-colors ${errors.email ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
                    placeholder="ornek@email.com"
                  />
                  {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Telefon *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className={`w-full border px-3 py-2.5 text-sm focus:outline-none transition-colors ${errors.phone ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
                    placeholder="05XX XXX XX XX"
                  />
                  {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Şehir *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className={`w-full border px-3 py-2.5 text-sm focus:outline-none transition-colors ${errors.city ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
                    placeholder="İstanbul"
                  />
                  {errors.city && <p className="text-[11px] text-red-500 mt-1">{errors.city}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Adres *</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    rows={2}
                    className={`w-full border px-3 py-2.5 text-sm focus:outline-none resize-none transition-colors ${errors.address ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
                    placeholder="Mahalle, sokak, bina no, daire no"
                  />
                  {errors.address && <p className="text-[11px] text-red-500 mt-1">{errors.address}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Posta Kodu</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                    className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
                    placeholder="34000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && (
            <div>
              <h3 className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-4">
                Ödeme Yöntemi
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`flex flex-col items-center gap-2 border p-4 transition-colors ${
                    paymentMethod === 'credit_card' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCardIcon size={24} />
                  <span className="text-xs font-medium">Kredi Kartı</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`flex flex-col items-center gap-2 border p-4 transition-colors ${
                    paymentMethod === 'bank_transfer' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <BankIcon size={24} />
                  <span className="text-xs font-medium">Havale/EFT</span>
                </button>
              </div>

              {paymentMethod === 'credit_card' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-lg p-5 mb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
                    <p className="text-[10px] tracking-widest opacity-60 mb-4">KREDİ KARTI</p>
                    <p className="font-mono text-lg tracking-[0.3em] mb-4">
                      {card.number || '•••• •••• •••• ••••'}
                    </p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] opacity-60 tracking-widest">KART SAHİBİ</p>
                        <p className="text-sm font-medium tracking-widest uppercase">
                          {card.name || 'AD SOYAD'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] opacity-60 tracking-widest">SON KULLANIM</p>
                        <p className="text-sm font-mono">{card.expiry || 'AA/YY'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Kart Numarası *</label>
                    <input
                      type="text"
                      value={card.number}
                      onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                      className={`w-full border px-3 py-2.5 text-sm font-mono focus:outline-none transition-colors ${errors.cardNumber ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                    />
                    {errors.cardNumber && <p className="text-[11px] text-red-500 mt-1">{errors.cardNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Kart Üzerindeki İsim *</label>
                    <input
                      type="text"
                      value={card.name}
                      onChange={(e) => setCard((c) => ({ ...c, name: e.target.value.toUpperCase() }))}
                      className={`w-full border px-3 py-2.5 text-sm uppercase focus:outline-none transition-colors ${errors.cardName ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
                      placeholder="AD SOYAD"
                    />
                    {errors.cardName && <p className="text-[11px] text-red-500 mt-1">{errors.cardName}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Son Kullanım *</label>
                      <input
                        type="text"
                        value={card.expiry}
                        onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                        className={`w-full border px-3 py-2.5 text-sm font-mono focus:outline-none transition-colors ${errors.expiry ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
                        placeholder="AA/YY"
                        maxLength={5}
                      />
                      {errors.expiry && <p className="text-[11px] text-red-500 mt-1">{errors.expiry}</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">CVV *</label>
                      <input
                        type="text"
                        value={card.cvv}
                        onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                        className={`w-full border px-3 py-2.5 text-sm font-mono focus:outline-none transition-colors ${errors.cvv ? 'border-red-300' : 'border-gray-200 focus:border-gray-400'}`}
                        placeholder="•••"
                        maxLength={3}
                      />
                      {errors.cvv && <p className="text-[11px] text-red-500 mt-1">{errors.cvv}</p>}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 bg-gray-50 px-3 py-2">
                    🔒 Bu sayfa simülasyon amaçlıdır. Gerçek kart bilgisi girilmeyiniz.
                  </p>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="bg-gray-50 border border-gray-200 p-5">
                  <p className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-4">
                    Banka Bilgileri
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Banka</span>
                      <span className="font-medium">{settings.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">IBAN</span>
                      <span className="font-mono font-medium text-xs">{settings.iban}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hesap Sahibi</span>
                      <span className="font-medium">{settings.accountHolder}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-orange-600 mt-4 bg-orange-50 p-2">
                    ⚠️ Havale yaparken açıklama kısmına ad soyadınızı yazmayı unutmayın.
                    Ödeme onaylandıktan sonra siparişiniz hazırlanmaya başlanacaktır.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div>
              <h3 className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-4">
                Sipariş Özeti
              </h3>
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-14 bg-gray-50 overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-gray-400">{[item.color, item.size].filter(Boolean).join(' / ')} × {item.quantity}</p>
                    </div>
                    <span className="text-xs font-medium text-gray-900 flex-shrink-0">
                      {(item.price * item.quantity).toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1.5 mb-5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Ara Toplam</span>
                  <span>{cartTotal.toLocaleString('tr-TR')} ₺</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>İndirim</span>
                    <span>-{discount.toLocaleString('tr-TR')} ₺</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Kargo</span>
                  <span className="text-green-600">Ücretsiz</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-100 pt-2">
                  <span>Toplam</span>
                  <span>{total.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 text-xs text-gray-600 mb-5 space-y-1">
                <p><strong>Teslimat:</strong> {form.name}, {form.address}, {form.city}</p>
                <p><strong>Ödeme:</strong> {paymentMethod === 'credit_card' ? 'Kredi Kartı' : 'Havale/EFT'}</p>
                <p><strong>Tahmini Teslimat:</strong> {settings.cargoDays} iş günü</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {step !== 'info' && (
            <button
              onClick={() => setStep(step === 'payment' ? 'info' : 'payment')}
              className="px-6 py-3 border border-gray-200 text-xs font-medium tracking-widest uppercase hover:bg-gray-50 transition-colors"
            >
              Geri
            </button>
          )}
          {step !== 'confirm' ? (
            <button
              onClick={handleNextStep}
              className="flex-1 bg-gray-900 text-white py-3 text-xs font-medium tracking-widest uppercase hover:bg-gray-700 transition-colors"
            >
              Devam Et
            </button>
          ) : (
            <button
              onClick={handlePlaceOrder}
              disabled={processing}
              className="flex-1 bg-gray-900 text-white py-3 text-xs font-medium tracking-widest uppercase hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processing ? 'İşleniyor...' : 'Siparişi Tamamla'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
