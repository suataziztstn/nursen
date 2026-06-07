import { useState } from 'react';
import {
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  HeartFilledIcon,
  StarIcon,
} from './Icons';
import type { Product, FavoriteItem, Review } from '../store/types';

interface ProductModalProps {
  product: Product;
  favorites: FavoriteItem[];
  reviews: Review[];
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (productId: string, variantId: string, qty: number) => boolean;
  onAddReview: (review: Omit<Review, 'id'>) => void;
}

export default function ProductModal({
  product,
  favorites,
  reviews,
  onClose,
  onToggleFavorite,
  onAddToCart,
  onAddReview,
}: ProductModalProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    [...new Set(product.variants.map((v) => v.color).filter(Boolean))][0]
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [addedMsg, setAddedMsg] = useState('');
  const [tab, setTab] = useState<'desc' | 'reviews'>('desc');
  const [reviewForm, setReviewForm] = useState({ author: '', rating: 5, comment: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const isFav = favorites.some((f) => f.productId === product.id);
  const productReviews = reviews.filter((r) => r.productId === product.id);
  const avgRating =
    productReviews.length > 0
      ? productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length
      : 0;

  const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))];
  const sizesForColor = [
    ...new Set(
      product.variants
        .filter((v) => !selectedColor || v.color === selectedColor)
        .map((v) => v.size)
        .filter(Boolean)
    ),
  ];
  const selectedVariant = product.variants.find(
    (v) =>
      (!selectedColor || v.color === selectedColor) &&
      (!selectedSize || v.size === selectedSize)
  );

  const isOutOfStock =
    product.variants.reduce((s, v) => s + v.stock, 0) === 0;
  const variantOutOfStock = selectedVariant ? selectedVariant.stock === 0 : false;

  const handleAddToCart = () => {
    if (!selectedVariant) {
      setAddedMsg('Lütfen bir varyasyon seçin.');
      setTimeout(() => setAddedMsg(''), 2000);
      return;
    }
    const success = onAddToCart(product.id, selectedVariant.id, qty);
    if (success) {
      setAddedMsg('Sepete eklendi! ✓');
    } else {
      setAddedMsg('Stok yetersiz.');
    }
    setTimeout(() => setAddedMsg(''), 2000);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.author || !reviewForm.comment) return;
    onAddReview({
      productId: product.id,
      author: reviewForm.author,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      date: new Date().toISOString().split('T')[0],
    });
    setReviewSubmitted(true);
    setReviewForm({ author: '', rating: 5, comment: '' });
  };

  const discountPct =
    product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto sm:rounded-none shadow-2xl animate-slide-up">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition-colors"
        >
          <XIcon size={18} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Images */}
          <div className="relative bg-gray-50">
            <div className="aspect-[3/4] relative overflow-hidden">
              <img
                src={product.images[imgIdx]?.url}
                alt={product.images[imgIdx]?.alt}
                className="w-full h-full object-cover"
              />
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                    disabled={imgIdx === 0}
                  >
                    <ChevronLeftIcon size={18} />
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => Math.min(product.images.length - 1, i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                    disabled={imgIdx === product.images.length - 1}
                  >
                    <ChevronRightIcon size={18} />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 p-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`w-16 h-20 overflow-hidden border-2 transition-colors ${
                      i === imgIdx ? 'border-gray-900' : 'border-transparent'
                    }`}
                  >
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 flex flex-col">
            <p className="text-[10px] text-gray-400 tracking-widest uppercase mb-2">
              {product.category}
            </p>
            <h2 className="text-2xl font-light text-gray-900 mb-3">{product.name}</h2>

            {/* Rating */}
            {productReviews.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      size={14}
                      filled={star <= Math.round(avgRating)}
                      className="text-gray-900"
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">({productReviews.length} yorum)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl font-medium text-gray-900">
                {product.price.toLocaleString('tr-TR')} ₺
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-base text-gray-400 line-through">
                    {product.originalPrice.toLocaleString('tr-TR')} ₺
                  </span>
                  {discountPct && (
                    <span className="text-xs font-bold text-white bg-gray-900 px-2 py-0.5">
                      %{discountPct} İNDİRİM
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Color Selection */}
            {colors.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-2">
                  Renk: <span className="text-gray-900">{selectedColor || 'Seçiniz'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => { setSelectedColor(color); setSelectedSize(undefined); }}
                      className={`px-3 py-1.5 text-xs border transition-colors ${
                        selectedColor === color
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {sizesForColor.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-2">
                  Beden: <span className="text-gray-900">{selectedSize || 'Seçiniz'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizesForColor.map((size) => {
                    const v = product.variants.find(
                      (vv) => vv.size === size && vv.color === selectedColor
                    );
                    const outOfStock = !v || v.stock === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => !outOfStock && setSelectedSize(size)}
                        disabled={outOfStock}
                        className={`w-12 h-10 text-xs border transition-colors relative ${
                          selectedSize === size
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : outOfStock
                            ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {size}
                        {outOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="absolute w-full h-px bg-gray-200 rotate-45" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Qty */}
            {!isOutOfStock && (
              <div className="flex items-center gap-3 mb-6">
                <p className="text-xs font-medium tracking-widest uppercase text-gray-500">Adet:</p>
                <div className="flex items-center border border-gray-200">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm">{qty}</span>
                  <button
                    onClick={() => {
                      const maxStock = selectedVariant?.stock ?? 99;
                      setQty((q) => Math.min(q + 1, maxStock));
                    }}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
                {selectedVariant && (
                  <span className="text-xs text-gray-400">
                    {selectedVariant.stock} adet stokta
                  </span>
                )}
              </div>
            )}

            {/* Add to Cart */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || variantOutOfStock}
                className={`flex-1 py-3.5 text-sm font-medium tracking-widest uppercase transition-all ${
                  isOutOfStock || variantOutOfStock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-700 active:scale-95'
                }`}
              >
                {isOutOfStock
                  ? 'Tükendi'
                  : variantOutOfStock
                  ? 'Bu Varyasyon Tükendi'
                  : addedMsg || 'Sepete Ekle'}
              </button>
              <button
                onClick={() => onToggleFavorite(product.id)}
                className={`w-12 border flex items-center justify-center transition-colors ${
                  isFav
                    ? 'border-gray-900 text-red-500 bg-red-50'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
                aria-label="Favorilere ekle"
              >
                {isFav ? <HeartFilledIcon size={18} /> : <HeartIcon size={18} />}
              </button>
            </div>

            {addedMsg && (
              <p className={`text-xs text-center mb-3 ${addedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>
                {addedMsg}
              </p>
            )}

            {/* Tabs */}
            <div className="border-t border-gray-100 mt-2">
              <div className="flex gap-6 pt-4 mb-4">
                <button
                  onClick={() => setTab('desc')}
                  className={`text-xs font-medium tracking-widest uppercase pb-1 transition-colors ${
                    tab === 'desc'
                      ? 'text-gray-900 border-b border-gray-900'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Açıklama
                </button>
                <button
                  onClick={() => setTab('reviews')}
                  className={`text-xs font-medium tracking-widest uppercase pb-1 transition-colors ${
                    tab === 'reviews'
                      ? 'text-gray-900 border-b border-gray-900'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Yorumlar ({productReviews.length})
                </button>
              </div>

              {tab === 'desc' && (
                <div>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                  {product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4">
                      {product.tags.map((tag) => (
                        <span key={tag} className="text-[10px] text-gray-400 border border-gray-100 px-2 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'reviews' && (
                <div>
                  {productReviews.length === 0 && (
                    <p className="text-sm text-gray-400 mb-4">Henüz yorum yok. İlk yorum siz yapın!</p>
                  )}
                  <div className="space-y-3 mb-4">
                    {productReviews.map((rev) => (
                      <div key={rev.id} className="bg-gray-50 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-900">{rev.author}</span>
                          <span className="text-[10px] text-gray-400">{rev.date}</span>
                        </div>
                        <div className="flex mb-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <StarIcon key={s} size={12} filled={s <= rev.rating} className="text-gray-900" />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600">{rev.comment}</p>
                      </div>
                    ))}
                  </div>

                  {!reviewSubmitted ? (
                    <form onSubmit={handleReviewSubmit} className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-medium tracking-widest uppercase text-gray-500 mb-3">
                        Yorum Yaz
                      </p>
                      <input
                        type="text"
                        placeholder="Adınız"
                        value={reviewForm.author}
                        onChange={(e) => setReviewForm((f) => ({ ...f, author: e.target.value }))}
                        className="w-full border border-gray-200 px-3 py-2 text-sm mb-2 focus:outline-none focus:border-gray-400"
                        required
                      />
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                            className={`transition-colors ${s <= reviewForm.rating ? 'text-gray-900' : 'text-gray-300'}`}
                          >
                            <StarIcon size={20} filled={s <= reviewForm.rating} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        placeholder="Yorumunuz..."
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                        rows={3}
                        className="w-full border border-gray-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:border-gray-400 resize-none"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full bg-gray-900 text-white text-xs font-medium tracking-widest uppercase py-2.5 hover:bg-gray-700 transition-colors"
                      >
                        Yorum Gönder
                      </button>
                    </form>
                  ) : (
                    <p className="text-xs text-green-600 border border-green-100 bg-green-50 px-3 py-2">
                      ✓ Yorumunuz için teşekkürler!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
