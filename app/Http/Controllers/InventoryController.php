<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\StockAdjustment;
use App\Models\StockMovement;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::with('category')
            ->paginate(10, ['*'], 'products_page')
            ->withQueryString();

        $categories = ProductCategory::all();
        $suppliers = Supplier::all();

        $movements = StockMovement::with(['product', 'creator'])
            ->latest()
            ->paginate(10, ['*'], 'movements_page')
            ->withQueryString();

        return Inertia::render('Admin/Inventory/Index', [
            'products' => $products,
            'categories' => $categories,
            'suppliers' => $suppliers,
            'movements' => $movements,
        ]);
    }

    public function storeProduct(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:product_categories,id',
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products,sku',
            'barcode' => 'nullable|string|unique:products,barcode',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:20',
        ]);

        $product = Product::create(array_merge($validated, ['status' => 'active']));

        if ($product->stock > 0) {
            StockMovement::create([
                'product_id' => $product->id,
                'type' => 'in',
                'quantity' => $product->stock,
                'notes' => 'Stok awal produk baru',
                'created_by' => auth()->id(),
            ]);
        }

        return back()->with('success', 'Produk baru berhasil ditambahkan ke inventori!');
    }

    public function adjustStock(Request $request, Product $product)
    {
        $validated = $request->validate([
            'actual_stock' => 'required|integer|min:0',
            'reason' => 'required|string|max:255',
        ]);

        $previousStock = $product->stock;
        $actualStock = (int)$validated['actual_stock'];
        $difference = $actualStock - $previousStock;

        StockAdjustment::create([
            'product_id' => $product->id,
            'previous_stock' => $previousStock,
            'actual_stock' => $actualStock,
            'difference' => $difference,
            'reason' => $validated['reason'],
            'adjusted_by' => auth()->id(),
        ]);

        $product->update(['stock' => $actualStock]);

        StockMovement::create([
            'product_id' => $product->id,
            'type' => 'adjustment',
            'quantity' => abs($difference),
            'notes' => "Penyesuaian stok: {$validated['reason']}",
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', "Stok produk {$product->name} berhasil diperbarui menjadi {$actualStock}.");
    }

    public function destroyProduct(Product $product)
    {
        $productName = $product->name;
        $product->delete();

        return back()->with('success', "Produk \"{$productName}\" berhasil dihapus dari inventori!");
    }
}
