import { useState } from 'react';
import { HeartIcon, HeartFilledIcon, EyeIcon } from './Icons';
import type { Product, FavoriteItem } from '../store/types';

interface ProductCardProps {
  product: Product;
  favorites: FavoriteItem[];
  onToggleFavorite: (id: string) => void;
  onProductClick: (product: Product) => void;
}

export default function ProductCard({
  product,
  favorites,
  onToggleFavorite,
  onProductClick,
}: ProductCardProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const isFav = favorites.some((f) => f.productId === product.id);
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const isOutOfStock = totalStock === 0;
  const discountPct =
    product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <article className="group relative bg-white overflow-hidden">
      {/* Image */}
      <div
        className="relative aspect-[3/4] overflow-hidden bg-gray-50 cursor-pointer"
        onClick={() => onProductClick(product)}
        onMouseEnter={() => product.images.length > 1 && setImgIdx(1)}
        onMouseLeave={() => setImgIdx(0)}
      >
        <img
          src={product.images[imgIdx]?.url || product.images[0]?.url}
          alt={product.images[imgIdx]?.alt || product.name}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {discountPct && (
            <span className="bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 tracking-wider">
              -{discountPct}%
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-gray-500 text-white text-[10px] font-bold px-2 py-0.5 tracking-wider">
              TÜKENDİ
            </span>
          )}
          {product.featured && !isOutOfStock && !discountPct && (
            <span className="bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 tracking-wider">
              YENİ
            </span>
          )}
        </div>

        {/* Actions overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id); }}
            className={`w-9 h-9 flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition-colors ${
              isFav ? 'text-red-500' : 'text-gray-600'
            }`}
            aria-label={isFav ? 'Favoriden çıkar' : 'Favorilere ekle'}
          >
            {isFav ? <HeartFilledIcon size={16} /> : <HeartIcon size={16} />}
          </button>
          <button
            onClick={() => onProductClick(product)}
            className="w-9 h-9 flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition-colors text-gray-600"
            aria-label="Hızlı görüntüle"
          >
            <EyeIcon size={16} />
          </button>
        </div>

        {/* Quick add overlay on mobile */}
        {!isOutOfStock && (
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 text-white text-xs font-medium tracking-widest uppercase text-center py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 cursor-pointer"
            onClick={() => onProductClick(product)}
          >
            Hızlı İncele
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pt-3 pb-4">
        <p className="text-[10px] text-gray-400 tracking-widest uppercase mb-1">
          {product.category}
        </p>
        <h3
          className="text-sm font-medium text-gray-900 mb-2 cursor-pointer hover:opacity-70 transition-opacity line-clamp-2"
          onClick={() => onProductClick(product)}
        >
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {product.price.toLocaleString('tr-TR')} ₺
          </span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              {product.originalPrice.toLocaleString('tr-TR')} ₺
            </span>
          )}
        </div>
        {/* Color dots */}
        {(() => {
          const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))];
          return colors.length > 1 ? (
            <div className="flex gap-1 mt-2">
              {colors.slice(0, 5).map((color) => (
                <div
                  key={color}
                  title={color}
                  className="w-3 h-3 rounded-full border border-gray-200"
                  style={{ backgroundColor: colorToHex(color!) }}
                />
              ))}
              {colors.length > 5 && (
                <span className="text-[10px] text-gray-400">+{colors.length - 5}</span>
              )}
            </div>
          ) : null;
        })()}
      </div>
    </article>
  );
}

function colorToHex(color: string): string {
  const map: Record<string, string> = {
    Beyaz: '#f5f5f5',
    Siyah: '#1a1a1a',
    Kırmızı: '#dc2626',
    Lacivert: '#1e3a5f',
    Mavi: '#3b82f6',
    Bej: '#d4b896',
    Krem: '#f0e6d3',
    Kahve: '#7c4a2d',
    Kahverengi: '#7c4a2d',
    Gri: '#9ca3af',
    Yeşil: '#16a34a',
    Sarı: '#eab308',
    Pembe: '#ec4899',
    Mor: '#7c3aed',
  };
  return map[color] || '#e5e7eb';
}
