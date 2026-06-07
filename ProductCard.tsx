import { XIcon, HeartFilledIcon, TrashIcon } from './Icons';
import type { Product, FavoriteItem } from '../store/types';

interface FavoritesDrawerProps {
  favorites: FavoriteItem[];
  products: Product[];
  onClose: () => void;
  onRemove: (productId: string) => void;
  onProductClick: (product: Product) => void;
}

export default function FavoritesDrawer({
  favorites,
  products,
  onClose,
  onRemove,
  onProductClick,
}: FavoritesDrawerProps) {
  const favProducts = favorites
    .map((f) => products.find((p) => p.id === f.productId))
    .filter(Boolean) as Product[];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-left">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-medium tracking-widest uppercase flex items-center gap-2">
            <HeartFilledIcon size={16} className="text-red-500" />
            Favorilerim ({favProducts.length})
          </h2>
          <button onClick={onClose} className="hover:opacity-60 transition-opacity">
            <XIcon size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {favProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <HeartFilledIcon size={48} className="text-gray-100 mb-4" />
              <p className="text-sm text-gray-400">Favori listeniz boş</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {favProducts.map((product) => {
                const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
                const isOutOfStock = totalStock === 0;
                return (
                  <div key={product.id} className="flex gap-4 px-6 py-4">
                    <div
                      className="w-20 h-24 bg-gray-50 flex-shrink-0 overflow-hidden cursor-pointer"
                      onClick={() => { onProductClick(product); onClose(); }}
                    >
                      <img
                        src={product.images[0]?.url}
                        alt={product.images[0]?.alt}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 tracking-widest uppercase mb-1">
                        {product.category}
                      </p>
                      <p
                        className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:opacity-70"
                        onClick={() => { onProductClick(product); onClose(); }}
                      >
                        {product.name}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        {product.price.toLocaleString('tr-TR')} ₺
                      </p>
                      {isOutOfStock ? (
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1">
                          Tükendi
                        </span>
                      ) : (
                        <button
                          onClick={() => { onProductClick(product); onClose(); }}
                          className="text-[10px] font-medium tracking-widest uppercase text-gray-900 underline underline-offset-4 hover:opacity-70"
                        >
                          İncele
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => onRemove(product.id)}
                      className="self-start text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
